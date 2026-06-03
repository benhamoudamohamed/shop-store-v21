import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Token } from './entities/token.entity';
import { TokenService } from './token.service';
import { TokenController } from './token.controller';
import { TokenLifecycleService } from './token-lifecycle.service';
import { TokenHashService } from './token-hash.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Token]),
  ],
  controllers: [TokenController],
  providers: [TokenService, TokenLifecycleService, TokenHashService],
})
export class TokenModule {}