import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Token } from './entities/token.entity';
import { TokenLifecycleService } from './token-lifecycle.service';
import { TokenHashService } from './token-hash.service';
import { UserRole } from '@youssef-brand/shared/shared-enums';
import { TokenType } from '@youssef-brand/shared/shared-types';

/**
 * Service responsible for token record management.
 * Handles retrieval, creation, refresh, revocation, hash updates, and cleanup.
 */
@Injectable()
export class TokenService {
  private logger = new Logger('🔑 Token Service 🔑')

  constructor(
    @InjectRepository(Token)
    private tokenRepository: Repository<Token>,
    private tokenLifecycleService: TokenLifecycleService,
    private tokenHashService: TokenHashService,
  ) {}

  /**
   * Return all tokens grouped by their user role.
   * Includes owner/admin/moderator relations for each token.
   */
  async findAll() {
    const count = await this.tokenRepository
      .createQueryBuilder("token")
      .leftJoin('token.owner', 'owner')
      .leftJoin('token.admin', 'admin')
      .leftJoin('token.moderator', 'moderator')
      .getCount()

    const data = await this.tokenRepository.createQueryBuilder("token")
      .leftJoinAndSelect('token.owner', 'owner') 
      .leftJoinAndSelect('token.admin', 'admin')
      .leftJoinAndSelect('token.moderator', 'moderator')
      .select([
        'token',
        'owner.id', 'owner.fullName',
        'admin.id', 'admin.fullName',
        'moderator.id', 'moderator.fullName'
      ])
      .getMany();

    const groupedByRole = data.reduce((acc, token) => {
      const role = token.userRole;
      if (!acc[role]) {
        acc[role] = []; 
      }
      acc[role].push(token);
      return acc;
    }, {} as Record<string, Token[]>);

    this.logger.log(`🟩🎉 findAll successfully`);
    return {
      count: count,
      data: groupedByRole
    };
  }

  /**
   * Load a single token by id with related owner/admin/moderator.
   * Throws NOT_FOUND if the token does not exist.
   */
  async findbyId(id: string, manager?: EntityManager): Promise<Token>  {
    const token = manager
      ? await manager.findOne(Token, { where: { id }, relations: ['owner', 'admin', 'moderator'] })
      : await this.tokenRepository.findOne({ where: { id }, relations: ['owner', 'admin', 'moderator'] });

    if (!token) {
      this.logger.error(`🟥🚨 Token not found with id: ${id}`)
      throw new HttpException({ status: HttpStatus.NOT_FOUND, error: 'Token Not Found' }, HttpStatus.NOT_FOUND);
    }
    
    this.logger.log(`🟩🎉 findbyId successfully with id: ${id}`);
    return token;
  }

  /**
   * Create a new token entry tied to the indicated user role.
   */
  async create(id: string, role: UserRole, manager?: EntityManager): Promise<Token> {
    return this.tokenLifecycleService.create(id, role, this.tokenRepository, manager);
  }

  /**
   * Persist fresh access token and access key hashes for an existing token record.
   */
  async updateHashes(tokenId: string, data: TokenType, manager?: EntityManager): Promise<Token> {
    return this.tokenHashService.updateHashes(tokenId, data, this.tokenRepository, manager);
  }

  /**
   * Refresh an existing token pair and revoke the old one.
   */
  async refreshToken(
    user: { id: string; email: string; fullName: string; userRole: string },
    tokenId: string,
    accessKey: string,
    role: UserRole,
    expiresInRT: string,
    manager?: EntityManager,
  ): Promise<TokenType> {
    return this.tokenLifecycleService.refreshToken(
      user,
      tokenId,
      accessKey,
      role,
      expiresInRT,
      this.tokenRepository,
      manager,
    );
  }

  /**
   * Revoke a token by marking it revoked and clearing sensitive values.
   */
  async revoke(id: string, manager?: EntityManager): Promise<Token> {
    return this.tokenLifecycleService.revoke(id, this.tokenRepository, manager);
  }

  /**
   * Returns true when the token has already been revoked or does not exist.
   */
  async isTokenRevoked(id: string): Promise<boolean> {
    return this.tokenLifecycleService.isTokenRevoked(id, this.tokenRepository);
  }

  /**
   * Delete all tokens that have been revoked and return the removed records.
   */
  async removeAllRevoked() {
    return this.tokenLifecycleService.removeAllRevoked(this.tokenRepository);
  }

  /**
   * Permanently delete a token record from storage.
   */
  async remove(id: string): Promise<HttpException> {
    return this.tokenLifecycleService.remove(id, this.tokenRepository);
  }
}
