import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Coupon } from './entities/coupon.entity';
import { Token } from '../token/entities/token.entity';
import { CouponService } from './coupon.service';
import { CouponController } from './coupon.controller';
import { CouponValidationService } from './coupon-validation.service';
import { TokenService } from '../token/token.service';
import { TokenLifecycleService } from '../token/token-lifecycle.service';
import { TokenHashService } from '../token/token-hash.service';
import { HelperService } from '../shared/helpers/helper.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Coupon, Token]),
  ],
  controllers: [CouponController],
  providers: [CouponService, CouponValidationService, HelperService, TokenService, TokenLifecycleService, TokenHashService],
})
export class CouponModule {}