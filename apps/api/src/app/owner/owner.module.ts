import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OwnerService } from './owner.service';
import { OwnerController } from './owner.controller';
import { OwnerAuthService } from './owner-auth.service';
import { OwnerAuthController } from './owner-auth.controller';
import { HelperService } from '../shared/helpers/helper.service';
import { MailService } from '../shared/email/sendEmail';
import { TokenService } from '../token/token.service';
import { TokenLifecycleService } from '../token/token-lifecycle.service';
import { TokenHashService } from '../token/token-hash.service';
import { Owner } from './entities/owner.entity';
import { Token } from '../token/entities/token.entity';
import { HelperController } from '../shared/helpers/helper.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Owner, Token]),
  ],
  controllers: [OwnerController, OwnerAuthController, HelperController],
  providers: [OwnerService, OwnerAuthService, TokenService, TokenLifecycleService, TokenHashService, HelperService, MailService],
})
export class OwnerModule {}