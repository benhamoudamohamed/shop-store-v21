import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_PIPE, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ZodValidationPipe, ZodSerializerInterceptor } from 'nestjs-zod';
import { Config } from '../../config/config';
import { DatabaseConfig } from '../../config/database.config';
import { FrontendMiddleware } from './shared/middelware/frontend.middleware';
import { HttpExceptionFilter } from './shared/validation/http-exception.filter';
import { OwnerModule } from './owner/owner.module';
import { AdminModule } from './admin/admin.module';
import { TokenModule } from './token/token.module';
import { ModeratorModule } from './moderator/moderator.module';
import { CategoryModule } from './category/category.module';
import { ImageModule } from './image/image.module';
import { ProductModule } from './product/product.module';
import { PurchaseModule } from './purchase/purchase.module';
import { OrderItemModule } from './orderItem/order-item.module';
import { CouponModule } from './coupon/coupon.module';
import { InvoiceModule } from './invoice/invoice.module';

const ENV = process.env.NODE_ENV;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [Config],
      envFilePath: !ENV ? '.env' : `.env.${ENV}`,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: DatabaseConfig,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'client'),
      exclude: ['/api*path']
    }),
    OwnerModule,
    TokenModule,
    AdminModule,
    ModeratorModule,
    CategoryModule,
    ImageModule,
    ProductModule,
    PurchaseModule,
    OrderItemModule,
    CouponModule,
    InvoiceModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    { 
      provide: APP_INTERCEPTOR,
      useClass: ZodSerializerInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    }
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(FrontendMiddleware)
      .forRoutes({ path: 'ab*cd', method: RequestMethod.ALL });
  }
}
