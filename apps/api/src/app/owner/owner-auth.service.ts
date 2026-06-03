import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { OwnerService } from './owner.service';
import { TransactionService } from '../shared/helpers/transaction.service';
import { AuthHelperService } from '../shared/helpers/auth-helper.service';
import { TokenService } from '../token/token.service';
import { MailService } from '../shared/email/sendEmail';
import { Owner } from './entities/owner.entity';
import { UserRole } from '@youssef-brand/shared/shared-enums';
import { AuthType, TokenType } from '@youssef-brand/shared/shared-types';

/**
 * Service handling owner authentication and token lifecycle.
 */
@Injectable()
export class OwnerAuthService {

  private logger = new Logger('👑 Owner Auth Service 👑')

  constructor(
    @InjectRepository(Owner)
    private ownerRepository: Repository<Owner>,
    private ownerService: OwnerService,
    private dataSource: DataSource,
    private configService: ConfigService,
    private tokenService: TokenService,
    private mailService: MailService,
    private authHelperService: AuthHelperService,
    private transactionService: TransactionService,
    ) {}

  /**
   * Authenticate owner credentials and return a new token pair.
   */
  async login(data: AuthType): Promise<TokenType> {
    return this.transactionService.run(async (manager) => {
      const user = await manager.createQueryBuilder(Owner, 'user')
        .where('user.email = :email', { email: data.email.trim() })
        .addSelect('user.password')
        .getOne();

      if (!user) {
        this.logger.error(`login call: Invalid credentials: email: ${data.email}`);
        throw new HttpException({ status: HttpStatus.NOT_FOUND, error: 'Invalid Credentials' }, HttpStatus.NOT_FOUND);
      }

      const isMatch = await this.authHelperService.verifyPassword(user.password, data.password);
      if (!isMatch) {
        this.logger.error(`login call: Invalid credentials: email: ${data.email}`);
        throw new HttpException({ status: HttpStatus.NOT_FOUND, error: 'Invalid Credentials' }, HttpStatus.NOT_FOUND);
      }

      const emailData = this.authHelperService.buildAuthEmail(user.fullName, this.configService.get('ORIGIN'));
      const createdToken = await this.tokenService.create(user.id, UserRole.enum.OWNER, manager);
      const payload = this.authHelperService.buildPayload(user, createdToken.id);
      const expiryDate = this.authHelperService.validateExpiry(this.configService.get<string>('EXPIRES_IN_T'), 'EXPIRES_IN_T');
      const tokens = await this.authHelperService.createTokenPair(payload, expiryDate);
      await this.tokenService.updateHashes(createdToken.id, tokens, manager);
      await this.mailService.sendEmail(emailData);

      user.lastLogin = new Date();
      await manager.save(user);
      this.logger.log(`✅ Login Successfully from user: ${user.email}`);
      return { id: createdToken.id, key: tokens.key, value: tokens.value };
    });
  }

  /**
   * Refresh the owner's session token pair using refresh token credentials.
   */
  async refreshTokens(userId: string, tokenId: string, accessKey: string): Promise<TokenType> {
    this.logger.log(`🟩🎉 refreshTokens Call`);
    return this.transactionService.run(async (manager) => {
      const user: Owner = await this.ownerService.findbyId(userId);
      const expiresInRT = this.configService.get<string>('EXPIRES_IN_RT');
      if (!expiresInRT) {
        this.logger.error('Refresh token expiry configuration is missing');
        throw new HttpException({ status: HttpStatus.INTERNAL_SERVER_ERROR, error: 'Missing refresh token expiry configuration' }, HttpStatus.INTERNAL_SERVER_ERROR);
      }
      return this.tokenService.refreshToken(user, tokenId, accessKey, UserRole.enum.OWNER, expiresInRT, manager);
    });
  }

  /**
   * Logout the owner by revoking the active refresh token.
   */
  async logout(userId: string, tokenId: string): Promise<{ message: string }> {
    this.logger.log(`🟩🎉 logout Call`);
    return this.transactionService.run(async (manager) => {
      await this.ownerService.findbyId(userId);
      const token = await this.tokenService.findbyId(tokenId, manager);

      if (!token.ownerId || String(userId) !== String(token.ownerId)) {
        this.logger.error(`🚫 Access Denied: User ${userId} tried to access Token ${token.id}`);
        throw new HttpException({ status: HttpStatus.FORBIDDEN, error: `Forbidden Action` }, HttpStatus.FORBIDDEN);
      }

      await this.tokenService.revoke(token.id, manager);
      this.logger.log(`🟩🎉 logout successfully`);
      return { message: 'Your Session Is Ended' };
    });
  }
}
 