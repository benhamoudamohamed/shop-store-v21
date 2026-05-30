import { Controller, Get, Param, Delete, HttpCode, HttpStatus, Put } from '@nestjs/common';
import { TokenService } from './token.service';

@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @HttpCode(HttpStatus.OK)
  @Get('find/all')
  findAll() {
    return this.tokenService.findAll();
  }

  @HttpCode(HttpStatus.OK)
  @Get('find/:id')
  findbyId(@Param('id') id: string) {
    return this.tokenService.findbyId(id);
  }

  @HttpCode(HttpStatus.OK)
  @Put('revoke/:id')
  revoke(@Param('id') id: string) {
    return this.tokenService.revoke(id);
  }

  @HttpCode(HttpStatus.OK)
  @Delete('remove/all/revoked')
  removeAllRevoked() {
    return this.tokenService.removeAllRevoked();
  }

  @HttpCode(HttpStatus.OK)
  @Delete('remove/:id')
  remove(@Param('id') id: string) {
    return this.tokenService.remove(id);
  }
}
