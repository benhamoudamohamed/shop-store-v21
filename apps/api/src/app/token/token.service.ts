import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { Token } from './entities/token.entity';
import { TokenLifecycleService } from './token-lifecycle.service';
import { TokenHashService } from './token-hash.service';
import { UserRole } from '@youssef-brand/shared/shared-enums';
import { TokenType } from '@youssef-brand/shared/shared-types';

@Injectable()
export class TokenService {
  private logger = new Logger('🔑 Token Service 🔑')

  constructor(
    @InjectRepository(Token)
    private tokenRepository: Repository<Token>,
    private tokenLifecycleService: TokenLifecycleService,
    private tokenHashService: TokenHashService,
  ) {}

  // Start findAll
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
  // End FindAll

  // Start findbyId
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
  // End findbyId

  // Start create
  async create(id: string, role: UserRole, manager?: EntityManager): Promise<Token> {
    return this.tokenLifecycleService.create(id, role, this.tokenRepository, manager);
  }
  // End create

  // Start updateHashes
  async updateHashes(tokenId: string, data: TokenType, manager?: EntityManager): Promise<Token> {
    return this.tokenHashService.updateHashes(tokenId, data, this.tokenRepository, manager);
  }
  // End updateHashes

  // Start refreshToken
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
  // End refreshToken

  // Start revoke
  async revoke(id: string, manager?: EntityManager): Promise<Token> {
    return this.tokenLifecycleService.revoke(id, this.tokenRepository, manager);
  }
  // End revoke

  // Start isTokenRevoked
  async isTokenRevoked(id: string): Promise<boolean> {
    return this.tokenLifecycleService.isTokenRevoked(id, this.tokenRepository);
  }
  // End isTokenRevoked

  // Start removeAllRevoked
  async removeAllRevoked() {
    return this.tokenLifecycleService.removeAllRevoked(this.tokenRepository);
  }
  // End removeAllRevoked

  // Start remove
  async remove(id: string): Promise<HttpException> {
    return this.tokenLifecycleService.remove(id, this.tokenRepository);
  }
  // End remove

  async findOneWithAccessKey(id: string): Promise<Token | null> {
    return this.tokenRepository
      .createQueryBuilder('token')
      .where('token.id = :id', { id })
      .addSelect('token.accessKey')
      .getOne(); 
  } 
}
