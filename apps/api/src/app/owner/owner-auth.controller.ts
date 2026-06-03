import { Controller, Post, Body, HttpCode, HttpStatus, Param, Put, UseGuards } from '@nestjs/common';
import { OwnerAuthService } from './owner-auth.service';
import { CurrentUser } from '../shared/auth/current-user.decorator';
import { RolesDecorator } from '../shared/auth/roles.decorator';
import { RolesGuard } from '../shared/auth/roles.guard';
import { AuthenticationGuard } from '../shared/auth/auth.guard';
import { AuthType, TokenType } from '@youssef-brand/shared/shared-types';
import { UserRole } from '@youssef-brand/shared/shared-enums';

/**
 * Controller exposing owner authentication routes.
 */
@Controller('owner')
export class OwnerAuthController {
  constructor(private readonly ownerAuthService: OwnerAuthService) {}

  /**
   * Login endpoint for owner authentication.
   */
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() data: AuthType): Promise<TokenType>  {
    return this.ownerAuthService.login(data);
  }

  /**
   * Refresh the owner's active token pair.
   */
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.enum.OWNER)
  @HttpCode(HttpStatus.OK)
  @Put('refresh/:id')
  refreshTokens(@CurrentUser('id') userId: string, @Param('id') tokenId: string, @Body() data: TokenType) {
    return this.ownerAuthService.refreshTokens(userId, tokenId, data.key);
  }

  /**
   * Logout endpoint to revoke the owner's refresh token.
   */
  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.enum.OWNER)
  @HttpCode(HttpStatus.OK)
  @Put('logout/:id')
  logout(@CurrentUser('id') userId: string, @Param('id') tokenId: string) {
    return this.ownerAuthService.logout(userId, tokenId);
  }
}
