import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Moderator } from './entities/moderator.entity';
import { Token } from '../token/entities/token.entity';
import { ModeratorService } from './moderator.service';
import { ModeratorAuthService } from './moderator-auth.service';
import { ModeratorController } from './moderator.controller';
import { ModeratorAuthController } from './moderator-auth.controller';
import { TokenService } from '../token/token.service';
import { TokenLifecycleService } from '../token/token-lifecycle.service';
import { TokenHashService } from '../token/token-hash.service';
import { HelperService } from '../shared/helpers/helper.service';
import { MailService } from '../shared/email/sendEmail';

@Module({
  imports: [
    TypeOrmModule.forFeature([Moderator, Token]),
  ],
  controllers: [ModeratorController, ModeratorAuthController],
  providers: [ModeratorService, ModeratorAuthService, TokenService, TokenLifecycleService, TokenHashService, HelperService, MailService],
})
export class ModeratorModule {}
