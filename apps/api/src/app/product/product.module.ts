import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Category } from '../category/entities/category.entity';
import { Image } from '../image/entities/image.entity';
import { Token } from '../token/entities/token.entity';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { TokenService } from '../token/token.service';
import { TokenLifecycleService } from '../token/token-lifecycle.service';
import { TokenHashService } from '../token/token-hash.service';
import { ImageService } from '../image/image.service';
import { HelperService } from '../shared/helpers/helper.service';
import { ProductSubscriber } from './product.subscriber';

@Module({
  imports: [
    TypeOrmModule.forFeature([Token, Product, Image, Category]),
  ],
  controllers: [ProductController],
  providers: [ProductService, TokenService, TokenLifecycleService, TokenHashService, HelperService, ImageService, ProductSubscriber],
})
export class ProductModule {}
