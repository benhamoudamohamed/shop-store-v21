import { Controller, Get, Post, Body, HttpStatus, HttpCode, UseGuards, UseInterceptors, UploadedFile, Param, Delete, Put } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Category } from './entities/category.entity';
import { AuthenticationGuard } from '../shared/auth/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from '../../../config/multer-config';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}
  
  /**
   * Public endpoint returning all categories with images and product counts.
   */
  @Get('/all')
  @HttpCode(HttpStatus.OK)
  findAll(): Promise<{ data: Category[]; count: number }> {
    return this.categoryService.findAll();
  }

  /**
   * Public endpoint returning a single category by id.
   */
  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  findbyId(@Param('id') id: string): Promise<Category> {
    return this.categoryService.findbyId(id);
  }

  /**
   * Protected endpoint for creating a category with an uploaded image.
   */
  @UseGuards(AuthenticationGuard)
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@UploadedFile() file: Express.Multer.File, @Body() data: CreateCategoryDto): Promise<Category> {
    return this.categoryService.create(data, file);
  }

  /**
   * Protected endpoint for updating category data and optionally replacing the category image.
   */
  @UseGuards(AuthenticationGuard)
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @Put(':id')
  @HttpCode(HttpStatus.CREATED)
  async update(
    @Param('id') id: string,
    @Body() data: CreateCategoryDto,
    @UploadedFile() file?: Express.Multer.File) {
    return this.categoryService.update(id, data, file);
  }

  /**
   * Protected endpoint for deleting a category and its associated image assets.
   */
  @UseGuards(AuthenticationGuard)
  @Delete('/:id')
  delete(@Param('id') id: string): Promise<{ message: string }> {
    return this.categoryService.delete(id);
  }

}
