import { BadRequestException, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LessThan } from 'typeorm';
import { Purchase } from './entities/purchase.entity';
import { Coupon } from '../coupon/entities/coupon.entity';
import { Product } from '../product/entities/product.entity';
import { OrderItem } from '../orderItem/entities/order-item.entity';
import { CreatePurchaseDto, CreatePurchaseSchema } from './dto/create-purchase.dto';
import { UpdateStatusDto } from './dto/update-status-purchase.dto';
import { PurchaseStatus } from '@youssef-brand/shared/shared-enums';
import { Seed } from '../shared/seed/seed.class';
import { Invoice } from '../invoice/entities/invoice.entity';
import { DeliverySlip } from '../delivery-slip/entities/delivery-slip.entity';
import { TransactionService } from '../shared/helpers/transaction.service';
import { DocumentNumberService } from '../shared/helpers/document-number.service';

@Injectable()
export class PurchaseService extends Seed { 

  protected logger = new Logger('💳 PurchaseService 💳')

  constructor(
    entityManager: EntityManager,
    @InjectRepository(Purchase)
    private purchaseRepository: Repository<Purchase>,
    private dataSource: DataSource,
    private transactionService: TransactionService,
    private documentNumberService: DocumentNumberService) {
    super(entityManager)
    // this.fakeIt(Purchase)
  }

  /**
   * Start findAll
   * Fetches all purchases with optional status filtering, and provides a breakdown of counts by status for dashboard summaries.
  */
  async findAll(status?: string): Promise<{ data: Purchase[]; count: number; breakdown: Record<string, number> }> {    
    // Query A: Fetch the actual rows and total counts
    const mainQuery = this.purchaseRepository
      .createQueryBuilder("purchase")
      .leftJoinAndSelect("purchase.orderItems", "orderItem")
      .leftJoinAndSelect("purchase.invoice", "invoice")
      .leftJoinAndSelect("purchase.deliverySlip", "deliverySlip")
      .orderBy('purchase.createdAt', 'DESC');

    if (status) {
      mainQuery.andWhere("purchase.status = :status", { status });
    }

    const [purchases, count] = await mainQuery.getManyAndCount();

    // Query B: Group by status and count occurrences for dashboard counters 📊
    const rawBreakdown = await this.purchaseRepository
      .createQueryBuilder("purchase")
      .select("purchase.status", "status")
      .addSelect("COUNT(purchase.id)", "total")
      .groupBy("purchase.status")
      .getRawMany();

    // Transform raw SQL output [{ status: 'PENDING', total: '5' }] into a clean object: { PENDING: 5 }
    const breakdown = rawBreakdown.reduce((acc, row) => {
      acc[row.status] = Number(row.total);
      return acc;
    }, {} as Record<string, number>);

    this.logger.log(`🟩 findAll successfully populated list and status summaries`);
    
    return {
      count,
      breakdown,
      data: purchases
    };
  }
 
  /**
   * Start findbyId
   * Fetches a single purchase by ID, including all related entities for comprehensive details.
  */
  async findbyId(id: string): Promise<Purchase>  {
    const purchase = await this.purchaseRepository.findOne({ 
      where: { id }, 
      relations: ['orderItems', 'orderItems.product', 'coupon', 'invoice', 'deliverySlip']
    }); 
    if(!purchase) {
      this.logger.error(`🟥 Purchase not found with id: ${id}`)
      throw new HttpException({status: HttpStatus.NOT_FOUND, error: 'Purchase Not Found', }, HttpStatus.NOT_FOUND);
    }
    
    this.logger.log(`🟩 findOne Purchase successfully with id: ${id}`);
    return purchase;
  }

  /**
   * Start getInvoiceIdByPurchaseId
   * Fetches the invoice ID associated with a specific purchase ID.
  */
  async getInvoiceIdByPurchaseId(id: string): Promise<string> {
    const purchase = await this.purchaseRepository.findOne({
      where: { id: (id) }, // Handles numeric mapping safely
      relations: ['invoice'],
      select: {
        id: true,
        invoice: { id: true } // Only pull the ID from DB to optimize memory
      }
    });

    if (!purchase || !purchase.invoice) {
      throw new HttpException('No legal invoice associated with this purchase record yet.', HttpStatus.NOT_FOUND);
    }

    return purchase.invoice.id;
  }

