import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, DataSource, ILike } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { customAlphabet } from 'nanoid';
import { PaginateQuery, Paginated, PaginateConfig, paginate } from 'nestjs-paginate';
import { Order } from 'nestjs-paginate/lib/helper';
import { GLOBAL_PAGINATION_CONFIG } from '../../main';
import { Moderator } from './entities/moderator.entity';
import { ExceptionHelperService } from '../shared/helpers/exception-helper.service';
import { HelperService } from '../shared/helpers/helper.service';
import { MailService } from '../shared/email/sendEmail';
import { TransactionService } from '../shared/helpers/transaction.service';
import { Seed } from '../shared/seed/seed.class';
import { CreateUserDto, UpdateUserPasswordDto } from '@youssef-brand/shared/shared-dto';
import { UserRole } from '@youssef-brand/shared/shared-enums';
import { ResetPasswordType } from '@youssef-brand/shared/shared-types';

@Injectable()
export class ModeratorService extends Seed {

  protected logger = new Logger('👤 Moderator Service 👤')

  constructor(
    entityManager: EntityManager,
    @InjectRepository(Moderator)
    private moderatorRepository: Repository<Moderator>,
    private dataSource: DataSource,
    private configService: ConfigService,
    private helperService: HelperService,
    private mailService: MailService,
    private transactionService: TransactionService,
    private exceptionHelper: ExceptionHelperService) {
      super(entityManager)
      // this.fakeIt(Moderator) 
  } 
 
  // Start findAllUsers
  async findAllUsers(): Promise<{ data: Moderator[]; count: number }> {    
    
    const [users, count] = await this.moderatorRepository
    .createQueryBuilder("moderator")
    .leftJoinAndSelect("moderator.tokens", "token")
    .orderBy('moderator.createdAt', 'DESC')
    .getManyAndCount()

    this.logger.log(`🟩 findAllUsers successfully`);
    return {
      count: count,
      data: users,
    };
  }
  // End findAllUsers

  //  Start findAllbyPagination
  async findAllbyPagination(paginateQuery: PaginateQuery): Promise<Paginated<Moderator>> {
    const queryBuilder = this.moderatorRepository
      .createQueryBuilder("moderator")
      .orderBy('moderator.createdAt', 'DESC')

    const config: PaginateConfig<Moderator> = {
      ...GLOBAL_PAGINATION_CONFIG,
      searchableColumns: ['fullName', 'email'] as const,
      sortableColumns: ['id', 'createdAt'] as const,
      // Cast the sort order to Order<Moderator>[]
      defaultSortBy: [['createdAt', 'DESC']] as Order<Moderator>[],
    };
    
    this.logger.log(`🟩 findAll By Pagination successfully`);
    return await paginate<Moderator>(paginateQuery, queryBuilder, config)
  }
  // End findAllbyPagination

  // Start findbyId
  async findbyId(id: string): Promise<Moderator>  {
    const user = await this.moderatorRepository.findOne({where: {id}});
    if(!user) {
      this.logger.error(`🟥 user not found with id: ${id}`)
      throw new HttpException({status: HttpStatus.NOT_FOUND, error: 'User Not Found', }, HttpStatus.NOT_FOUND);
    }
  
    this.logger.log(`🟩 findOne user successfully with id: ${id}`);
    return user;
  }
  // End findbyId

  // Start findByName
  async findByName(fullName: string): Promise<Moderator>  {
    const user = await this.moderatorRepository.findOne({where: { fullName: ILike(`${fullName}`)}});

    if(!user) {
      this.logger.error(`user not found with firstname: ${fullName}`);
      throw new HttpException({status: HttpStatus.NOT_FOUND, error: 'User Not Found', }, HttpStatus.NOT_FOUND);
    }
    
    this.logger.log(`🟩 findByName user successfully with: ${fullName}`);
    return user;
  }
  // End findByName

  // Start findbyMail
  async findbyMail(email: string): Promise<Moderator>  {
    const user = await this.moderatorRepository.findOne({where: {email}});
    if(!user) {
      this.logger.error(`🟥 user not found with email: ${email}`)
      throw new HttpException({status: HttpStatus.NOT_FOUND, error: 'User Not Found', }, HttpStatus.NOT_FOUND);
    }
    
    this.logger.log(`🟩 findbyMail user successfully with email: ${email}`);
    return user;
  }
  // End findbyMail

  // Start create
  async create(data: CreateUserDto): Promise<Moderator> {
    return await this.transactionService.run(async (manager) => {
      const { fullName, email, password } = data;

      const newUser = manager.create(Moderator, {
        fullName,
        email,
        password: await this.helperService.hashData(password),
        userRole: UserRole.enum.MODERATOR,
      });

      const emailData = {
        // email: newUser.email,
        email: 'mawachimawachi@gmail.com',
        subject: 'Registration Alert',
        header: 'Registration',
        user: newUser.fullName,
        title: 'You have been registered into your account using this email address.',
        subtitle: '',
        verification_code: '',
        origin: this.configService.get('ORIGIN'),
        link: 'api/contactadmin/',
        userId: '',
        buttonTitle: 'Contact Admin',
      };

      const user = await manager.save(newUser);
      await this.mailService.sendEmail(emailData);
      this.logger.log(`✅ create user successfully with ${data}`);
      return user;
    });
  }
  // End create

  // Start editName for users
  async editName(id: string, fullName: string): Promise<Moderator> {
    const user = await this.findbyId(id)
    const newUser = new Moderator();
    newUser.fullName = fullName;
    
    await this.moderatorRepository.update(user.id, {...newUser});
    this.logger.log(`🟩 update user successfully for: ${user.email}`);
    return await this.findbyId(id);
  }
  // End editName

