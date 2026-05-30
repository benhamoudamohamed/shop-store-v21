import { BadRequestException, ConflictException, HttpException, HttpStatus, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Coupon } from './entities/coupon.entity';
import { CreateCouponDto, CreateCouponSchema, UpdateExpirationDto, UpdateExpirationSchema } from './dto/create-coupon.dto';
import { Seed } from '../shared/seed/seed.class';

@Injectable()
export class CouponService extends Seed {
  
  protected logger = new Logger('🎟️ CouponService 🎟️')
    
  constructor(
    entityManager: EntityManager,
    @InjectRepository(Coupon)
    private couponRepository: Repository<Coupon>) { 
    super(entityManager)
    // this.fakeIt(Coupon)
  } 
  
  // Start findAll
  async findAll(): Promise<{ data: Partial<Coupon> & { isValid: boolean }[]; count: number }> {    
    try {
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
    catch (error) {
      this.logger.error(`🟥 findAll catch Error: ${error}`)
      throw new HttpException({status: HttpStatus.INTERNAL_SERVER_ERROR, error: 'INTERNAL SERVER ERROR', }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  // End findAll

  // Start findbyId
  async findbyId(id: string): Promise<Coupon>  {
    const coupon = await this.couponRepository.findOne({ where: { id } }); 

    if(!coupon) {
      this.logger.error(`🟥 Coupon not found with id: ${id}`)
      throw new HttpException({status: HttpStatus.NOT_FOUND, error: 'Coupon Not Found', }, HttpStatus.NOT_FOUND);
    }
    try {
      this.logger.log(`🟩 findOne Coupon successfully with id: ${id}`);
      return coupon;
    }
    catch (error) {
      this.logger.error(`🟥 findOne Coupon catch Error: ${error}`)
      throw new HttpException({status: HttpStatus.INTERNAL_SERVER_ERROR, error: 'INTERNAL SERVER ERROR', }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  // End findbyId

  // Start findByCode
  async findByCode(code: string): Promise<Coupon> {
    const normalizedCode = code.toUpperCase().trim();

    const coupon = await this.couponRepository.findOne({ where: { code: normalizedCode } });

    if (!coupon) {
      this.logger.warn(`🔍 Coupon Not Found or Expired for: ${normalizedCode}`);
      throw new HttpException({status: HttpStatus.BAD_REQUEST, error: 'Coupon Not Found or Expired', }, HttpStatus.BAD_REQUEST);
    } 
    if (!coupon.isValid) {
      this.logger.warn(`⏰ Coupon logic failed for: ${normalizedCode}`);
      throw new BadRequestException({status: 400, error: "Coupon is either expired, inactive, or reached its limit"});
    }

    this.logger.log(`✅ Found valid coupon: ${normalizedCode} (${coupon.discountPercentage}%)`);
    return coupon;
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

    // 1. Force Uppercase for consistency in the DB
    const normalizedCode = createCouponDto.code.toUpperCase();

    // 2. Check for duplicate entries in the database
    const existing = await this.couponRepository.findOne({ where: { code: normalizedCode } });

    if (existing) {
      this.logger.warn(`🚫 Duplicate entry blocked: ${normalizedCode}`);
      throw new ConflictException(`The coupon code "${normalizedCode}" already exists.`);
    }

    // 3. Create the entity instance
    const newCoupon = this.couponRepository.create({
      ...createCouponDto,
      code: normalizedCode,
      // Ensure numbers are handled correctly if they come in as strings
      discountPercentage: Number(createCouponDto.discountPercentage),
      userLimit: Number(createCouponDto.userLimit),
      // If your DTO has isActive or startDate, they will be spread here
      isActive: createCouponDto.isActive ?? true,
    });

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
    try {
  
      await this.couponRepository.delete(coupon.id)
      this.logger.log(`🗑️ Coupon Deleted successfully`);
      return { message: 'Coupon Deleted Successfully' };
    }
    catch (error) {
      this.logger.error(`🟥 delete catch Error: ${error}`)
      throw new InternalServerErrorException(error)
    }
  }
  // End delete

}
