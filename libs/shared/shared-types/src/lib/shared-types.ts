import { UserRole } from "@youssef-brand/shared/shared-enums";

export type User = {
  id: string;
  fullName: string; 
  email: string;
  password: string;
  userRole: UserRole;
  isActivated: boolean;
  verificationCode: string;
  createdAt: Date;
  updatedAt: Date;
  tokens: Token[]
}

export type AuthType = {
  email: string;
  password: string;
}

export type Token = {
  id: string;
  ownerId: string;
  adminId: string;
  moderatorId: string;
  accessToken: string;
  accessKey: string;
  isRevoked: boolean;
  createdAt: Date;
  updatedAt: Date;
  owner: User;
  admin: User;
  moderator: User;
  userRole: UserRole;
}

export type TokenType = {
  id?: string;
  key: string;
  value: string;
}

export type ResetPasswordType = {
  email: string;
  password?: string;
  code?: string;
}

export type EmailType = {
  email: string;
  subject: string;
  header: string;
  user: string;
  title: string;
  subtitle: string;
  verification_code: string;
  origin: string;
  link: string;
  userId: string;
  buttonTitle: string;
}

export type ProductModel = {
  productName: string;
  image?: string;
  price: number;
  quantity: number;
  cost?: number;
}