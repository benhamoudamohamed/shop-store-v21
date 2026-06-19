import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Purchase } from './entities/purchase.entity';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdateStatusDto } from './dto/update-status-purchase.dto';
import { PurchaseStatus } from '@youssef-brand/shared/shared-enums';
import { Seed } from '../shared/seed/seed.class';
import { TransactionService } from '../shared/helpers/transaction.service';
import { PurchaseValidationService } from './purchase-validation.service';
import { PurchaseItemService } from './purchase-item.service';
import { CouponAllocationService } from './coupon-allocation.service';
import { PurchaseStatusService } from './purchase-status.service';

@Injectable()
export class PurchaseService extends Seed { 

  protected logger = new Logger('💳 PurchaseService 💳')

  constructor(
    entityManager: EntityManager,
    @InjectRepository(Purchase)
    private purchaseRepository: Repository<Purchase>,
    private transactionService: TransactionService,
    private purchaseValidationService: PurchaseValidationService,
    private purchaseItemService: PurchaseItemService,
    private couponAllocationService: CouponAllocationService,
    private purchaseStatusService: PurchaseStatusService,
  ) {
    super(entityManager)
    // this.fakeIt(Purchase);
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
   * Fetches and returns the invoice identifier linked to a given purchase.
   * Uses a lightweight DB projection to only retrieve the purchase and invoice IDs.
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
   * Handles the full checkout workflow, validates payload, builds order items,
   * applies a coupon, computes totals, and persists the purchase record.
  */
  async create(createPurchaseDto: CreatePurchaseDto): Promise<Purchase> {
    this.purchaseValidationService.validatePurchasePayload(createPurchaseDto);
    
    return await this.transactionService.run(async (manager) => {
      this.logger.log(`🏁 Starting checkout transaction for: ${createPurchaseDto.email}`);

      const { orderItems, totalHT, totalTax } = await this.purchaseItemService.processProductItems(
        createPurchaseDto.productItems,
        manager,
      );

      const { couponEntity, discount } = await this.couponAllocationService.applyCoupon(
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
   * Processes state transitions for a purchase, applying stock and coupon logic
   * through the dedicated PurchaseStatusService.
  */
  async updateStatus(purchaseId: string, updateStatusDto: UpdateStatusDto): Promise<Purchase> {
    return await this.transactionService.run(async (manager) => {
      const purchase = await manager.findOne(Purchase, {
        where: { id: purchaseId },
        relations: ['orderItems', 'orderItems.product', 'coupon', 'invoice', 'deliverySlip'],
      });

      if (!purchase) throw new HttpException('Purchase not found', HttpStatus.BAD_REQUEST);

      return await this.purchaseStatusService.applyStatusTransition(purchase, updateStatusDto.status, manager);
    });
  }

  /**
   * Start delete
   * Removes a purchase record and cascades deletion to its related order items.
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
}
