import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { TransactionService } from '../shared/helpers/transaction.service';
import { AuthHelperService } from '../shared/helpers/auth-helper.service';
import { Token } from './entities/token.entity';
import { UserRole } from '@youssef-brand/shared/shared-enums';
import { TokenType } from '@youssef-brand/shared/shared-types';
import { TokenHashService } from './token-hash.service';

/**
 * Encapsulates token lifecycle operations such as creation, refresh, revocation,
 * and cleanup within transactional boundaries.
 */
@Injectable()
export class TokenLifecycleService {
  private logger = new Logger('🔄 TokenLifecycleService 🔄');

  constructor(
    private transactionService: TransactionService,
    private authHelperService: AuthHelperService,
    private tokenHashService: TokenHashService,
  ) {}

  /**
   * Resolve the repository to use either from a transaction manager or the default repository.
   */
  private getRepository(repository: Repository<Token>, manager?: EntityManager): Repository<Token> {
    return manager ? manager.getRepository(Token) : repository;
  }

  /**
   * Create a new token record for a given user identity and role.
   * Uses a transaction when no manager is supplied.
   */
  async create(
    id: string,
    role: UserRole,
    repository: Repository<Token>,
    manager?: EntityManager,
  ): Promise<Token> {
    this.logger.log(`🟩🎉 create Call`);

    const tokenData = {
      userRole: role,
      ownerId: role === UserRole.enum.OWNER ? id : null,
      adminId: role === UserRole.enum.ADMIN ? id : null,
      moderatorId: role === UserRole.enum.MODERATOR ? id : null,
      isRevoked: false,
    } as Token;

    if (manager) {
      const token = manager.create(Token, tokenData);
      return manager.save(token);
    }

    return this.transactionService.run(async (transactionManager) => {
      const token = transactionManager.create(Token, tokenData);
      const savedToken = await transactionManager.save(token);
      this.logger.log(`🔄 token stored successfully`);
      return savedToken;
    });
  }

  /**
   * Refresh an existing token pair by validating the current access key,
   * issuing a new token, hashing the new credentials, and revoking the old token.
   */
  async refreshToken(
    user: { id: string; email: string; fullName: string; userRole: string },
    tokenId: string,
    accessKey: string,
    role: UserRole,
    expiresInRT: string,
    repository: Repository<Token>,
    manager?: EntityManager,
  ): Promise<TokenType> {
    this.logger.log(`🟩🎉 refreshToken Call`);

    const repo = this.getRepository(repository, manager);
    const oldToken = await repo
      .createQueryBuilder('token')
      .where('token.id = :id', { id: tokenId })
      .addSelect('token.accessKey')
      .getOne();

    if (!oldToken) {
      this.logger.error(`🟥🚨 Refresh token not found with id: ${tokenId}`);
      throw new HttpException({ status: HttpStatus.NOT_FOUND, error: 'Token Not Found' }, HttpStatus.NOT_FOUND);
    }

    if (oldToken.isRevoked) {
      this.logger.warn(`🟥🚨 Attempt to use a revoked token: ${tokenId}`);
      throw new HttpException({ status: HttpStatus.UNAUTHORIZED, error: 'Token has been revoked' }, HttpStatus.UNAUTHORIZED);
    }

    const isMatch = await this.authHelperService.verifyPassword(oldToken.accessKey, accessKey);
    if (!isMatch) {
      this.logger.error(`🟥🚨 Wrong AccessKey token: ${tokenId}`);
      throw new HttpException({ status: HttpStatus.NOT_FOUND, error: 'Wrong AccessKey token' }, HttpStatus.NOT_FOUND);
    }

    const createdToken = await this.create(user.id, role, repository, manager);
    const payload = this.authHelperService.buildPayload(user, createdToken.id);
    const expiryDate = this.authHelperService.validateExpiry(expiresInRT, 'EXPIRES_IN_RT');
    const newToken: TokenType = await this.authHelperService.createTokenPair(payload, expiryDate);
    await this.tokenHashService.updateHashes(createdToken.id, newToken, repository, manager);
    await this.revoke(tokenId, repository, manager);

    this.logger.log(`✅ Refresh token created successfully`);
    return newToken;
  }

  /**
   * Revoke an active token by clearing credentials and marking it revoked.
   */
  async revoke(
    id: string,
    repository: Repository<Token>,
    manager?: EntityManager,
  ): Promise<Token> {
    this.logger.log(`🟩🎉 revoke Call`);

    const repo = this.getRepository(repository, manager);
    const token = await repo.findOne({ where: { id }, relations: ['owner', 'admin', 'moderator'] });

    if (!token) {
      this.logger.error(`🟥🚨 Token not found with id: ${id}`);
      throw new HttpException({ status: HttpStatus.NOT_FOUND, error: 'Token Not Found' }, HttpStatus.NOT_FOUND);
    }

    if (manager) {
      await manager.update(Token, token.id, {
        accessToken: '',
        accessKey: '',
        isRevoked: true,
      });
      this.logger.log(`🗑️ token revoke successfully`);
      return this.getTokenById(token.id, manager);
    }

    return this.transactionService.run(async (transactionManager) => {
      await transactionManager.update(Token, token.id, {
        accessToken: '',
        accessKey: '',
        isRevoked: true,
      });
      this.logger.log(`🗑️ token revoke successfully`);
      return this.getTokenById(token.id, transactionManager);
    });
  }

  /**
   * Return true when the token is revoked or no longer exists.
   */
  async isTokenRevoked(id: string, repository: Repository<Token>): Promise<boolean> {
    const token = await repository.findOne({
      where: { id },
      select: ['isRevoked'],
    });
    return !token || token.isRevoked === true;
  }

  /**
   * Delete all tokens that have already been revoked.
   */
  async removeAllRevoked(repository: Repository<Token>): Promise<Token[]> {
    this.logger.log(`🟩🎉 Remove All revoked token Call`);
    const tokens = await repository.findBy({ isRevoked: true });

    if (tokens.length === 0) {
      this.logger.log(`Found ${tokens.length} active tokens to revoke.`);
      throw new HttpException({ status: HttpStatus.NOT_FOUND, error: 'No Token To Revoke' }, HttpStatus.NOT_FOUND);
    }

    await repository.delete({ isRevoked: true });
    this.logger.log(`🟩🎉 removeAll successfully`);
    return tokens;
  }

  async remove(id: string, repository: Repository<Token>): Promise<HttpException> {
    this.logger.log(`🟩🎉 Remove token Call`);

    const token = await repository.findOne({ where: { id } });
    if (!token) {
      this.logger.error(`🟥🚨 Token not found with id: ${id}`);
      throw new HttpException({ status: HttpStatus.NOT_FOUND, error: 'Token Not Found' }, HttpStatus.NOT_FOUND);
    }

    await repository.delete(token.id);
    this.logger.log(`🗑️ delete successfully`);
    return new HttpException({ description: 'Token Deleted Successfully' }, HttpStatus.OK);
  }

  /**
   * Load a token record by id within the context of a transaction manager.
   * Throws NOT_FOUND if the token cannot be retrieved.
   */
  private async getTokenById(id: string, manager: EntityManager): Promise<Token> {
    const token = await manager.findOne(Token, { where: { id }, relations: ['owner', 'admin', 'moderator'] });
    if (!token) {
      this.logger.error(`🟥🚨 Token not found with id: ${id}`);
      throw new HttpException({ status: HttpStatus.NOT_FOUND, error: 'Token Not Found' }, HttpStatus.NOT_FOUND);
    }
    return token;
  }
}
