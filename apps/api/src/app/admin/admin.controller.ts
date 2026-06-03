import { Controller, Get, Body, Param, UseGuards, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthenticationGuard } from '../shared/auth/auth.guard';
import { Admin } from './entities/admin.entity';
import { RolesGuard } from '../shared/auth/roles.guard';
import { RolesDecorator } from '../shared/auth/roles.decorator';
import { UserRole } from '@youssef-brand/shared/shared-enums';
import { UpdateUserPasswordDto } from '@youssef-brand/shared/shared-dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Start findAllUsers
   * Returns all admin users to authorized admin/owner roles.
   */
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.enum.OWNER, UserRole.enum.ADMIN)
  @Get('all')
  @HttpCode(HttpStatus.OK)
  findAllUsers(): Promise<{ data: Admin[]; count: number }> {  
    return this.adminService.findAllUsers();
  }

  /**
   * Start findbyId
   * Retrieves admin details by ID for authorized admin users.
   */
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.enum.ADMIN)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findbyId(@Param('id') id: string) {
    return this.adminService.findbyId(id);
  }

  /**
   * Start updatePassword
   * Updates the password for the authenticated admin user.
   */
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.enum.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Put('edit/password')
  updatePassword(@Body() data: UpdateUserPasswordDto) {
    return this.adminService.updatePassword(data);
  }
}
