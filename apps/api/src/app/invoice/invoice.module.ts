import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { Purchase } from '../purchase/entities/purchase.entity';
import { Token } from '../token/entities/token.entity';
import { InvoiceService } from './invoice.service';
import { TokenService } from '../token/token.service';
import { PurchaseService } from '../purchase/purchase.service';
import { PurchaseController } from '../purchase/purchase.controller';
import { HelperService } from '../shared/helpers/helper.service';
import { DeliverySlipService } from '../delivery-slip/delivery-slip.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, Purchase, Token]),
  ],
  controllers: [PurchaseController],
  providers: [InvoiceService, PurchaseService, DeliverySlipService, TokenService, HelperService],
})
export class InvoiceModule {}