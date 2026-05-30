import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coupon } from './entities/coupon.entity';
import { Token } from '../token/entities/token.entity';
import { CouponService } from './coupon.service';
import { CouponController } from './coupon.controller';
import { TokenService } from '../token/token.service';
import { HelperService } from '../shared/helpers/helper.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Coupon, Token]),
  ],
  controllers: [CouponController],
  providers: [CouponService, HelperService, TokenService],
})
export class CouponModule {}