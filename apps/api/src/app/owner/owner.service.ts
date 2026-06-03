import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { HelperService } from '../shared/helpers/helper.service';
import { Owner } from './entities/owner.entity';
import { UserRole } from '@youssef-brand/shared/shared-enums';
import { UpdateUserPasswordDto } from '@youssef-brand/shared/shared-dto';

/**
 * Service for owner account management, lookup, and password operations.
 */
@Injectable()
export class OwnerService {
  private logger = new Logger('👑 Owner Service 👑')

  constructor(
    @InjectRepository(Owner)
    private ownerRepository: Repository<Owner>,
    private dataSource: DataSource,
    private helperService: HelperService,) {
    // this.createUniqueOwner()
  }

  /**
   * Return all owner users with active token relations.
   */
  async findAllUsers(): Promise<{ data: Owner[]; count: number }> {    
    const [users, count] = await this.ownerRepository
    .createQueryBuilder("user")
    .leftJoinAndSelect("user.tokens", "token")
    .orderBy('user.createdAt', 'DESC')
    .getManyAndCount()

    this.logger.log(`🟩 findAllUsers successfully`);
    return {
      data: users,
      count: count,
    };
  }

  /**
   * Load a single owner by id and throw 404 if not found.
   */
  async findbyId(id: string): Promise<Owner>  {
    const user = await this.ownerRepository.findOne({where: {id}});
    if(!user) {
      this.logger.error(`🟥 user not found with id: ${id}`)
      throw new HttpException({status: HttpStatus.NOT_FOUND, error: 'Owner Not Found', }, HttpStatus.NOT_FOUND);
    }
    
    this.logger.log(`🟩 findOne owner successfully with id: ${id}`);
    return user;
  }

  /**
   * Create a unique owner account if none exists in the system.
   */
  async createUniqueOwner(): Promise<Owner> {
    const existingOwner = await this.ownerRepository.findOne({
      where: { userRole: UserRole.enum.OWNER }
    });
    if (existingOwner) {
      this.logger.error(`An owner already exists in the system.`);
      throw new HttpException({status: HttpStatus.FORBIDDEN, error: 'An owner already exists in the system.', }, HttpStatus.FORBIDDEN);
    }

    const hashedPassword = await this.helperService.hashData("passwordA1!")
    const data = {
      fullName: 'BigBoss',
      email:  'benhamouda.mohamed@outlook.com',
      password: hashedPassword,
      userRole: UserRole.enum.OWNER,
    }
    const savedOwner = await this.ownerRepository.save(data);
    this.logger.log(`✅ Owner created successfully}`);
    return savedOwner;
  }
  
  /**
   * Update the owner's password using a supplied email match.
   */
  async updatePassword(data: UpdateUserPasswordDto):  Promise<Owner> {

    const { email, password } = data;

    const user = await this.ownerRepository
      .createQueryBuilder("user")
      .where("user.email like :email", { email:`%${email}%` })
      .addSelect("user.password")
      .getOne()

    if(!user) {
      this.logger.error(`🟥 updatePassword user not found with email: ${email}`)
      throw new HttpException({status: HttpStatus.NOT_FOUND, error: 'User Not Found', }, HttpStatus.NOT_FOUND);
    }
  
    const newUser = new Owner();
    newUser.password = await this.helperService.hashData(password);
    await this.ownerRepository.update(user.id, {...newUser});
    this.logger.log(`🟩 update user successfully for: ${user.email}`);
    return await this.findbyId(user.id);
  }
}
