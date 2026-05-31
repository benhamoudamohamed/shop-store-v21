import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { ExceptionHelperService } from '../shared/helpers/exception-helper.service';
import { HelperService } from '../shared/helpers/helper.service';
import { AuthHelperService } from '../shared/helpers/auth-helper.service';
import { TransactionService } from '../shared/helpers/transaction.service';
import { Token } from './entities/token.entity';
import { UserRole } from '@youssef-brand/shared/shared-enums';
import { TokenType } from '@youssef-brand/shared/shared-types';

@Injectable()
export class TokenService {
  private logger = new Logger('🔑 Token Service 🔑')

  constructor(
    @InjectRepository(Token)
    private tokenRepository: Repository<Token>,
    private dataSource: DataSource,
    private helperService: HelperService,
    private authHelperService: AuthHelperService,
    private transactionService: TransactionService,
    private exceptionHelper: ExceptionHelperService) {}

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

    try {
      this.logger.log(`🟩🎉 findAll successfully`);
      return {
        count: count,
        data: groupedByRole
      };
    }
    catch (error) {
      this.logger.error(`🟥🚨 findAll catch Error: ${error}`)
      this.exceptionHelper.handleError(error);
    }
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

    try {
      this.logger.log(`🟩🎉 findbyId successfully with id: ${id}`);
      return token;
    }
    catch (error) {
      this.logger.error(`🟥🚨 findbyId catch Error: ${error}`)
      this.exceptionHelper.handleError(error);
    }
  }
  // End findbyId

  // Start create
  async create(id: string, role: UserRole, manager?: EntityManager): Promise<Token> {
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
  // End create

  // Start updateHashes
  async updateHashes(tokenId: string, data: TokenType, manager?: EntityManager): Promise<Token> {
    this.logger.log(`🟩🎉 Update hashed token Call`);
    const { key, value } = data;

    const hashedKey = await this.helperService.hashData(key);
    const hashedToken = await this.helperService.hashData(value);

    try {
      const repository = manager ? manager.getRepository(Token) : this.tokenRepository;
      const token = await repository.findOne({ where: { id: tokenId } });

      if (!token) {
        this.logger.error(`🟥🚨 Token not found before update: ${tokenId}`);
        throw new HttpException({ status: HttpStatus.NOT_FOUND, error: 'Token Not Found' }, HttpStatus.NOT_FOUND);
      }

      token.accessToken = hashedToken;
      token.accessKey = hashedKey;
      await repository.save(token);

      const updatedToken = await (manager
        ? manager.findOne(Token, { where: { id: tokenId }, relations: ['owner', 'admin', 'moderator'] })
        : this.tokenRepository.findOne({ where: { id: tokenId }, relations: ['owner', 'admin', 'moderator'] }));

      if (!updatedToken) {
        this.logger.error(`🟥🚨 Token not found after update: ${tokenId}`);
        throw new HttpException({ status: HttpStatus.NOT_FOUND, error: 'Token Not Found' }, HttpStatus.NOT_FOUND);
      }

      this.logger.log(`🔄 Update hashed token successfully`);
      return updatedToken;
    } catch (error) {
      this.logger.error(`🟥🚨 updateHashes Catch Error: ${error}`)
      this.exceptionHelper.handleError(error);
    }
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
    this.logger.log(`🟩🎉 refreshToken Call`);

    const repository = manager ? manager.getRepository(Token) : this.tokenRepository;
    const oldToken = await repository
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

    const createdToken = await this.create(user.id, role, manager);
    const payload = this.authHelperService.buildPayload(user, createdToken.id);
    const expiryDate = this.authHelperService.validateExpiry(expiresInRT, 'EXPIRES_IN_RT');
    const newToken: TokenType = await this.authHelperService.createTokenPair(payload, expiryDate);
    await this.updateHashes(createdToken.id, newToken, manager);
    await this.revoke(tokenId, manager);

    this.logger.log(`✅ Refresh token created successfully`);
    return newToken;
  }
  // End refreshToken

  // Start revoke
  async revoke(id: string, manager?: EntityManager): Promise<Token> {
    this.logger.log(`🟩🎉 revoke Call`);

    const token = await this.findbyId(id, manager);
    if (!token) {
      this.logger.error(`🟥🚨 Token not found with id: ${id}`);
      throw new HttpException({status: HttpStatus.NOT_FOUND, error: 'Token Not Found'}, HttpStatus.NOT_FOUND);
    }

    if (manager) {
      await manager.update(Token, token.id, {
        accessToken: '',
        accessKey: '',
        isRevoked: true,
      });
      this.logger.log(`🗑️ token revoke successfully`);
      return this.findbyId(token.id, manager);
    }

    return this.transactionService.run(async (transactionManager) => {
      await transactionManager.update(Token, token.id, {
        accessToken: '',
        accessKey: '',
        isRevoked: true,
      });
      this.logger.log(`🗑️ token revoke successfully`);
      return this.findbyId(token.id, transactionManager);
    });
  }
  // End revoke

  // Start isTokenRevoked
  async isTokenRevoked(id: string): Promise<boolean> {
    const token = await this.tokenRepository.findOne({ 
      where: { id: id },
      select: ['isRevoked'] 
    });
      
    // If token is missing or isRevoked is true, return true (it's revoked)
    return !token || token.isRevoked === true;
  }
  // End isTokenRevoked

  // Start removeAllRevoked
  async removeAllRevoked() {
    this.logger.log(`🟩🎉 Remove All revoked token Call`);
    const tokens = await this.tokenRepository.findBy({isRevoked: true});
    
    if(tokens.length === 0) {
      this.logger.log(`Found ${tokens.length} active tokens to revoke.`);
      throw new HttpException({status: HttpStatus.NOT_FOUND, error: 'No Token To Revoke', }, HttpStatus.NOT_FOUND);
    }
    
    try {
      await this.tokenRepository.delete({ isRevoked: true});
      this.logger.log(`🟩🎉 removeAll successfully`);
      return tokens;
    }
    catch (error) {
      this.logger.error(`🟥🚨 removeAll catch Error: ${error}`)
      this.exceptionHelper.handleError(error);
    }
  }
  // End removeAllRevoked

  // Start remove
  async remove(id: string): Promise<HttpException> {
    this.logger.log(`🟩🎉 Remove token Call`);

    const token = await this.findbyId(id)
    try {
      await this.tokenRepository.delete(token.id)
      this.logger.log(`🗑️ delete successfully`);
      return new HttpException({description: 'Token Deleted Successfully'}, HttpStatus.OK);
    }
    catch (error) {
      this.logger.error(`🟥 delete catch Error: ${error}`)
      this.exceptionHelper.handleError(error);
    }
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
