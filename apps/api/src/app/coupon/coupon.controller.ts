import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, Delete, UseGuards, Put } from '@nestjs/common';
import { Coupon } from './entities/coupon.entity';
import { CouponService } from './coupon.service';
import { CreateCouponDto, UpdateExpirationDto } from './dto/create-coupon.dto';
import { AuthenticationGuard } from '../shared/auth/auth.guard';

@Controller('coupon')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @UseGuards(AuthenticationGuard)
  @Get('/all')
  @HttpCode(HttpStatus.OK)
  async getAll(): Promise<{ data: Partial<Coupon> & { isValid: boolean }[]; count: number }> {  
    return await this.couponService.findAll();
  }

  @UseGuards(AuthenticationGuard)
  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  async findbyId(@Param('id') id: string): Promise<Coupon> {  
    return await this.couponService.findbyId(id);
  }

  @Get('/code/:code')
  @HttpCode(HttpStatus.OK)
  async findByCode(@Param('code') code: string): Promise<Coupon> {
    return await this.couponService.findByCode(code);
  }
 
  @UseGuards(AuthenticationGuard)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() data: CreateCouponDto): Promise<Coupon> {
    return await this.couponService.create(data);
  }
 
  @UseGuards(AuthenticationGuard)
  @Put(':id/status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(@Param('id') id: string, @Body() data: UpdateExpirationDto): Promise<Coupon> {
    return await this.couponService.updateStatus(id, data);
  }

  @UseGuards(AuthenticationGuard)
  @Delete('/:id')
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    return await this.couponService.delete(id);
  }  
}
