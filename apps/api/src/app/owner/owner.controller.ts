import { Controller, Get, Body, Param, HttpCode, HttpStatus, UseGuards, Put } from '@nestjs/common';
import { OwnerService } from './owner.service';
import { AuthenticationGuard } from '../shared/auth/auth.guard';
import { Owner } from './entities/owner.entity';
import { RolesGuard } from '../shared/auth/roles.guard';
import { RolesDecorator } from '../shared/auth/roles.decorator';
import { UserRole } from '@youssef-brand/shared/shared-enums';
import { UpdateUserPasswordDto } from '@youssef-brand/shared/shared-dto';

@Controller('owner')
export class OwnerController {
  constructor(private readonly ownerService: OwnerService) {}
  
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.enum.OWNER)
  @Get('all')
  @HttpCode(HttpStatus.OK)
  findAllUsers(): Promise<{ data: Owner[]; count: number }> {  
    return this.ownerService.findAllUsers();
  }

  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.enum.OWNER)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findbyId(@Param('id') id: string) {
    return this.ownerService.findbyId(id);
  }

  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.enum.OWNER)
  @HttpCode(HttpStatus.OK)
  @Put('edit/password')
  updatePassword(@Body() data: UpdateUserPasswordDto) {
    return this.ownerService.updatePassword(data);
  }
}
