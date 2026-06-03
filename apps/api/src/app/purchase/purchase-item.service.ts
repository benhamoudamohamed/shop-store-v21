import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Product } from '../product/entities/product.entity';
import { OrderItem } from '../orderItem/entities/order-item.entity';
import { CreatePurchaseDto } from './dto/create-purchase.dto';

@Injectable()
export class PurchaseItemService {
  protected logger = new Logger('💳 PurchaseItemService 💳');

  async processProductItems(
    productItems: CreatePurchaseDto['productItems'],
    manager: EntityManager,
  ): Promise<{ orderItems: OrderItem[]; totalHT: number; totalTax: number }> {
    let totalHT = 0;
    let totalTax = 0;
    const orderItems: OrderItem[] = [];

    for (const item of productItems) {
      const product = await manager.findOne(Product, {
        where: { id: item.productId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!product) {
        throw new HttpException(`Product with ID ${item.productId} not found`, HttpStatus.NOT_FOUND);
      }
      if (!product.isAvailable) {
        throw new HttpException(`${product.name} is currently unavailable`, HttpStatus.BAD_REQUEST);
      }
      if (product.stock < item.quantity) {
        throw new HttpException(`${product.name}: Only has ${product.stock} units left in stock`, HttpStatus.BAD_REQUEST);
      }

      const currentPrice = Number(product.unitPrice);
      const currentTvaRate = Number(product.tvaRate);

      const itemTotalHT = Number((currentPrice * item.quantity).toFixed(2));
      const itemTvaAmount = Number(((itemTotalHT * currentTvaRate) / 100).toFixed(2));
      const itemTotalTTC = Number((itemTotalHT + itemTvaAmount).toFixed(2));

      totalHT += itemTotalHT;
      totalTax += itemTvaAmount;

      product.stock -= item.quantity;
      await manager.save(product);
      this.logger.log(`📉 Immediate Allocation: Decreased stock for product ${product.id} by ${item.quantity}`);

      const orderItem = manager.create(OrderItem, {
        product,
        quantity: item.quantity,
        unitpriceAtPurchase: currentPrice,
        tvaRate: currentTvaRate,
        tvaAmount: itemTvaAmount,
        totalHT: itemTotalHT,
        totalTTC: itemTotalTTC,
      });

      orderItems.push(orderItem);
    }

    return { orderItems, totalHT, totalTax };
  }
}