  // start Activate user 
  async toggleUserStatus(id: string, status: boolean): Promise<Moderator> {
    const user = await this.findbyId(id)

    const newUser = new Moderator();
    newUser.isActivated = status;
    await this.moderatorRepository.update(user.id, {...newUser});

    const action = status ? 'Activated' : 'Deactivated';
    this.logger.log(`✅ toggle User Status successfully for: ${user.email} with status: ${action}`);
    return await this.findbyId(id);
  }
  // End Activate user

  // Start updatePassword  
  async sendVerificationCode(email: string): Promise<{ message: string }> {
    const user = await this.dataSource.manager.findOne(Moderator, { where: { email } });

    if(!user) {
      this.logger.error(`user not found with email: ${email}`);
      throw new HttpException({status: HttpStatus.NOT_FOUND, error: 'User Not Found', }, HttpStatus.NOT_FOUND);
    }
    if(user.isActivated) {
      const nanoid = customAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZ', 10);
      const verificationCode = nanoid();
      const newUser = new Moderator();
      newUser.verificationCode = await this.helperService.hashData(verificationCode);

      const emailData = {
        // email: newUser.email,
        email: 'mawachimawachi@gmail.com',
        subject: 'Password Change Alert',
        header: 'Password Change Tentative',
        user: user.fullName,
        title: 'We have sent you this verification code to proceed with changing your password',
        subtitle: 'If you did not request this change, please contact our support team immediately to secure your account.',
        verification_code: verificationCode,
        origin: this.configService.get('ORIGIN'),
        link: 'api/contactadmin/',
        userId: '',
        buttonTitle: 'Contact Admin',
      }

      return await this.transactionService.run(async (manager) => {
        await manager.update(Moderator, user.id, {...newUser});
        await this.mailService.sendEmail(emailData);
        this.logger.log(`🟩 sendVerificationCode user successfully with: ${email}`);
        return { message: 'Verification Code Sent successfully' };
      });
    }
    else {
      this.logger.error(`sendVerificationCode call: Email Not Activated: ${user.email}, userPass: ${user.password}`);
      throw new HttpException({status: HttpStatus.NOT_ACCEPTABLE, error: 'Email Not Activated', }, HttpStatus.NOT_ACCEPTABLE);
    }
  }

  async verifyCode(data: ResetPasswordType): Promise<{ message: string }> {
    const {email, code} = data
    const user = await this.moderatorRepository
      .createQueryBuilder("moderator")
      .where("moderator.email = :email", { email })
      .addSelect("moderator.verificationCode")
      .getOne()

    if(!user) {
      this.logger.error(`🟥 user not found with email: ${email}`)
      throw new HttpException({status: HttpStatus.NOT_FOUND, error: 'User Not Found', }, HttpStatus.NOT_FOUND);
    }
    if(user.isActivated) {
      if (!code || !data.code) {
        this.logger.error(`🟥 code or verification code not found with email: ${email}`)
        throw new HttpException({status: HttpStatus.NOT_FOUND, error: 'Code Not Found', }, HttpStatus.NOT_FOUND);
      }

      const isMatch = await argon2.verify(user.verificationCode, data.code);
      
      if (!isMatch) {
        this.logger.error(`resetPassowrd call: Invalid credentials: user: ${email}`);
        throw new HttpException({status: HttpStatus.NOT_FOUND, error: 'Invalid Credentials', }, HttpStatus.NOT_FOUND);
      }
      
      this.logger.log(`✅ verifyCode Successfully from user: ${user.email}`);
      return { message: 'Code verified successfully' };
    }
    else {
      this.logger.error(`sendVerificationCode call: Email Not Activated: ${user.email}, userPass: ${user.password}`);
      throw new HttpException({status: HttpStatus.NOT_ACCEPTABLE, error: 'Email Not Activated', }, HttpStatus.NOT_ACCEPTABLE);
    }
  }

  async updatePassword(data: UpdateUserPasswordDto): Promise<{ message: string }> {
    const { email, password } = data;

    const user = await this.moderatorRepository
      .createQueryBuilder('moderator')
      .where('moderator.email like :email', { email:`%${email}%` })
      .addSelect('moderator.password')
      .getOne()

    if(!user) {
      this.logger.error(`🟥 updatePassword user not found with email: ${email}`)
      throw new HttpException({status: HttpStatus.NOT_FOUND, error: 'User Not Found', }, HttpStatus.NOT_FOUND);
    }

    const emailData = {
      // email: newUser.email,
      email: 'mawachimawachi@gmail.com',
      subject: 'Password Change Alert',
      header: 'Password Change successfully',
      user: user.fullName,
      title: 'Your Password is Changed Successfully',
      subtitle: 'If you did not request this change, please contact our support team immediately to secure your account.',
      verification_code: '',
      origin: this.configService.get('ORIGIN'),
      link: 'api/contactadmin/',
      userId: '',
      buttonTitle: 'Contact Admin',
    }

    const newUser = new Moderator();
    newUser.password = await this.helperService.hashData(password);
    
    return await this.transactionService.run(async (manager) => {
      await manager.update(Moderator, user.id, {...newUser});
      await this.mailService.sendEmail(emailData);
      this.logger.log(`✅ updatePassword successfully for: ${email}`);
      return { message: 'Password updated successfully' };
    });
  }
  // end updatePassword

  // Start delete
  async delete(id: string): Promise<{ message: string }> {
    const user = await this.findbyId(id)
    
    await this.moderatorRepository.delete(user.id)
    this.logger.log(`🟩 delete user successfully with email: ${user.email}`);
    return { message: 'User Deleted Successfully' };
  }
  // End delete
}
