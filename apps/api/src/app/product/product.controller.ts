import { Controller, Get, Post, Body, Param, Delete, HttpCode, HttpStatus, UseGuards, UseInterceptors, ParseBoolPipe, Put, UploadedFiles } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { Product } from './entities/product.entity';
import { AuthenticationGuard } from '../shared/auth/auth.guard';
import { FilesInterceptor } from '@nestjs/platform-express';
import { multerOptions } from '../../../config/multer-config';

/**
 * Controller exposing product management endpoints.
 */
@Controller('product')
export class ProductController {
    
  constructor(private readonly productService: ProductService) {}

  /**
   * Public endpoint returning all products with images.
   */
  @Get('/all')
  @HttpCode(HttpStatus.OK)
  findAll(): Promise<{ data: Product[]; count: number }> {  
    return this.productService.findAll();
  }

  /**
   * Public endpoint returning a single product by id.
   */
  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  findbyId(@Param('id') id: string): Promise<Product> {
    return this.productService.findbyId(id);
  }

  /**
   * Fetch products filtered by favorite status.
   */
  @Get('isFavorite/:status')
  findByFavorite(@Param('status', ParseBoolPipe) status: boolean): Promise<{ data: Product[]; count: number }> {
    return this.productService.findByFavorite(status);
  }

  /**
   * Protected endpoint to create a product under a specific category.
   */
  @UseGuards(AuthenticationGuard)
  @UseInterceptors(FilesInterceptor('files', 10, multerOptions))
  @Post('category/:catID')
  @HttpCode(HttpStatus.CREATED)
  create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() data: CreateProductDto, 
    @Param('catID') catID: string): Promise<Partial<Product> & { totalTTC: number }> {
    return this.productService.create(data, files, catID);
  }

  /**
   * Protected endpoint to update a product and optionally replace its image.
   */
  @UseGuards(AuthenticationGuard)
  @UseInterceptors(FilesInterceptor('files', 10, multerOptions))
  @Put(':id/category/:catID')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Param('catID') catID: string,
    @Body() data: CreateProductDto,
    @UploadedFiles() files?: Express.Multer.File[]): Promise<Partial<Product> & { totalTTC: number }> {
    return this.productService.update(id, catID, data, files);
  }

  /**
   * Protected endpoint to delete a product by id.
   */
  @UseGuards(AuthenticationGuard)
  @Delete('/:id')
  delete(@Param('id') id: string): Promise<{ message: string }> {
    return this.productService.delete(id);
  }  
}
