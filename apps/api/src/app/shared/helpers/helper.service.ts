import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as argon2 from 'argon2';
import { SignJWT } from "jose";
import { CustomJosePayload } from "../auth/jose-payload";
import { customAlphabet } from "nanoid";
import { TokenType } from "@youssef-brand/shared/shared-types";

@Injectable()
export class HelperService {
  
  private logger = new Logger('⚙️ HelperService ⚙️')

  constructor(private configService: ConfigService) { }

  async hashData(data: string): Promise<string> {
    return await argon2.hash(data); 
  }

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
