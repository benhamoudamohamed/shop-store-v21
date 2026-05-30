import { CanActivate, ExecutionContext, Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { jwtVerify } from 'jose';
import { TokenService } from '../../token/token.service';
import { CustomJosePayload } from './jose-payload';

@Injectable()
export class AuthenticationGuard implements CanActivate {

  private logger = new Logger('🛡️ AuthGuard 🛡️')

  constructor(private configService: ConfigService, private tokenService: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new HttpException('Authorization header missing', HttpStatus.UNAUTHORIZED);
    }

    const payload: CustomJosePayload = await this.validateToken(authHeader);

    if (!payload.tokenId || !payload.id) {
      throw new HttpException('Token is missing required session data', HttpStatus.UNAUTHORIZED);
    }

    const isRevoked = await this.tokenService.isTokenRevoked(payload.tokenId);

    if (isRevoked) {
      this.logger.error(`🚫 Token has been revoked ${payload.email}`);
      throw new HttpException('Token has been revoked', HttpStatus.UNAUTHORIZED);
    }

    request.user = payload;
    return true;
  }

async validateToken(auth: string) {
    const [type, token] = auth.split(' ');

    if (type !== 'Bearer' || !token) {
      this.logger.error(`🚫 AuthGuard: Invalid token format`);
      throw new HttpException('Invalid token format', HttpStatus.UNAUTHORIZED);
    }

    try {
      const jwtSecret = new TextEncoder().encode(this.configService.get('JWT_SECRET'));
      // jwtVerify returns an object { payload, protectedHeader }
      const { payload } = await jwtVerify(token, jwtSecret);
      return payload as CustomJosePayload;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`🚫 AuthGuard catch error: ${errorMessage}`);
      throw new HttpException('Invalid or expired token', HttpStatus.UNAUTHORIZED);
    }
  }
}
