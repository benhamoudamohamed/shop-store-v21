import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Purchase } from './entities/purchase.entity';
import { DeliverySlip } from '../delivery-slip/entities/delivery-slip.entity';
import { OrderItem } from '../orderItem/entities/order-item.entity';
import { Product } from '../product/entities/product.entity';
import { Coupon } from '../coupon/entities/coupon.entity';
import { Token } from '../token/entities/token.entity';
import { PurchaseService } from './purchase.service';
import { PurchaseController } from './purchase.controller';
import { DeliverySlipService } from '../delivery-slip/delivery-slip.service';
import { HelperService } from '../shared/helpers/helper.service';
import { TokenService } from '../token/token.service';
import { TokenLifecycleService } from '../token/token-lifecycle.service';
import { TokenHashService } from '../token/token-hash.service';
import { ScheduleModule } from '@nestjs/schedule';
import { InvoiceService } from '../invoice/invoice.service';
import { PurchaseValidationService } from './purchase-validation.service';
import { PurchaseItemService } from './purchase-item.service';
import { CouponAllocationService } from './coupon-allocation.service';
import { CouponValidationService } from '../coupon/coupon-validation.service';
import { PurchaseStatusService } from './purchase-status.service';
import { PurchaseCleanupService } from './purchase-cleanup.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Purchase, DeliverySlip, OrderItem, Product, Coupon, Token]),
    ScheduleModule.forRoot(),
  ],
  controllers: [PurchaseController],
  providers: [
    PurchaseService,
    PurchaseValidationService,
    PurchaseItemService,
    CouponAllocationService,
    CouponValidationService,
    PurchaseStatusService,
    PurchaseCleanupService,
    InvoiceService,
    DeliverySlipService,
    TokenService,
    TokenLifecycleService,
    TokenHashService,
    HelperService,
  ],
}) 
export class PurchaseModule {}