  /**
   * Start create
   * Handles the entire checkout process:
  */
  async create(createPurchaseDto: CreatePurchaseDto): Promise<Purchase> {
    // 00. Fail fast if schema validation rejects input
    this.validatePurchasePayload(createPurchaseDto);
    
    return await this.transactionService.run(async (manager) => {
      this.logger.log(`🏁 Starting checkout transaction for: ${createPurchaseDto.email}`);

      // 1. Process items (validates stock, deducts inventory, builds OrderItem entities)
      const { orderItems, totalHT, totalTax } = await this.processProductItems(
        createPurchaseDto.productItems,
        manager,
      );

      // 2. Process coupon if provided
      const { couponEntity, discount } = await this.handleCouponApplication(
        createPurchaseDto.coupon,
        totalHT,
        manager,
      );

      // 3. Compute final grand total financial matrix
      const grandTotal = Number((totalHT + totalTax - discount).toFixed(2));

      // 4. Instantiate and commit the main purchase entity log
      const purchase = manager.create(Purchase, {
        clientName: createPurchaseDto.clientName,
        email: createPurchaseDto.email,
        phone: createPurchaseDto.phone,
        address: createPurchaseDto.address,
        subtotal: totalHT,
        totalTax: Number(totalTax.toFixed(2)),
        discount,
        grandTotal,
        orderItems,
        couponCode: createPurchaseDto.coupon,
        status: PurchaseStatus.enum.PENDING,
        coupon: couponEntity ?? undefined,
      });

      const savedPurchase = await manager.save(purchase);
      this.logger.log(`💰 Checkout completed! ID: ${savedPurchase.id} - Total: ${grandTotal} TND`);
      return savedPurchase;
    });
  }

  /**
   * Start updateStatus
   * Handles status updates with safe stock and coupon adjustments.
   * Implements two main scenarios:
  */
  async updateStatus(purchaseId: string, updateStatusDto: UpdateStatusDto): Promise<Purchase> {
    return await this.transactionService.run(async (manager) => {
      const purchase = await manager.findOne(Purchase, {
        where: { id: purchaseId },
        relations: ['orderItems', 'orderItems.product', 'coupon', 'invoice', 'deliverySlip'],
      });

      if (!purchase) throw new HttpException('Purchase not found', HttpStatus.BAD_REQUEST);

      const oldStatus = purchase.status;
      const { status: newStatus } = updateStatusDto;

      const allocatedStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
      const wasAllocated = allocatedStatuses.includes(oldStatus);
      const willBeAllocated = allocatedStatuses.includes(newStatus);

      // 🛑 SCENARIO A: Revert cancellation -> Re-deduct stock
      if (willBeAllocated && !wasAllocated) {
        await this.allocateStockAndCoupon(purchase, manager);
      }
      // 🛑 SCENARIO B: Move into Cancelled or Returned -> Return stock
      else if (!willBeAllocated && wasAllocated) {
        await this.restoreStockAndCoupon(purchase, manager);
      }

      // Update state parameters
      purchase.status = newStatus;
      const updatedPurchase = await manager.save(purchase);

      // 🧾 AUTOMATIC INVOICE GENERATION WINDOW (PATTERN A)
      if (newStatus === PurchaseStatus.enum.DELIVERED) {
        await this.handleInvoiceGeneration(updatedPurchase, manager);
      }

      // 📦 DELIVERY SLIP GENERATION WINDOW
      if (newStatus === PurchaseStatus.enum.CONFIRMED) {
        await this.handleDeliverySlipGeneration(updatedPurchase, manager);
      }

      this.logger.log(`✅ Status safely changed from ${oldStatus} to ${newStatus} by Admin`);
      return updatedPurchase;
    });
  }

  /**
   * Start delete
   * Deletes a purchase and all its related order items.
  */
  async delete(id: string): Promise<{ message: string }> {
    const purchase = await this.purchaseRepository.findOne({ 
      where: { id },
      relations: ['orderItems']
    }); 
    
    if(!purchase) {
      this.logger.error(`🟥 Purchase not found with id: ${id}`)
      throw new HttpException({status: HttpStatus.NOT_FOUND, error: 'Purchase Not Found', }, HttpStatus.NOT_FOUND);
    }
    
    await this.purchaseRepository.remove(purchase);
    this.logger.log(`🗑️ delete purchase successfully`);
    return { message: 'Purchase Deleted Successfully' }; 
  }


