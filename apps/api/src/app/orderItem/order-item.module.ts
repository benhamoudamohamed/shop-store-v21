import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderItem } from './entities/order-item.entity';
import { Purchase } from '../purchase/entities/purchase.entity';
import { Product } from '../product/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderItem, Purchase, Product]),
  ],
  controllers: [],
  providers: [],
})
export class OrderItemModule {}
