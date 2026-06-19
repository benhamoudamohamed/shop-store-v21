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

export type Product = {
  id: string;
  productCode: string;
  name: string;
  description: string;
  unitPrice: number;
  tvaRate: number;
  totalTTC: number;
  stock: number;
  isFavorite: boolean;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
  images: Image[];
  category: Category;
  // orderItems: OrderItem[];
}

export type Category = {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  image: Image;
  products: Product[];
}

export type Image = {
  id: string;
  originalName: string;
  originalUrl: string;
  thumbnailName: string;
  thumbnailUrl: string;
  mimeType: string;
  createdAt: Date;
}