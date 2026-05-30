import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Token } from './entities/token.entity';
import { TokenService } from './token.service';
import { TokenController } from './token.controller';
import { HelperService } from '../shared/helpers/helper.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Token,]),
  ],
  controllers: [TokenController],
  providers: [TokenService, HelperService],
})
export class TokenModule {}