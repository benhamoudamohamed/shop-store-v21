import { Controller, Post, Body, HttpCode, HttpStatus, Param, Put, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../shared/auth/current-user.decorator';
import { AuthenticationGuard } from '../shared/auth/auth.guard';
import { RolesDecorator } from '../shared/auth/roles.decorator';
import { RolesGuard } from '../shared/auth/roles.guard';
import { ModeratorAuthService } from './moderator-auth.service';
import { UserRole } from '@youssef-brand/shared/shared-enums';
import { AuthType, TokenType } from '@youssef-brand/shared/shared-types';

@Controller('moderator')
export class ModeratorAuthController {
  constructor(private readonly moderatorAuthService: ModeratorAuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() data: AuthType): Promise<TokenType>  {
    return this.moderatorAuthService.login(data);
  }

  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.enum.MODERATOR)
  @HttpCode(HttpStatus.OK)
  @Put('refresh/:id')
  refreshTokens(@CurrentUser('id') userId: string, @Param('id') tokenId: string, @Body() data: TokenType) {
    return this.moderatorAuthService.refreshTokens(userId, tokenId, data.key);
  }

  @UseGuards(AuthenticationGuard, RolesGuard)
  @RolesDecorator(UserRole.enum.MODERATOR)
  @HttpCode(HttpStatus.OK)
  @Put('logout/:id')
  logout(@CurrentUser('id') userId: string, @Param('id') tokenId: string) {
    return this.moderatorAuthService.logout(userId, tokenId);
  }
}
