import * as jose from 'jose';

/**
 * JWT payload shape used by the application for authenticated requests.
 */
export interface CustomJosePayload extends jose.JWTPayload {
  id: string;
  email: string;
  fullName: string;
  userRole: string;
  tokenId: string;
}
