import { Injectable, Logger } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Coupon } from '../coupon/entities/coupon.entity';
import { CouponValidationService } from '../coupon/coupon-validation.service';

@Injectable()
export class CouponAllocationService {
  protected logger = new Logger('🎟️ CouponAllocationService 🎟️');

  constructor(private couponValidationService: CouponValidationService) {} 

  async applyCoupon(
    couponCode: string | undefined,
    totalHT: number,
    manager: EntityManager,
  ): Promise<{ couponEntity: Coupon | null; discount: number }> {
    if (!couponCode) {
      return { couponEntity: null, discount: 0 };
    }

    const normalizedCode = this.couponValidationService.normalizeCode(couponCode);

    const couponEntity = await manager
      .createQueryBuilder(Coupon, 'coupon')
      .setLock('pessimistic_write')
      .where('coupon.code = :code', { code: normalizedCode })
      .getOne();

    const validatedCoupon = this.couponValidationService.checkFound(couponEntity, normalizedCode);
    this.couponValidationService.ensureValid(validatedCoupon);

    const discount = Number((totalHT * (Number(validatedCoupon.discountPercentage) / 100)).toFixed(2));

    validatedCoupon.usedCount += 1;
    if (validatedCoupon.usedCount >= validatedCoupon.maxUses) {
      validatedCoupon.isExpired = true;
    }

    await manager.save(validatedCoupon);
    this.logger.log(`🎟️ Immediate Allocation: Incremented coupon ${validatedCoupon.code} usage metrics.`);

    return { couponEntity: validatedCoupon, discount };
  }

  async allocateCoupon(couponId: string, manager: EntityManager): Promise<void> {
    const coupon = await manager.findOne(Coupon, {
      where: { id: couponId },
      lock: { mode: 'pessimistic_write' },
    });

    const validatedCoupon = this.couponValidationService.checkFound(coupon, couponId);
    this.couponValidationService.ensureValid(validatedCoupon);

    validatedCoupon.usedCount += 1;
    if (validatedCoupon.usedCount >= validatedCoupon.maxUses) {
      validatedCoupon.isExpired = true;
    }

    await manager.save(validatedCoupon);
    this.logger.log(`🎟️ Re-allocated coupon usage for ${validatedCoupon.code}`);
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
    if (coupon.usedCount < coupon.maxUses) {
      coupon.isExpired = false;
    }

    await manager.save(coupon);
    this.logger.log(`🎟️ Restored coupon ${coupon.code} usage.`);
  }
}
