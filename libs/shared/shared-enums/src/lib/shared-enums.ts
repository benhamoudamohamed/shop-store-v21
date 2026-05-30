import { z } from 'zod';

export const UserRole = z.enum(['OWNER', 'ADMIN', 'MODERATOR']);
export type UserRole = z.infer<typeof UserRole>;

export const PurchaseStatus = z.enum(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED']);
export type PurchaseStatus = z.infer<typeof PurchaseStatus>;
