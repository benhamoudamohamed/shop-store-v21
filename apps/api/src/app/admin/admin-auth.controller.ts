import { Controller, Post, Body, HttpCode, HttpStatus, Param, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../shared/auth/current-user.decorator';
import { AuthenticationGuard } from '../shared/auth/auth.guard';
import { RolesDecorator } from '../shared/auth/roles.decorator';
import { RolesGuard } from '../shared/auth/roles.guard';
import { AdminAuthService } from './admin-auth.service';
import { UserRole } from '@youssef-brand/shared/shared-enums';
import { AuthType, TokenType } from '@youssef-brand/shared/shared-types';

@Controller('admin')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() data: AuthType): Promise<TokenType>  {
    return this.adminAuthService.login(data);
  }

  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.enum.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Put('refresh/:id')
  refreshTokens(@CurrentUser('id') userId: string, @Param('id') tokenId: string, @Body() data: TokenType) {
    return this.adminAuthService.refreshTokens(userId, tokenId, data.key);
  }

  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.enum.ADMIN)
  @HttpCode(HttpStatus.OK)
  @Put('logout/:id')
  logout(@CurrentUser('id') userId: string, @Param('id') tokenId: string) {
    return this.adminAuthService.logout(userId, tokenId);
  }
}
