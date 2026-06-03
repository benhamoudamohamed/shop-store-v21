import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Product } from '../product/entities/product.entity';
import { Purchase } from './entities/purchase.entity';
import { CouponAllocationService } from './coupon-allocation.service';
import { PurchaseStatus } from '@youssef-brand/shared/shared-enums';
import { Invoice } from '../invoice/entities/invoice.entity';
import { DeliverySlip } from '../delivery-slip/entities/delivery-slip.entity';
import { DocumentNumberService } from '../shared/helpers/document-number.service';

@Injectable()
export class PurchaseStatusService {
  protected logger = new Logger('🔄 PurchaseStatusService 🔄');

  constructor(
    private couponAllocationService: CouponAllocationService,
    private documentNumberService: DocumentNumberService,
  ) {}

  async applyStatusTransition(
    purchase: Purchase,
    newStatus: PurchaseStatus,
    manager: EntityManager,
  ): Promise<Purchase> {
    const oldStatus = purchase.status;
    const allocatedStatuses: PurchaseStatus[] = [
      PurchaseStatus.enum.PENDING,
      PurchaseStatus.enum.CONFIRMED,
      PurchaseStatus.enum.SHIPPED,
      PurchaseStatus.enum.DELIVERED,
    ];
    const wasAllocated = allocatedStatuses.includes(oldStatus);
    const willBeAllocated = allocatedStatuses.includes(newStatus);

    if (willBeAllocated && !wasAllocated) {
      await this.allocateStockAndCoupon(purchase, manager);
    } else if (!willBeAllocated && wasAllocated) {
      await this.restoreStockAndCoupon(purchase, manager);
    }

    purchase.status = newStatus;
    const updatedPurchase = await manager.save(purchase);

    if (newStatus === PurchaseStatus.enum.DELIVERED) {
      await this.handleInvoiceGeneration(updatedPurchase, manager);
    }

    if (newStatus === PurchaseStatus.enum.CONFIRMED) {
      await this.handleDeliverySlipGeneration(updatedPurchase, manager);
    }

    this.logger.log(`✅ Status safely changed from ${oldStatus} to ${newStatus} by Admin`);
    return updatedPurchase;
  }

  private async allocateStockAndCoupon(purchase: Purchase, manager: EntityManager): Promise<void> {
    for (const item of purchase.orderItems) {
      const product = await manager.findOne(Product, {
        where: { id: item.product.id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!product) {
        throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
      }
      if (product.stock < item.quantity) {
        throw new HttpException(`${product.name}: Only have ${product.stock} units left`, HttpStatus.BAD_REQUEST);
      }

      product.stock -= item.quantity;
      await manager.save(product);
      this.logger.log(`📉 Re-deducted stock for product ${product.id}`);
    }

    if (purchase.coupon) {
      await this.couponAllocationService.allocateCoupon(purchase.coupon.id, manager);
    }
  }

  private async restoreStockAndCoupon(purchase: Purchase, manager: EntityManager): Promise<void> {
    for (const item of purchase.orderItems) {
      await manager.increment(Product, { id: item.product.id }, 'stock', item.quantity);
      this.logger.log(`♻️ Restored ${item.quantity} units to product ${item.product.id}`);
    }

    if (purchase.coupon) {
      await this.couponAllocationService.restoreCoupon(purchase.coupon.id, manager);
    }
  }

  private async handleInvoiceGeneration(purchase: Purchase, manager: EntityManager): Promise<void> {
    if (purchase.invoice) return;

    const invoiceNumber = await this.documentNumberService.generateInvoiceNumber(manager);

    const invoice = manager.create(Invoice, {
      invoiceNumber,
      subtotalHT: purchase.subtotal,
      totalTax: purchase.totalTax,
      discount: purchase.discount,
      grandTotal: purchase.grandTotal,
      purchase,
    });

    await manager.save(invoice);
    this.logger.log(`🧾 Legal Invoice generated: ${invoiceNumber} for finalized COD tracking.`);
  }

  private async handleDeliverySlipGeneration(purchase: Purchase, manager: EntityManager): Promise<void> {
    if (purchase.deliverySlip) return;

    const slipNumber = await this.documentNumberService.generateDeliverySlipNumber(manager);

    const deliverySlip = manager.create(DeliverySlip, {
      slipNumber,
      subtotalHT: purchase.subtotal,
      totalTax: purchase.totalTax,
      discount: purchase.discount,
      grandTotal: purchase.grandTotal,
      purchase,
    });

    await manager.save(deliverySlip);
    this.logger.log(`🚚 Delivery Slip generated: ${slipNumber} for purchase ${purchase.id}`);
  }
}
