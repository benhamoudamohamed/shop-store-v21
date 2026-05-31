import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Moderator } from './entities/moderator.entity';
import { ModeratorService } from './moderator.service';
import { TokenService } from '../token/token.service';
import { MailService } from '../shared/email/sendEmail';
import { CustomJosePayload } from '../shared/auth/jose-payload';
import { AuthType, TokenType } from '@youssef-brand/shared/shared-types';
import { UserRole } from '@youssef-brand/shared/shared-enums';
import { TransactionService } from '../shared/helpers/transaction.service';
import { AuthHelperService } from '../shared/helpers/auth-helper.service';

@Injectable()
export class ModeratorAuthService {

  private logger = new Logger('👤 Moderator Auth Service 👤')

  constructor(
    @InjectRepository(Moderator)
    private moderatorRepository: Repository<Moderator>,
    private moderatorService: ModeratorService,
    private dataSource: DataSource,
    private configService: ConfigService,
    private tokenService: TokenService,
    private mailService: MailService,
    private authHelperService: AuthHelperService,
    private transactionService: TransactionService) {}

  // Start login 
  async login(data: AuthType): Promise<TokenType> {
    return this.transactionService.run(async (manager) => {
      const user = await manager.createQueryBuilder(Moderator, 'moderator')
        .where('moderator.email = :email', { email: data.email.trim() })
        .addSelect('moderator.password')
        .getOne();

      if (!user) {
        this.logger.error(`login call: Invalid credentials: email: ${data.email}, userPass: ${data.password}`);
        throw new HttpException({status: HttpStatus.NOT_FOUND, error: 'Invalid Credentials', }, HttpStatus.NOT_FOUND);
      }

      const isMatch = await this.authHelperService.verifyPassword(user.password, data.password);

      if (!isMatch) {
        this.logger.error(`login call: Invalid credentials: email: ${data.email}, userPass: ${data.password}`);
        throw new HttpException({status: HttpStatus.NOT_FOUND, error: 'Invalid Credentials', }, HttpStatus.NOT_FOUND);
      }

      const emailData = this.authHelperService.buildAuthEmail(user.fullName, this.configService.get('ORIGIN'));

      const createdToken = await this.tokenService.create(user.id, UserRole.enum.MODERATOR, manager);
      const payload: CustomJosePayload = this.authHelperService.buildPayload(user, createdToken.id);

      const expiryDate = this.authHelperService.validateExpiry(this.configService.get<string>('EXPIRES_IN_T'), 'EXPIRES_IN_T');
      const tokens = await this.authHelperService.createTokenPair(payload, expiryDate);
      await this.tokenService.updateHashes(createdToken.id, tokens, manager);

      user.lastLogin = new Date();
      await manager.save(user);
      await this.mailService.sendEmail(emailData);
      this.logger.log(`✅ Login Successfully from user: ${user.email}`);
      return { id: createdToken.id, key: tokens.key, value: tokens.value };
    });
  }
  // End login 

  // Start refresh token
  async refreshTokens(userId: string, tokenId: string, accessKey: string): Promise<TokenType> {
    this.logger.log(`🟩🎉 refreshTokens Call`);
    return this.transactionService.run(async (manager) => {
      const user: Moderator = await this.moderatorService.findbyId(userId);
      const expiresInRT = this.configService.get<string>('EXPIRES_IN_RT');
      if (!expiresInRT) {
        this.logger.error('Refresh token expiry configuration is missing');
        throw new HttpException({ status: HttpStatus.INTERNAL_SERVER_ERROR, error: 'Missing refresh token expiry configuration' }, HttpStatus.INTERNAL_SERVER_ERROR);
      }
      return this.tokenService.refreshToken(user, tokenId, accessKey, UserRole.enum.MODERATOR, expiresInRT, manager);
    });
  }
  // end refresh token 

  // start logout
  async logout(userId: string, tokenId: string): Promise<{ message: string }> {
    this.logger.log(`🟩🎉 logout Call`);
    return this.transactionService.run(async (manager) => {
      await this.moderatorService.findbyId(userId);
      const token = await this.tokenService.findbyId(tokenId, manager);

      if (!token.moderatorId || String(userId) !== String(token.moderatorId)) {
        this.logger.error(`🚫 Access Denied: User ${userId} tried to access Token ${token.id}`);
        throw new HttpException({ status: HttpStatus.FORBIDDEN, error: `Forbidden Action` }, HttpStatus.FORBIDDEN);
      }

      await this.tokenService.revoke(token.id, manager);
      this.logger.log(`🟩🎉 logout successfully`);
      return { message: 'Your Session Is Ended' };
    });
  }
  // end logout
}
 