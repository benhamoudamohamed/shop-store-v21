import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as argon2 from 'argon2';
const { SignJWT } = require('jose');
import { CustomJosePayload } from "../auth/jose-payload";
import { customAlphabet } from "nanoid";
import { TokenType } from "@youssef-brand/shared/shared-types";

/**
 * Shared utility service for hashing and token creation functions.
 */
@Injectable()
export class HelperService {
  
  private logger = new Logger('⚙️ HelperService ⚙️')

  constructor(private configService: ConfigService) { }

  /**
   * Hash an arbitrary string with Argon2.
   */
  async hashData(data: string): Promise<string> {
    return await argon2.hash(data); 
  }

  /**
   * Generate a signed JWT paired with a random access key.
   */
  async generateToken(payload: CustomJosePayload, expiresIn: string): Promise<TokenType> {
    const jwtSecret = new TextEncoder().encode(this.configService.get('JWT_SECRET'));
    const expiryDate = expiresIn;
    
    const nanoid = customAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZ', 10);
    const accessTokenKey = nanoid();  
    const accessToken = await new SignJWT(payload).setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(expiryDate)
      .sign(jwtSecret);
    
    return {
      key: accessTokenKey,
      value: accessToken
    }
  }
}
