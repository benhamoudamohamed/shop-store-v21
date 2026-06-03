import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Coupon } from '../coupon/entities/coupon.entity';

@Injectable()
export class CouponAllocationService {
  protected logger = new Logger('🎟️ CouponAllocationService 🎟️');

  async applyCoupon(
    couponCode: string | undefined,
    totalHT: number,
    manager: EntityManager,
  ): Promise<{ couponEntity: Coupon | null; discount: number }> {
    if (!couponCode) {
      return { couponEntity: null, discount: 0 };
    }

    const couponEntity = await manager.findOne(Coupon, {
      where: { code: couponCode },
      lock: { mode: 'pessimistic_write' },
    });

    if (!couponEntity || !couponEntity.isValid) {
      this.logger.warn(`🎟️ Invalid coupon attempt: ${couponCode}`);
      throw new HttpException('Invalid or expired coupon', HttpStatus.BAD_REQUEST);
    }

    const discount = Number((totalHT * (Number(couponEntity.discountPercentage) / 100)).toFixed(2));

    couponEntity.usedCount += 1;
    if (couponEntity.usedCount >= couponEntity.userLimit) {
      couponEntity.isExpired = true;
    }

    await manager.save(couponEntity);
    this.logger.log(`🎟️ Immediate Allocation: Incremented coupon ${couponEntity.code} usage metrics.`);

    return { couponEntity, discount };
  }

  async allocateCoupon(couponId: string, manager: EntityManager): Promise<void> {
    const coupon = await manager.findOne(Coupon, {
      where: { id: couponId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!coupon) {
      throw new HttpException('Coupon not found', HttpStatus.NOT_FOUND);
    }

    coupon.usedCount += 1;
    if (coupon.usedCount >= coupon.userLimit) {
      coupon.isExpired = true;
    }

    await manager.save(coupon);
    this.logger.log(`🎟️ Re-allocated coupon usage for ${coupon.code}`);
  }

  async restoreCoupon(couponId: string, manager: EntityManager): Promise<void> {
    const coupon = await manager.findOne(Coupon, {
      where: { id: couponId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!coupon) {
      return;
    }

    coupon.usedCount = Math.max(0, (coupon.usedCount || 0) - 1);
    if (coupon.usedCount < coupon.userLimit) {
      coupon.isExpired = false;
    }

    await manager.save(coupon);
    this.logger.log(`🎟️ Restored coupon ${coupon.code} usage.`);
  }
}
