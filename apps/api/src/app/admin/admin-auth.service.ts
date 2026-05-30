import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { AdminService } from './admin.service';
import { HelperService } from '../shared/helpers/helper.service';
import { TokenService } from '../token/token.service';
import { MailService } from '../shared/email/sendEmail';
import { Admin } from './entities/admin.entity';
import { Token } from '../token/entities/token.entity';
import { CustomJosePayload } from '../shared/auth/jose-payload';
import { AuthType, TokenType } from '@youssef-brand/shared/shared-types';
import { UserRole } from '@youssef-brand/shared/shared-enums';

@Injectable()
export class AdminAuthService {

  private logger = new Logger('👔 Admin Auth Service 👔')

  constructor(
    @InjectRepository(Admin)
    private adminrRepository: Repository<Admin>,
    @InjectRepository(Token)
    private tokenRepository: Repository<Token>,
    private adminService: AdminService,
    private dataSource: DataSource,
    private configService: ConfigService,
    private tokenService: TokenService,
    private mailService: MailService,
    private helperService: HelperService) {}

  // Start login 
  async login(data: AuthType): Promise<TokenType> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.createQueryBuilder(Admin, "user")
        .where("user.email = :email", { email: data.email.trim() })
        .addSelect("user.password") // Critical for @Column({ select: false })
        .getOne();


      if (!user) {
        this.logger.error(`login call: Invalid credentials: email: ${data.email}, userPass: ${data.password}`);
        throw new HttpException({status: HttpStatus.NOT_FOUND, error: 'Invalid Credentials', }, HttpStatus.NOT_FOUND);
      }

      const isMatch = await argon2.verify(user.password, data.password);

      if (!isMatch) {
        this.logger.error(`login call: Invalid credentials: email: ${data.email}, userPass: ${data.password}`);
        throw new HttpException({status: HttpStatus.NOT_FOUND, error: 'Invalid Credentials', }, HttpStatus.NOT_FOUND);
      }

      const emailData = {
        // email: user.email,
        email: 'mawachimawachi@gmail.com',
        subject: 'Login Alert',
        header: 'Login',
        user: user.fullName,
        title: 'You have been logged into your account using this email address. We are sending you this email to verify your identity.',
        subtitle: 'If this was you, you can safely ignore this email. If this wasn\'t you, please click the button below to contact our support team and secure your account.',
        verification_code: '',
        origin: this.configService.get('ORIGIN'),
        link: 'api/contactadmin/',
        userId: '',
        buttonTitle: 'Contact Admin',
      }

      const createdToken = await this.tokenService.create(user.id, UserRole.enum.ADMIN);
      const payload: CustomJosePayload = { 
        id: user.id, 
        email: user.email, 
        fullName: user.fullName, 
        userRole: user.userRole,
        tokenId: createdToken.id,
      };

      const expiryDate = this.configService.get<string>('EXPIRES_IN_T');
      if (!expiryDate) {
        this.logger.error(`getTokens error EXPIRES_IN_T is not defined in the environment variables`);
        throw new HttpException({status: HttpStatus.FORBIDDEN, error: 'EXPIRES_IN_T is not defined in the environment variables'}, HttpStatus.FORBIDDEN);
      }

      const tokens = await this.helperService.generateToken(payload, expiryDate);
      await this.tokenService.updateHashes(createdToken.id, tokens);

      user.lastLogin = new Date();
      await queryRunner.manager.save(user);

