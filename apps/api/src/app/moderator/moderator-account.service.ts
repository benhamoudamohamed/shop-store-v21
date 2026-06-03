import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { customAlphabet } from 'nanoid';
import { Moderator } from './entities/moderator.entity';
import { HelperService } from '../shared/helpers/helper.service';
import { MailService } from '../shared/email/sendEmail';
import { TransactionService } from '../shared/helpers/transaction.service';
import { UpdateUserPasswordDto } from '@youssef-brand/shared/shared-dto';
import { ResetPasswordType } from '@youssef-brand/shared/shared-types';

/**
 * Service that provides account management operations for moderator users.
 */
@Injectable()
export class ModeratorAccountService {
  private logger = new Logger('👤 Moderator Account Service 👤')

  constructor(
    @InjectRepository(Moderator)
    private readonly moderatorRepository: Repository<Moderator>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly helperService: HelperService,
    private readonly mailService: MailService,
    private readonly transactionService: TransactionService,
  ) {}

  /**
   * Update the moderator's full name by id.
   */
  async editName(id: string, fullName: string): Promise<Moderator> {
    const user = await this.moderatorRepository.findOne({ where: { id } });
    if (!user) {
      this.logger.error(`🟥 user not found with id: ${id}`);
      throw new HttpException({ status: HttpStatus.NOT_FOUND, error: 'User Not Found' }, HttpStatus.NOT_FOUND);
    }

    const updatedUser = new Moderator();
    updatedUser.fullName = fullName;

    await this.moderatorRepository.update(user.id, { ...updatedUser });
    this.logger.log(`🟩 update user successfully for: ${user.email}`);
    return await this.moderatorRepository.findOneOrFail({ where: { id } });
  }

  /**
   * Activate or deactivate a moderator account.
   */
  async toggleUserStatus(id: string, status: boolean): Promise<Moderator> {
    const user = await this.moderatorRepository.findOne({ where: { id } });
    if (!user) {
      this.logger.error(`🟥 user not found with id: ${id}`);
      throw new HttpException({ status: HttpStatus.NOT_FOUND, error: 'User Not Found' }, HttpStatus.NOT_FOUND);
    }

    const updatedUser = new Moderator();
    updatedUser.isActivated = status;
    await this.moderatorRepository.update(user.id, { ...updatedUser });

    const action = status ? 'Activated' : 'Deactivated';
    this.logger.log(`✅ toggle User Status successfully for: ${user.email} with status: ${action}`);
    return await this.moderatorRepository.findOneOrFail({ where: { id } });
  }

  /**
   * Generate and email a password reset verification code to a moderator.
   */
  async sendVerificationCode(email: string): Promise<{ message: string }> {
    const user = await this.dataSource.manager.findOne(Moderator, { where: { email } });

    if (!user) {
      this.logger.error(`user not found with email: ${email}`);
      throw new HttpException({ status: HttpStatus.NOT_FOUND, error: 'User Not Found' }, HttpStatus.NOT_FOUND);
    }
    if (user.isActivated) {
      const nanoid = customAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZ', 10);
      const verificationCode = nanoid();
      const newUser = new Moderator();
      newUser.verificationCode = await this.helperService.hashData(verificationCode);

      const emailData = {
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
      };

      return await this.transactionService.run(async (manager) => {
        await manager.update(Moderator, user.id, { ...newUser });
        await this.mailService.sendEmail(emailData);
        this.logger.log(`🟩 sendVerificationCode user successfully with: ${email}`);
        return { message: 'Verification Code Sent successfully' };
      });
    }

    this.logger.error(`sendVerificationCode call: Email Not Activated: ${user.email}, userPass: ${user.password}`);
    throw new HttpException({ status: HttpStatus.NOT_ACCEPTABLE, error: 'Email Not Activated' }, HttpStatus.NOT_ACCEPTABLE);
  }

  /**
   * Verify a reset password code provided by a moderator.
   */
  async verifyCode(data: ResetPasswordType): Promise<{ message: string }> {
    const { email, code } = data;
    const user = await this.moderatorRepository
      .createQueryBuilder('moderator')
      .where('moderator.email = :email', { email })
      .addSelect('moderator.verificationCode')
      .getOne();

    if (!user) {
      this.logger.error(`🟥 user not found with email: ${email}`);
      throw new HttpException({ status: HttpStatus.NOT_FOUND, error: 'User Not Found' }, HttpStatus.NOT_FOUND);
    }
    if (user.isActivated) {
      if (!code || !data.code) {
        this.logger.error(`🟥 code or verification code not found with email: ${email}`);
        throw new HttpException({ status: HttpStatus.NOT_FOUND, error: 'Code Not Found' }, HttpStatus.NOT_FOUND);
      }

      const isMatch = await argon2.verify(user.verificationCode, data.code);
      if (!isMatch) {
        this.logger.error(`resetPassowrd call: Invalid credentials: user: ${email}`);
        throw new HttpException({ status: HttpStatus.NOT_FOUND, error: 'Invalid Credentials' }, HttpStatus.NOT_FOUND);
      }

      this.logger.log(`✅ verifyCode Successfully from user: ${user.email}`);
      return { message: 'Code verified successfully' };
    }

    this.logger.error(`sendVerificationCode call: Email Not Activated: ${user.email}, userPass: ${user.password}`);
    throw new HttpException({ status: HttpStatus.NOT_ACCEPTABLE, error: 'Email Not Activated' }, HttpStatus.NOT_ACCEPTABLE);
  }

  /**
   * Update a moderator password and send a change notification email.
   */
  async updatePassword(data: UpdateUserPasswordDto): Promise<{ message: string }> {
    const { email, password } = data;

    const user = await this.moderatorRepository
      .createQueryBuilder('moderator')
      .where('moderator.email like :email', { email: `%${email}%` })
      .addSelect('moderator.password')
      .getOne();

    if (!user) {
      this.logger.error(`🟥 updatePassword user not found with email: ${email}`);
      throw new HttpException({ status: HttpStatus.NOT_FOUND, error: 'User Not Found' }, HttpStatus.NOT_FOUND);
    }

    const emailData = {
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
    };

    const newUser = new Moderator();
    newUser.password = await this.helperService.hashData(password);

    return await this.transactionService.run(async (manager) => {
      await manager.update(Moderator, user.id, { ...newUser });
      await this.mailService.sendEmail(emailData);
      this.logger.log(`✅ updatePassword successfully for: ${email}`);
      return { message: 'Password updated successfully' };
    });
  }
}
