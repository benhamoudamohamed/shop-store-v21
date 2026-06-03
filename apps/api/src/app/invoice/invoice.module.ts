import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { Purchase } from '../purchase/entities/purchase.entity';
import { Token } from '../token/entities/token.entity';
import { InvoiceService } from './invoice.service';
import { TokenService } from '../token/token.service';
import { TokenLifecycleService } from '../token/token-lifecycle.service';
import { TokenHashService } from '../token/token-hash.service';
import { PurchaseService } from '../purchase/purchase.service';
import { PurchaseController } from '../purchase/purchase.controller';
import { HelperService } from '../shared/helpers/helper.service';
import { DeliverySlipService } from '../delivery-slip/delivery-slip.service';
import { PurchaseValidationService } from '../purchase/purchase-validation.service';
import { PurchaseItemService } from '../purchase/purchase-item.service';
import { CouponAllocationService } from '../purchase/coupon-allocation.service';
import { CouponValidationService } from '../coupon/coupon-validation.service';
import { PurchaseStatusService } from '../purchase/purchase-status.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, Purchase, Token]),
  ],
  controllers: [PurchaseController],
  providers: [
    InvoiceService,
    PurchaseService,
    PurchaseValidationService,
    PurchaseItemService,
    CouponAllocationService,
    CouponValidationService,
    PurchaseStatusService,
    DeliverySlipService,
    TokenService,
    TokenLifecycleService,
    TokenHashService,
    HelperService,
  ],
})
export class InvoiceModule {}