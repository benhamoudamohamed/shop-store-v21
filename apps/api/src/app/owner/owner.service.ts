import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { HelperService } from '../shared/helpers/helper.service';
import { Owner } from './entities/owner.entity';
import { UserRole } from '@youssef-brand/shared/shared-enums';
import { UpdateUserPasswordDto } from '@youssef-brand/shared/shared-dto';

@Injectable()
export class OwnerService {
  private logger = new Logger('👑 Owner Service 👑')

  constructor(
    @InjectRepository(Owner)
    private ownerRepository: Repository<Owner>,
    private dataSource: DataSource,
    private helperService: HelperService) {
    // this.createUniqueOwner()
  }

  // Start findAllUsers
  async findAllUsers(): Promise<{ data: Owner[]; count: number }> {    
    try {
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
    catch (error) {
      this.logger.error(`🟥 findAllUsers catch Error: ${error}`)
      throw new HttpException({status: HttpStatus.INTERNAL_SERVER_ERROR, error: 'INTERNAL SERVER ERROR', }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  // End findAllUsers

  // Start findbyId
  async findbyId(id: string): Promise<Owner>  {
    const user = await this.ownerRepository.findOne({where: {id}});
    if(!user) {
      this.logger.error(`🟥 user not found with id: ${id}`)
      throw new HttpException({status: HttpStatus.NOT_FOUND, error: 'Owner Not Found', }, HttpStatus.NOT_FOUND);
    }
    try {
      this.logger.log(`🟩 findOne owner successfully with id: ${id}`);
      return user;
    }
    catch (error) {
      this.logger.error(`🟥 findOne owner catch Error: ${error}`)
      throw new HttpException({status: HttpStatus.INTERNAL_SERVER_ERROR, error: 'INTERNAL SERVER ERROR', }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  // End findbyId

  // Start create
  async createUniqueOwner(): Promise<Owner> {
    const existingOwner = await this.ownerRepository.findOne({
      where: { userRole: UserRole.enum.OWNER }
    });
    if (existingOwner) {
      this.logger.error(`An owner already exists in the system.`);
      throw new HttpException({status: HttpStatus.FORBIDDEN, error: 'An owner already exists in the system.', }, HttpStatus.FORBIDDEN);
    }

    try {
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
    } catch (error) {
      this.logger.error(`🟥 create owner catch error: ${error}`);
      throw new HttpException({status: HttpStatus.INTERNAL_SERVER_ERROR, error: 'Internal Server Error', }, HttpStatus.INTERNAL_SERVER_ERROR);
    } 
  }
  // End create
  
  // Start updatePassword
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
    
    try {
      const newUser = new Owner();
      newUser.password = await this.helperService.hashData(password);
      await this.ownerRepository.update(user.id, {...newUser});
      this.logger.log(`🟩 update user successfully for: ${user.email}`);
      return await this.findbyId(user.id);
    }
    catch (error) {
      this.logger.error(`🟥 updatePassword catch Error: ${error}`)
      throw new HttpException({status: HttpStatus.INTERNAL_SERVER_ERROR, error: 'Internal Server Error', }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
