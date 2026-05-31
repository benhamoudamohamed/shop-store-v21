import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { CustomJosePayload } from '../auth/jose-payload';
import { TokenType } from '@youssef-brand/shared/shared-types';

@Injectable()
export class AuthHelperService {
  constructor(private readonly configService: ConfigService) {}

  async verifyPassword(hash: string, plainText: string): Promise<boolean> {
    return argon2.verify(hash, plainText);
  }

  validateExpiry(expiry: string | undefined, envName: string): string {
    if (!expiry) {
      throw new HttpException(
        { status: HttpStatus.FORBIDDEN, error: `${envName} is not defined in the environment variables` },
        HttpStatus.FORBIDDEN,
      );
    }
    return expiry;
  }

  buildAuthEmail(userName: string, origin?: string) {
    return {
      email: 'mawachimawachi@gmail.com',
      subject: 'Login Alert',
      header: 'Login',
      user: userName,
      title: 'You have been logged into your account using this email address. We are sending you this email to verify your identity.',
      subtitle: 'If this was you, you can safely ignore this email. If this wasn\'t you, please click the button below to contact our support team and secure your account.',
      verification_code: '',
      origin: origin ?? '',
      link: 'api/contactadmin/',
      userId: '',
      buttonTitle: 'Contact Admin',
    };
  }

  buildPayload(user: { id: string; email: string; fullName: string; userRole: string }, tokenId: string): CustomJosePayload {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      userRole: user.userRole,
      tokenId,
    };
  }

  async createTokenPair(payload: CustomJosePayload, expiresIn: string): Promise<TokenType> {
    const jwtSecret = new TextEncoder().encode(this.configService.get('JWT_SECRET'));
    const expiryDate = expiresIn;

    const token = await new (await import('jose')).SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiryDate)
      .sign(jwtSecret);

    const { customAlphabet } = await import('nanoid');
    const accessTokenKey = customAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZ', 10)();

    return { key: accessTokenKey, value: token };
  }
}
