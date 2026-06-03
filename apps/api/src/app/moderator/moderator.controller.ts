import { Controller, Get, Post, Body, Param, Delete, HttpCode, HttpStatus, Put, UseGuards, ParseBoolPipe } from '@nestjs/common';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { Moderator } from './entities/moderator.entity';
import { ModeratorService } from './moderator.service';
import { ModeratorAccountService } from './moderator-account.service';
import { AuthenticationGuard } from '../shared/auth/auth.guard';
import { RolesDecorator } from '../shared/auth/roles.decorator';
import { RolesGuard } from '../shared/auth/roles.guard';
import { UserRole } from '@youssef-brand/shared/shared-enums';
import { CreateUserDto, UpdateUserDto, UpdateUserPasswordDto } from '@youssef-brand/shared/shared-dto';
import { ResetPasswordType } from '@youssef-brand/shared/shared-types';

@Controller('moderator')
export class ModeratorController {
  constructor(
    private readonly moderatorService: ModeratorService,
    private readonly moderatorAccountService: ModeratorAccountService,
  ) {}

  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.enum.OWNER, UserRole.enum.ADMIN)
  @Get('all')
  @HttpCode(HttpStatus.OK)
  findAllUsers(): Promise<{ data: Moderator[]; count: number }> {  
    return this.moderatorService.findAllUsers();
  }

  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.enum.OWNER, UserRole.enum.ADMIN)
  @Get('paginate')
  @HttpCode(HttpStatus.OK)
  findAllbyPagination(@Paginate() paginateQuery: PaginateQuery): Promise<Paginated<Moderator>> {
    return this.moderatorService.findAllbyPagination(paginateQuery);
  }

  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.enum.OWNER, UserRole.enum.ADMIN, UserRole.enum.MODERATOR)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findbyId(@Param('id') id: string) {
    return this.moderatorService.findbyId(id);
  }

  @Post('find/fullname')
  @HttpCode(HttpStatus.OK)
  findByName(@Body('fullName') fullName: string): Promise<Moderator> {
    return this.moderatorService.findByName(fullName);
  }

  @Post('find/email')
  @HttpCode(HttpStatus.OK)
  findbyMail(@Body() user: Moderator): Promise<Moderator> {
    return this.moderatorService.findbyMail(user.email);
  }

  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.enum.OWNER, UserRole.enum.ADMIN)
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  create(@Body() data: CreateUserDto): Promise<Moderator> {
    return this.moderatorService.create(data); 
  }

  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.enum.MODERATOR)
  @Put('edit/name/:id')
  @HttpCode(HttpStatus.CREATED)
  editName(@Param('id') id: string, @Body() data: UpdateUserDto): Promise<Moderator> {
    const { fullName } = data;
    return this.moderatorAccountService.editName(id, fullName);
  }

  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.enum.OWNER, UserRole.enum.ADMIN)
  @Put('edit/status/:id') 
  @HttpCode(HttpStatus.CREATED)
  toggleUserStatus(@Param('id') id: string, @Body('isActivated', ParseBoolPipe) isActivated: boolean): Promise<Moderator> {
    return this.moderatorAccountService.toggleUserStatus(id, isActivated);
  }

  @Post('sendVerificationCode')
  @HttpCode(HttpStatus.OK)
  sendVerificationCode(@Body() user: Moderator): Promise<{ message: string }> {
    return this.moderatorAccountService.sendVerificationCode(user.email);
  }

  @Post('verifyCode')
  @HttpCode(HttpStatus.CREATED)
  verifyCode(@Body() data: ResetPasswordType): Promise<{ message: string }> {
    return this.moderatorAccountService.verifyCode(data);
  }

  @HttpCode(HttpStatus.OK)
  @Put('edit/password')
  updatePassword(@Body() data: UpdateUserPasswordDto): Promise<{ message: string }> {
    return this.moderatorAccountService.updatePassword(data);
  }

  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.enum.OWNER, UserRole.enum.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  delete(@Param('id') id: string): Promise<{ message: string }> {
    return this.moderatorService.delete(id);
  }
}
