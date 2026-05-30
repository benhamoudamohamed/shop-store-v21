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
import { ScheduleModule } from '@nestjs/schedule';
import { InvoiceService } from '../invoice/invoice.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Purchase, DeliverySlip, OrderItem, Product, Coupon, Token]),
    ScheduleModule.forRoot(),
  ],
  controllers: [PurchaseController],
  providers: [PurchaseService, InvoiceService, DeliverySlipService, TokenService, HelperService],
}) 
export class PurchaseModule {}