      await this.mailService.sendEmail(emailData)
      this.logger.log(`✅ Login Successfully from user: ${user.email}`);
      await queryRunner.commitTransaction();
      return {
        id: createdToken.id,
        key: tokens.key,
        value: tokens.value
      }
    } catch (error) {
      this.logger.error(`🟥 login catch error: ${error}`);
      await queryRunner.rollbackTransaction();
      throw new HttpException({status: HttpStatus.INTERNAL_SERVER_ERROR, error: 'Internal Server Error', }, HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      await queryRunner.release();
    }
  }
  // End login 

  // Start refresh token
  async refreshTokens(userId: string, tokenId: string, accessKey: string): Promise<TokenType | any> {
    this.logger.log(`🟩🎉 refreshTokens Call`);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user: Admin = await this.adminService.findbyId(userId)

      const oldToken = await this.tokenRepository
        .createQueryBuilder("token")
        .where("id IN(:...ids)", { ids: [tokenId] })
        .addSelect("token.accessKey") 
        .getOne()

      if (!oldToken) {
        this.logger.error(`Token not found`);
        throw new HttpException({status: HttpStatus.NOT_FOUND, error: 'Token Not Found', }, HttpStatus.NOT_FOUND);
      }
      if (oldToken.isRevoked) {
        this.logger.warn(`Attempt to use a revoked token: ${tokenId}`);
        throw new HttpException({status: HttpStatus.UNAUTHORIZED, error: 'Token has been revoked', }, HttpStatus.UNAUTHORIZED);
      }

      const isMatch = await argon2.verify(oldToken.accessKey, accessKey);
      
      if (!isMatch) {
        this.logger.error(`Wrong AccessKey token: ${tokenId}`);
        throw new HttpException({status: HttpStatus.NOT_FOUND, error: 'Wrong AccessKey token', }, HttpStatus.NOT_FOUND);
      }

      const createdToken = await this.tokenService.create(user.id, UserRole.enum.ADMIN);
      const payload: CustomJosePayload = { 
        id: user.id, 
        email: user.email, 
        fullName: user.fullName, 
        userRole: user.userRole,
        tokenId: createdToken.id,
      };

      const expiryDate = this.configService.get<string>('EXPIRES_IN_RT');
      if (!expiryDate) {
        this.logger.error(`getTokens error EXPIRES_IN_T is not defined in the environment variables`);
        throw new HttpException({status: HttpStatus.FORBIDDEN, error: 'EXPIRES_IN_RT is not defined in the environment variables'}, HttpStatus.FORBIDDEN);
      }

      const tokens = await this.helperService.generateToken(payload, expiryDate);
      await this.tokenService.updateHashes(createdToken.id, tokens);

      const newToken: TokenType = await this.helperService.generateToken(payload, expiryDate);
      await this.tokenService.updateHashes(createdToken.id, newToken);
      await this.tokenService.revoke(oldToken.id);

      await queryRunner.commitTransaction();
      this.logger.log(`✅🎉 Refresh Tokens created successfully`);

      return {
        id: createdToken.id,
        key: newToken.key,
        value: newToken.value
      }
    }
    catch(error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`🟥 refreshTokens call catch error: ${error}`);
      throw new HttpException({status: HttpStatus.INTERNAL_SERVER_ERROR, error: 'Internal Server Error', }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    finally {
      await queryRunner.release();
    }
  }
  // end refresh token 

  // start logout
  async logout(userId: string, tokenId: string): Promise<{ message: string }> {
    this.logger.log(`🟩🎉 logout Call`);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.adminService.findbyId(userId)
      // check if the token matches the userId
      const token = await this.tokenService.findbyId(tokenId)

      if (!token.adminId || String(userId) !== String(token.adminId)) {
        this.logger.error(`🚫 Access Denied: User ${userId} tried to access Token ${token.id}}`);
        throw new HttpException({status: HttpStatus.FORBIDDEN, error: `Forbidden Action`}, HttpStatus.FORBIDDEN);
      }

      await this.tokenService.revoke(token.id)
      await queryRunner.commitTransaction();
      this.logger.log(`🟩🎉 logout successfully`);
      return { message: 'Your Session Is Ended' };
    }
    catch(error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`🟥 logout catch error: ${error}`);
      throw new HttpException({status: HttpStatus.INTERNAL_SERVER_ERROR, error: `Internal Server Error`}, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    finally {
      await queryRunner.release();
    }
  }
  // end logout
}
 