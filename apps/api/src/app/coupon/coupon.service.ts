import { BadRequestException, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Coupon } from './entities/coupon.entity';
import { CreateCouponDto, CreateCouponSchema, UpdateExpirationDto, UpdateExpirationSchema } from './dto/create-coupon.dto';
import { Seed } from '../shared/seed/seed.class';
import { CouponValidationService } from './coupon-validation.service';

@Injectable()
export class CouponService extends Seed {
  
  protected logger = new Logger('🎟️ CouponService 🎟️')
    
  constructor(
    entityManager: EntityManager,
    @InjectRepository(Coupon)
    private couponRepository: Repository<Coupon>,
    private couponValidationService: CouponValidationService,
  ) { 
    super(entityManager)
    // this.fakeIt(Coupon) 
  } 
  
  // Start findAll
  async findAll(): Promise<{ data: Partial<Coupon> & { isValid: boolean }[]; count: number }> {    
    
    const [coupons, count] = await this.couponRepository
    .createQueryBuilder("coupon")
    .orderBy('coupon.createdAt', 'DESC')
    .getManyAndCount()

    const dataWithValidity = coupons.map(coupon => {
      const { ...couponData } = coupon; 
      return {
        ...couponData,
        isValid: coupon.isValid
      };
    });

    this.logger.log(`🟩 findAll successfully`);
    return {
      count: count,
      data: dataWithValidity,
    };
  }
  // End findAll

  // Start findbyId
  async findbyId(id: string): Promise<Coupon>  {
    const coupon = await this.couponRepository.findOne({ where: { id } }); 

    if(!coupon) {
      this.logger.error(`🟥 Coupon not found with id: ${id}`)
      throw new HttpException({status: HttpStatus.NOT_FOUND, error: 'Coupon Not Found', }, HttpStatus.NOT_FOUND);
    }
    
    this.logger.log(`🟩 findOne Coupon successfully with id: ${id}`);
    return coupon;
  }
  // End findbyId

  // Start findByCode
  async findByCode(code: string): Promise<Coupon> {
    const normalizedCode = this.couponValidationService.normalizeCode(code);

    const coupon = await this.couponRepository.findOne({ where: { code: normalizedCode } });
    const validatedCoupon = this.couponValidationService.checkFound(coupon, normalizedCode);
    this.couponValidationService.ensureValid(validatedCoupon);

    this.logger.log(`✅ Found valid coupon: ${normalizedCode} (${validatedCoupon.discountPercentage}%)`);
    return validatedCoupon;
  }
  // End findByCode

  // Start create
  async create(createCouponDto: CreateCouponDto): Promise<Coupon> {
    this.logger.log(` 🔍 Attempting to create coupon: ${createCouponDto.code}`);

    const result = CreateCouponSchema.safeParse(createCouponDto);
    if (!result.success) {
      const errors = result.error.issues.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
      this.logger.warn(`🚫 Validation failed for coupon: ${createCouponDto.code}. Errors: ${JSON.stringify(errors)}`)
      throw new HttpException({statusCode: HttpStatus.BAD_REQUEST, message: 'Validation failed', errors: errors}, HttpStatus.BAD_REQUEST);
    }

    const createPayload = this.couponValidationService.prepareCreateCouponData(createCouponDto);

    const existing = await this.couponRepository.findOne({ where: { code: createPayload.code } });
    this.couponValidationService.ensureUniqueCode(existing, createPayload.code);

    const newCoupon = this.couponRepository.create(createPayload);

    // 4. Save to database
    const savedCoupon = await this.couponRepository.save(newCoupon);
    this.logger.log(`✅ Coupon ${savedCoupon.code} created successfully.`);

    return savedCoupon;
  }
  // End create

   // Start change expiration status
  async updateStatus(couponId: string, data: UpdateExpirationDto): Promise<Coupon> {
    this.logger.log(`🔍 Attempting to update expiration status for coupon: ${couponId}`);

    const result = UpdateExpirationSchema.safeParse(data);
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      this.logger.warn(`🚫 Invalid expiration payload for coupon ${couponId}: ${JSON.stringify(errors)}`);
      throw new BadRequestException({statusCode: HttpStatus.BAD_REQUEST, message: 'Validation failed', errors});    
    }

    const { isExpired, isActive } = result.data;
    const coupon = await this.couponRepository.findOne({ where: { id: couponId } });

    if (!coupon) {
      this.logger.warn(`🚫 Coupon not found: ${couponId}`);
      throw new BadRequestException(`The coupon with ID "${couponId}" was not found.`);
    }

    if (isExpired !== undefined) coupon.isExpired = isExpired;
    if (isActive !== undefined) coupon.isActive = isActive;
    const updatedCoupon = await this.couponRepository.save(coupon);
    this.logger.log(`✅ Expiration status updated for coupon: ${updatedCoupon.code}`);

    return updatedCoupon;
  }
  // End change expiration status

  // Start delete
  async delete(id: string): Promise<{ message: string }> {
    const coupon = await this.couponRepository.findOne({ where: { id } });

    if(!coupon) {
      this.logger.error(`🟥 Coupon not found with id: ${id}`)
      throw new HttpException({status: HttpStatus.NOT_FOUND, error: 'Coupon Not Found', }, HttpStatus.NOT_FOUND);
    }   

    await this.couponRepository.delete(coupon.id)
    this.logger.log(`🗑️ Coupon Deleted successfully`);
    return { message: 'Coupon Deleted Successfully' };
  }
  // End delete
}
