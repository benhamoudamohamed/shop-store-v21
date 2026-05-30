import * as jose from 'jose';

export interface CustomJosePayload extends jose.JWTPayload {
  id: string;
  email: string;
  fullName: string;
  userRole: string;
  tokenId: string;
}
