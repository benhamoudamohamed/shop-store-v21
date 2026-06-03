import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository, ILike } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PaginateQuery, Paginated, PaginateConfig, paginate } from 'nestjs-paginate';
import { Order } from 'nestjs-paginate/lib/helper';
import { GLOBAL_PAGINATION_CONFIG } from '../../main';
import { Moderator } from './entities/moderator.entity';
import { HelperService } from '../shared/helpers/helper.service';
import { MailService } from '../shared/email/sendEmail';
import { TransactionService } from '../shared/helpers/transaction.service';
import { Seed } from '../shared/seed/seed.class';
import { CreateUserDto } from '@youssef-brand/shared/shared-dto';
import { UserRole } from '@youssef-brand/shared/shared-enums';

@Injectable()
export class ModeratorService extends Seed {

  protected logger = new Logger('👤 Moderator Service 👤')

  constructor(
    entityManager: EntityManager,
    @InjectRepository(Moderator)
    private moderatorRepository: Repository<Moderator>,
    private configService: ConfigService,
    private helperService: HelperService,
    private mailService: MailService,
    private transactionService: TransactionService) {
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

  // Start delete
  async delete(id: string): Promise<{ message: string }> {
    const user = await this.findbyId(id)
    
    await this.moderatorRepository.delete(user.id)
    this.logger.log(`🟩 delete user successfully with email: ${user.email}`);
    return { message: 'User Deleted Successfully' };
  }
  // End delete
}
