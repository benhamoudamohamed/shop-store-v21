import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { HelperService } from '../shared/helpers/helper.service';
import { Admin } from './entities/admin.entity';
import { UpdateUserPasswordDto } from '@youssef-brand/shared/shared-dto';
import { UserRole } from '@youssef-brand/shared/shared-enums';

@Injectable()
export class AdminService {
  private logger = new Logger('👔 Admin Service 👔')

  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
    private dataSource: DataSource,
    private helperService: HelperService) {
    // this.createUniqueAdmin()
  }

  // Start findAllUsers
  async findAllUsers(): Promise<{ data: Admin[]; count: number }> {    
    try {
      const [users, count] = await this.adminRepository
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
  async findbyId(id: string): Promise<Admin>  {
    const user = await this.adminRepository.findOne({where: {id}});
    if(!user) {
      this.logger.error(`🟥 user not found with id: ${id}`)
      throw new HttpException({status: HttpStatus.NOT_FOUND, error: 'Admin Not Found', }, HttpStatus.NOT_FOUND);
    }
    try {
      this.logger.log(`🟩 findOne admin successfully with id: ${id}`);
      return user;
    }
    catch (error) {
      this.logger.error(`🟥 findOne admin catch Error: ${error}`)
      throw new HttpException({status: HttpStatus.INTERNAL_SERVER_ERROR, error: 'INTERNAL SERVER ERROR', }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  // End findbyId

  // Start create
  async createUniqueAdmin(): Promise<Admin> {
    const existingAdmin = await this.adminRepository.findOne({
      where: { userRole: UserRole.enum.ADMIN }
    });
    if (existingAdmin) {
      this.logger.error(`An admin already exists in the system.`);
      throw new HttpException({status: HttpStatus.FORBIDDEN, error: 'An admin already exists in the system.', }, HttpStatus.FORBIDDEN);
    }

    try {
      const hashedPassword = await this.helperService.hashData("passwordA1!")
      const data = {
        fullName: 'BigBoss',
        email:  'benhamouda.mohamed@outlook.com',
        password: hashedPassword,
        userRole: UserRole.enum.ADMIN,
        isActivated: true
      }
      const savedAdmin = await this.adminRepository.save(data);
      this.logger.log(`✅ Admin created successfully}`);
      return savedAdmin;
    } catch (error) {
      this.logger.error(`🟥 create admin catch error: ${error}`);
      throw new HttpException({status: HttpStatus.INTERNAL_SERVER_ERROR, error: 'Internal Server Error', }, HttpStatus.INTERNAL_SERVER_ERROR);
    } 
  }
  // End create
  
  // Start updatePassword
  async updatePassword(data: UpdateUserPasswordDto):  Promise<Admin> {

    const { email, password } = data;

    const user = await this.adminRepository
      .createQueryBuilder("user")
      .where("user.email like :email", { email:`%${email}%` })
      .addSelect("user.password")
      .getOne()

    if(!user) {
      this.logger.error(`🟥 updatePassword user not found with email: ${email}`)
      throw new HttpException({status: HttpStatus.NOT_FOUND, error: 'User Not Found', }, HttpStatus.NOT_FOUND);
    }
    
    try {
      const newUser = new Admin();
      newUser.password = await this.helperService.hashData(password);
      await this.adminRepository.update(user.id, {...newUser});
      this.logger.log(`🟩 update user successfully for: ${user.email}`);
      return await this.findbyId(user.id);
    }
    catch (error) {
      this.logger.error(`🟥 updatePassword catch Error: ${error}`)
      throw new HttpException({status: HttpStatus.INTERNAL_SERVER_ERROR, error: 'Internal Server Error', }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
