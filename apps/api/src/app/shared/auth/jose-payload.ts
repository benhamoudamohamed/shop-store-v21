import type { JWTPayload } from 'jose' with { 'resolution-mode': 'import' };

/**
 * JWT payload shape used by the application for authenticated requests.
 */
export interface CustomJosePayload extends JWTPayload {
  id: string;
  email: string;
  fullName: string;
  userRole: string;
  tokenId: string;
  // 🔐 Add this line to satisfy index signature matching rule:
  [key: string]: unknown;
}