  // ==========================================
  // start Create HELPER METHODS ✂️
  // ==========================================
  /**
   * Start validatePurchasePayload
   * Performed upfront validation using Zod schema to catch malformed requests before any DB operations, ensuring cleaner transaction scopes and more informative error responses.
  */
  private validatePurchasePayload(dto: CreatePurchaseDto): void {
    const validation = CreatePurchaseSchema.safeParse(dto);
    if (!validation.success) {
      const formattedErrors = validation.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST, 
        error: "Validation Failed", 
        details: formattedErrors
      });
    }
  }

  /**
   * Start processProductItems
   * Validates product availability, calculates financials, and applies immediate stock deductions to prevent overselling under concurrent loads.
  */
  private async processProductItems(
    productItems: CreatePurchaseDto['productItems'], 
    manager: EntityManager
  ): Promise<{ orderItems: OrderItem[]; totalHT: number; totalTax: number }> {
    let totalHT = 0;
    let totalTax = 0;
    const orderItems: OrderItem[] = [];

    for (const item of productItems) {
      // Lock the individual product row immediately to prevent high-traffic race conditions 🔒
      const product = await manager.findOne(Product, { 
        where: { id: item.productId },
        lock: { mode: 'pessimistic_write' } 
      });

      if (!product) throw new HttpException(`Product with ID ${item.productId} not found`, HttpStatus.NOT_FOUND);
      if (!product.isAvailable) throw new HttpException(`${product.name} is currently unavailable`, HttpStatus.BAD_REQUEST);
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

      // 📉 Deduct inventory allocations safely within the active transaction scope
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

  /**
   * Start handleCouponApplication
   * Handles coupon validation, discount calculation, and immediate usage allocation to prevent overselling under concurrent loads.
  */
  private async handleCouponApplication(
    couponCode: string | undefined, 
    totalHT: number, 
    manager: EntityManager
  ): Promise<{ couponEntity: Coupon | null; discount: number }> {
    if (!couponCode) {
      return { couponEntity: null, discount: 0 };
    }

    // Lock the coupon row to avoid duplicate use bypasses under multi-thread loads 🔒
    const couponEntity = await manager.findOne(Coupon, { 
      where: { code: couponCode },
      lock: { mode: 'pessimistic_write' }
    });

    if (!couponEntity || !couponEntity.isValid) {
      this.logger.warn(`🎟️ Invalid coupon attempt: ${couponCode}`);
      throw new HttpException('Invalid or expired coupon', HttpStatus.BAD_REQUEST);
    }

    const discount = Number((totalHT * (Number(couponEntity.discountPercentage) / 100)).toFixed(2));
    
    // 🎟️ Consume use counter limits immediately
    couponEntity.usedCount += 1;
    if (couponEntity.usedCount >= couponEntity.userLimit) {
      couponEntity.isExpired = true;
    }
    
    await manager.save(couponEntity);
    this.logger.log(`🎟️ Immediate Allocation: Incremented coupon ${couponEntity.code} usage metrics.`);

    return { couponEntity, discount };
  }
  // ==========================================
  // End of Create HELPER METHODS ✂️
  // ==========================================

  // ==========================================
  // start of updateStatus HELPER METHODS ✂️
  // ==========================================

  /**
   * Start allocateStockAndCoupon
   * Handles status updates with safe stock and coupon adjustments.
  */
  private async allocateStockAndCoupon(purchase: Purchase, manager: EntityManager): Promise<void> {
    for (const item of purchase.orderItems) {
      const product = await manager.findOne(Product, {
        where: { id: item.product.id },
        lock: { mode: 'pessimistic_write' }
      });
      if (!product) throw new HttpException(`Product not found`, HttpStatus.NOT_FOUND);
      if (product.stock < item.quantity) {
        throw new HttpException(`${product.name}: Only have ${product.stock} units left`, HttpStatus.BAD_REQUEST);
      }

      product.stock -= item.quantity;
      await manager.save(product);
      this.logger.log(`📉 Re-deducted stock for product ${product.id}`);
    }

    if (purchase.coupon) {
      const coupon = await manager.findOne(Coupon, {
        where: { id: purchase.coupon.id },
        lock: { mode: 'pessimistic_write' }
      });
      if (!coupon) throw new HttpException('Coupon not found', HttpStatus.NOT_FOUND);
      coupon.usedCount += 1;
      if (coupon.usedCount >= coupon.userLimit) coupon.isExpired = true;
      await manager.save(coupon);
    }
  }

  /**
   * Start restoreStockAndCoupon
   * Handles status updates with safe stock and coupon adjustments.
  */
  private async restoreStockAndCoupon(purchase: Purchase, manager: EntityManager): Promise<void> {
    for (const item of purchase.orderItems) {
      await manager.increment(Product, { id: item.product.id }, 'stock', item.quantity);
      this.logger.log(`♻️ Restored ${item.quantity} units to product ${item.product.id}`);
    }

    if (purchase.coupon) {
      const coupon = await manager.findOne(Coupon, {
        where: { id: purchase.coupon.id },
        lock: { mode: 'pessimistic_write' }
      });
      if (coupon) {
        coupon.usedCount = Math.max(0, (coupon.usedCount || 0) - 1);
        if (coupon.usedCount < coupon.userLimit) coupon.isExpired = false;
        await manager.save(coupon);
        this.logger.log(`🎟️ Restored coupon ${coupon.code} usage.`);
      }
    }
  }

  /**
   * Start handleInvoiceGeneration
   * Generates a legal invoice when an order is marked as DELIVERED, ensuring one invoice per purchase and sequential numbering.
   * This is crucial for COD tracking and serves as a legal document for tax authorities.
  */
  private async handleInvoiceGeneration(purchase: Purchase, manager: EntityManager): Promise<void> {
    if (purchase.invoice) return;

    const invoiceNumber = await this.documentNumberService.generateInvoiceNumber(manager);

    const invoice = manager.create(Invoice, {
      invoiceNumber,
      subtotalHT: purchase.subtotal,
      totalTax: purchase.totalTax,
      discount: purchase.discount,
      grandTotal: purchase.grandTotal,
      purchase: purchase,
    });

    await manager.save(invoice);
    this.logger.log(`🧾 Legal Invoice generated: ${invoiceNumber} for finalized COD tracking.`);
  }

  /**
   * Start handleDeliverySlipGeneration
   * Generates a delivery slip when an order is confirmed, ensuring one slip per purchase and sequential numbering.
   * This is crucial for logistics and serves as a legal document for deliveries.
  */
  private async handleDeliverySlipGeneration(purchase: Purchase, manager: EntityManager): Promise<void> {
    if (purchase.deliverySlip) return;

    const slipNumber = await this.documentNumberService.generateDeliverySlipNumber(manager);

    const deliverySlip = manager.create(DeliverySlip, {
      slipNumber,
      subtotalHT: purchase.subtotal,
      totalTax: purchase.totalTax,
      discount: purchase.discount,
      grandTotal: purchase.grandTotal,
      purchase: purchase,
    });

    await manager.save(deliverySlip);
    this.logger.log(`🚚 Delivery Slip generated: ${slipNumber} for purchase ${purchase.id}`);
  }

  // ==========================================
  // End of updateStatus HELPER METHODS ✂️
  // ==========================================

  // ==========================================
  // Cron METHODS ✂️
  // ==========================================
  /**
   * Daily cleanup task running at midnight.
   * Cancels PENDING orders that have received no phone confirmation after 5 days.
  */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) 
  async handleAbandonedCODOrders(): Promise<void> {
    this.logger.log('⏰ Running midnight cleanup for stale COD orders...');
    
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    try {
      const stalePurchases = await this.dataSource.manager.find(Purchase, {
        where: {
          status: PurchaseStatus.enum.PENDING,
          createdAt: LessThan(fiveDaysAgo)
        }
      });

      for (const purchase of stalePurchases) {
        await this.updateStatus(purchase.id, { status: PurchaseStatus.enum.CANCELLED });
        this.logger.log(`🗑️ Automatically cancelled stagnant order ${purchase.id} due to inactivity.`);
      }
    } catch (error) {
      this.logger.error(`❌ Stale orders cleanup failed: ${error}`);
      throw error;
    }
  }
}
