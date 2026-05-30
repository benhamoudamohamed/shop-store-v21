import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthController } from './admin-auth.controller';
import { HelperService } from '../shared/helpers/helper.service';
import { MailService } from '../shared/email/sendEmail';
import { TokenService } from '../token/token.service';
import { Admin } from './entities/admin.entity';
import { Token } from '../token/entities/token.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin, Token]),
  ],
  controllers: [AdminController, AdminAuthController],
  providers: [AdminService, AdminAuthService, TokenService, HelperService, MailService],
})
export class AdminModule {}

