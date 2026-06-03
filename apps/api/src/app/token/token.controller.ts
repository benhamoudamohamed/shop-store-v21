import { Controller, Get, Param, Delete, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { TokenService } from './token.service';

/**
 * Controller exposing token management HTTP endpoints.
 * Supports lookup, revocation, and cleanup of tokens.
 */
@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  /**
   * Retrieve all tokens grouped by user role.
   */
  @HttpCode(HttpStatus.OK)
  @Get('find/all')
  findAll() {
    return this.tokenService.findAll();
  }

  /**
   * Return a single token record by id.
   */
  @HttpCode(HttpStatus.OK)
  @Get('find/:id')
  findbyId(@Param('id') id: string) {
    return this.tokenService.findbyId(id);
  }

  /**
   * Revoke a token without deleting its record.
   */
  @HttpCode(HttpStatus.OK)
  @Put('revoke/:id')
  revoke(@Param('id') id: string) {
    return this.tokenService.revoke(id);
  }

  /**
   * Remove all revoked tokens from storage.
   */
  @HttpCode(HttpStatus.OK)
  @Delete('remove/all/revoked')
  removeAllRevoked() {
    return this.tokenService.removeAllRevoked();
  }

  /**
   * Permanently delete a single token by id.
   */
  @HttpCode(HttpStatus.OK)
  @Delete('remove/:id')
  remove(@Param('id') id: string) {
    return this.tokenService.remove(id);
  }
}
