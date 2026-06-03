import { BadRequestException, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Coupon } from './entities/coupon.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';

@Injectable()
export class CouponValidationService {
  private logger = new Logger('🎟️ CouponValidationService 🎟️');

  /**
   * Normalize coupon codes to uppercase and trim whitespace.
   */
  normalizeCode(code: string): string {
    return code.toUpperCase().trim();
  }

  /**
   * Ensure a coupon object was found and otherwise throw a bad request.
   */
  checkFound(coupon: Coupon | null, code: string): Coupon {
    if (!coupon) {
      this.logger.warn(`🔍 Coupon not found for: ${code}`);
      throw new HttpException(
        { status: HttpStatus.BAD_REQUEST, error: 'Coupon Not Found or Expired' },
        HttpStatus.BAD_REQUEST,
      );
    }
    return coupon;
  }

  /**
   * Verify coupon validity based on flags and expiration state.
   */
  ensureValid(coupon: Coupon): void {
    if (!coupon.isValid) {
      this.logger.warn(`⏰ Coupon invalid or expired: ${coupon.code}`);
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Coupon is either expired, inactive, or reached its limit',
      });
    }
  }

  /**
   * Convert DTO values into the shape expected for persistence.
   */
  prepareCreateCouponData(createCouponDto: CreateCouponDto): Omit<Partial<Coupon>, 'code' | 'expirationDate'> & { code: string; expirationDate: Date } {
    return {
      code: this.normalizeCode(createCouponDto.code),
      discountPercentage: Number(createCouponDto.discountPercentage),
      maxUses: Number(createCouponDto.userLimit),
      startDate: createCouponDto.startDate,
      expirationDate: new Date(createCouponDto.expirationDate),
      isExpired: createCouponDto.isExpired ?? false,
      isActive: createCouponDto.isActive ?? true,
    };
  }

  /**
   * Prevent duplicate coupon codes by rejecting already existing entries.
   */
  ensureUniqueCode(existingCoupon: Coupon | null, code: string): void {
    if (existingCoupon) {
      this.logger.warn(`🚫 Duplicate coupon blocked: ${code}`);
      throw new BadRequestException(`The coupon code "${code}" already exists.`);
    }
  }
}
