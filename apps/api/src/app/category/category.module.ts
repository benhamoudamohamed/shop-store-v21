import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Image } from '../image/entities/image.entity';
import { Product } from '../product/entities/product.entity';
import { Token } from '../token/entities/token.entity';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { ImageService } from '../image/image.service';
import { HelperService } from '../shared/helpers/helper.service';
import { TokenService } from '../token/token.service';
import { TokenLifecycleService } from '../token/token-lifecycle.service';
import { TokenHashService } from '../token/token-hash.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Token, Category, Image, Product]),
  ],
  controllers: [CategoryController],
  providers: [CategoryService, TokenService, TokenLifecycleService, TokenHashService, HelperService, ImageService],
})
export class CategoryModule {}