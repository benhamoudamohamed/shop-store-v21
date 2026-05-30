import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { EmailType } from '@youssef-brand/shared/shared-types';
const configService = new ConfigService();

@Injectable()
export class MailService {
  private readonly resend = new Resend(configService.get('RESEND_SECRET'));
  private logger = new Logger('📧 MailService 📧')

  async sendEmail(dataType: EmailType) {

    const templatePath = path.join(process.cwd(), 'apps/api/src/app/shared/email/email-template.html');

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found at: ${templatePath}`);
    }

    let htmlContent = fs.readFileSync(templatePath, 'utf8');

    htmlContent = htmlContent
    .replace('{{user}}', dataType.user)
    .replace('{{header}}', dataType.header)
    .replace('{{title}}', dataType.title)
    .replace('{{subtitle}}', dataType.subtitle)
    .replace('{{verificationCode}}', dataType.verification_code)
    .replace('{{origin}}', dataType.origin)
    .replace('{{link}}', dataType.link)
    .replace('{{userId}}', dataType.userId)
    .replace('{{buttonTitle}}', dataType.buttonTitle);

    const { data, error } = await this.resend.emails.send({
      from: 'Mohamed <delivered@resend.dev>',
      to: dataType.email,
      // to: 'Chris <mawachimawachi@gmail.com>',
      subject: dataType.subject,
      html: htmlContent
    });

    if (error) {
      this.logger.error('🟥 Email sent Failure', error);
      throw error; // Throw so the calling service knows it failed
    }

    this.logger.log('📨 Email sent successfully');
    return data;
  }
}