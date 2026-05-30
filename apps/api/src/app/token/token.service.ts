import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { HelperService } from '../shared/helpers/helper.service';
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
    private helperService: HelperService) {}

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
      throw new HttpException({status: HttpStatus.INTERNAL_SERVER_ERROR, error: 'INTERNAL SERVER ERROR', }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  // End FindAll

  // Start findbyId
  async findbyId(id: string): Promise<Token>  {
    const token = await this.tokenRepository.findOne({where: {id: id}, relations: ['owner', 'admin', 'moderator']});

    if(!token) {
      this.logger.error(`🟥🚨 Token not found with id: ${id}`)
      throw new HttpException({status: HttpStatus.NOT_FOUND, error: 'Token Not Found', }, HttpStatus.NOT_FOUND);
    }
    try {
      this.logger.log(`🟩🎉 findbyId successfully with id: ${id}`);
      return token;
    }
    catch (error) {
      this.logger.error(`🟥🚨 findbyId catch Error: ${error}`)
      throw new HttpException({status: HttpStatus.INTERNAL_SERVER_ERROR, error: 'INTERNAL SERVER ERROR', }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  // End findbyId

  // Start create
  async create(id: string, role: UserRole, manager?: EntityManager): Promise<Token> {
    this.logger.log(`🟩🎉 create Call`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const repo = manager ? manager.getRepository(Token) : this.tokenRepository;
  
    const token = repo.create({
      userRole: role,
      ownerId: role === UserRole.enum.OWNER ? id : null,
      adminId: role === UserRole.enum.ADMIN ? id : null,
      moderatorId: role === UserRole.enum.MODERATOR ? id : null,
      isRevoked: false,
    } as Token);

    try {
      const savedToken = await queryRunner.manager.save(token);
      await queryRunner.commitTransaction();
      this.logger.log(`🔄 token stored successfully`);
      return savedToken;
    }
    catch(error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`🟥🚨 create Catch Error: ${error}`)
      throw new HttpException({status: HttpStatus.INTERNAL_SERVER_ERROR, error: 'INTERNAL SERVER ERROR', }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    finally {
      await queryRunner.release();
    }
  }
  // End create

  // Start updateHashes
  async updateHashes(tokenId: string, data: TokenType): Promise<Token> {
    this.logger.log(`🟩🎉 Update hashed token Call`);
    const { key, value } = data;
    
    const hashedKey = await this.helperService.hashData(key);
    const hashedToken = await this.helperService.hashData(value);

    try {
      await this.tokenRepository.update(tokenId, { 
        accessToken: hashedToken, 
        accessKey: hashedKey 
      });

      this.logger.log(`🔄 Update hashed token successfully`);
      return await this.findbyId(tokenId);
    } catch (error) {
      this.logger.error(`🟥🚨 updateHashes Catch Error: ${error}`)
      throw new HttpException({status: HttpStatus.INTERNAL_SERVER_ERROR, error: 'INTERNAL SERVER ERROR', }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  // End updateHashes

  // Start revoke
  async revoke(id: string): Promise<Token> {
    this.logger.log(`🟩🎉 revoke Call`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const token = await this.findbyId(id)
    
    if(!token) {
      this.logger.error(`🟥🚨 Token not found with id: ${id}`)
      throw new HttpException({status: HttpStatus.NOT_FOUND, error: 'Token Not Found', }, HttpStatus.NOT_FOUND);
    }

    const newToken = new Token();
    newToken.accessToken = ''
    newToken.accessKey = ''
    newToken.isRevoked = true

    try {
      await queryRunner.manager.update(Token, token.id, {...newToken});
      await queryRunner.commitTransaction();
      this.logger.log(`🗑️ token revoke successfully`);
      return await this.findbyId(token.id);
    }
    catch(error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`🟥🚨 create Catch Error: ${error}`)
      throw new HttpException({status: HttpStatus.INTERNAL_SERVER_ERROR, error: 'INTERNAL SERVER ERROR', }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    finally {
      await queryRunner.release();
    }
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
      throw new HttpException({status: HttpStatus.INTERNAL_SERVER_ERROR, error: 'INTERNAL SERVER ERROR', }, HttpStatus.INTERNAL_SERVER_ERROR);
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
      throw new HttpException({status: HttpStatus.INTERNAL_SERVER_ERROR, error: 'INTERNAL SERVER ERROR', }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  // End remove
}
