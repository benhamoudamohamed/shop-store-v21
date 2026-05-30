import { Controller, Get, Post, Body, Param, Delete, HttpCode, HttpStatus, UseGuards, UploadedFile, UseInterceptors, ParseBoolPipe, Put } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { Product } from './entities/product.entity';
import { AuthenticationGuard } from '../shared/auth/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from '../../../config/multer-config';

@Controller('product')
export class ProductController {
    
  constructor(private readonly productService: ProductService) {}

  @Get('/all')
  @HttpCode(HttpStatus.OK)
  findAll(): Promise<{ data: Product[]; count: number }> {  
    return this.productService.findAll();
  }

  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  findbyId(@Param('id') id: string): Promise<Product> {
    return this.productService.findbyId(id);
  }

  @Get('isFavorite/:status')
  findByFavorite(@Param('status', ParseBoolPipe) status: boolean): Promise<{ data: Product[]; count: number }> {
    return this.productService.findByFavorite(status);
  }

  @UseGuards(AuthenticationGuard)
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @Post('category/:catID')
  @HttpCode(HttpStatus.CREATED)
  create(
    @UploadedFile() file: Express.Multer.File, 
    @Body() data: CreateProductDto, 
    @Param('catID') catID: string): Promise<Partial<Product> & { totalTTC: number }> {
    return this.productService.create(data, file, catID);
  }

  @UseGuards(AuthenticationGuard)
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @Put(':id/category/:catID')
  @HttpCode(HttpStatus.CREATED)
  async update(
    @Param('id') id: string,
    @Param('catID') catID: string,
    @Body() data: CreateProductDto,
    @UploadedFile() file?: Express.Multer.File): Promise<Partial<Product> & { totalTTC: number }> {
    return this.productService.update(id, catID, data, file);
  }

  @UseGuards(AuthenticationGuard)
  @Delete('/:id')
  delete(@Param('id') id: string): Promise<{ message: string }> {
    return this.productService.delete(id);
  }  
}
