import { DataSource } from 'typeorm';
import { Owner } from './app/owner/entities/owner.entity';
import { Admin } from './app/admin/entities/admin.entity';
import { Moderator } from './app/moderator/entities/moderator.entity';
import { Token } from './app/token/entities/token.entity';
import { Category } from './app/category/entities/category.entity';
import { Product } from './app/product/entities/product.entity';
import { Image } from './app/image/entities/image.entity';
import { Purchase } from './app/purchase/entities/purchase.entity';
import { DeliverySlip } from './app/delivery-slip/entities/delivery-slip.entity';
import { OrderItem } from './app/orderItem/entities/order-item.entity';
import { Coupon } from './app/coupon/entities/coupon.entity';
import { Invoice } from './app/invoice/entities/invoice.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '009472938',
  database: process.env.DB_NAME || 'youssefshop',
  entities: [
    Owner,
    Admin,
    Moderator,
    Token,
    Category,
    Product,
    Image,
    Purchase,
    DeliverySlip,
    OrderItem,
    Coupon,
    Invoice
  ],
  migrations: [__dirname + '/migrations/*.ts'],
  synchronize: false, // Disable synchronize for migrations
});