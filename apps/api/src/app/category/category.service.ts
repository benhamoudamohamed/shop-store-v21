import { HttpException, HttpStatus, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { Product } from '../product/entities/product.entity';
import { ImageService } from '../image/image.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Seed } from '../shared/seed/seed.class';

@Injectable()
export class CategoryService extends Seed {
  
  protected logger = new Logger('🗂️ CategoryService 🗂️')
  
  constructor(
    entityManager: EntityManager,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private readonly imageService: ImageService) { 
    super(entityManager)
    // this.fakeIt(Category)
  }

  // Start findAll
  async findAll(): Promise<{ data: Category[]; count: number }> {    
    try {
      const [categories, count] = await this.categoryRepository
      .createQueryBuilder("cat")
      .leftJoinAndSelect("cat.image", "image")
      .leftJoinAndSelect("cat.products", "products")
      .orderBy('cat.createdAt', 'DESC')
      .getManyAndCount()

      this.logger.log(`🟩 findAll successfully`);
      return {
        count: count,
        data: categories,
      };
    }
    catch (error) {
      this.logger.error(`🟥 findAll catch Error: ${error}`)
      throw new HttpException({status: HttpStatus.INTERNAL_SERVER_ERROR, error: 'INTERNAL SERVER ERROR', }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  // End findAll

  // Start findbyId
  async findbyId(id: string): Promise<Category>  {
    const category = await this.categoryRepository.findOne({ 
      where: { id }, 
      relations: ['products', 'products.image', 'image']
    }); 

    if(!category) {
      this.logger.error(`🟥 Category not found with id: ${id}`)
      throw new HttpException({status: HttpStatus.NOT_FOUND, error: 'Category Not Found', }, HttpStatus.NOT_FOUND);
    }
    try {
      this.logger.log(`🟩 findOne Category successfully with id: ${id}`);
      return category;
    }
    catch (error) {
      this.logger.error(`🟥 findOne Category catch Error: ${error}`)
      throw new HttpException({status: HttpStatus.INTERNAL_SERVER_ERROR, error: 'INTERNAL SERVER ERROR', }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  // End findbyId

  // start create
  async create(data: CreateCategoryDto, file: Express.Multer.File): Promise<Category> {
    let uploadedImageId: string | undefined;
    try {
      const imageEntity = await this.imageService.upload(file);
      uploadedImageId = imageEntity.id;

      const category = this.categoryRepository.create({ ...data, image: imageEntity });
      const savedCategory = await this.categoryRepository.save(category);
      this.logger.log(`🏗️ create Category successfully with ${category.name}`);
      return savedCategory;
    } catch(error) {
      // 4. CLEANUP: If the category failed (e.g. duplicate name), delete the image
      if (uploadedImageId) {
        await this.imageService.deleteImage(uploadedImageId);
      }
      if (typeof error === 'object' && error !== null && 'code' in error) {
        const dbError = error as { code: string };
        if (dbError.code === '23505') {
          throw new HttpException({status: HttpStatus.FORBIDDEN, error: 'Category already exists'}, HttpStatus.FORBIDDEN);
        }
        throw new HttpException({status: HttpStatus.INTERNAL_SERVER_ERROR, error: 'Internal Server Error', }, HttpStatus.INTERNAL_SERVER_ERROR);
      }
      else {
        throw new HttpException({status: HttpStatus.INTERNAL_SERVER_ERROR, error: 'Internal Server Error', }, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }
  // End create

  // Start update
  async update(id: string, data: CreateCategoryDto, file?: Express.Multer.File): Promise<Category> {
    const category = await this.categoryRepository.findOne({ 
      where: { id }, 
      relations: ['image'] 
    }); 

    if (!category) {
      throw new HttpException({ status: HttpStatus.NOT_FOUND, error: 'Category not found' }, HttpStatus.NOT_FOUND);
    }

    if (file) {
      const oldImageId = category.image?.id;

      const newImageEntity = await this.imageService.upload(file);
      category.image = newImageEntity;
      
      if (oldImageId) {
        await this.imageService.deleteImage(oldImageId);
      }
    }
      
    try {
      const updateData = { ...data };
      delete (updateData as any).id;
      Object.assign(category, updateData);

      this.logger.log(`✅ Update Category successfully: ${category.name}`);
      return await this.categoryRepository.save(category);
      
    } catch (error) {
       if (typeof error === 'object' && error !== null && 'code' in error) {
        const dbError = error as { code: string };
        if (dbError.code === '23505') {
          throw new HttpException({status: HttpStatus.FORBIDDEN, error: 'Category already exists'}, HttpStatus.FORBIDDEN);
        }
        throw new HttpException({status: HttpStatus.INTERNAL_SERVER_ERROR, error: 'Internal Server Error', }, HttpStatus.INTERNAL_SERVER_ERROR);
      }
      else {
        throw new HttpException({status: HttpStatus.INTERNAL_SERVER_ERROR, error: 'Internal Server Error', }, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }
  // End update

  // Start delete
  async delete(id: string): Promise<{ message: string }> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['products', 'products.image', 'image'] // TypeORM needs to "see" these to delete them
    });

    if(!category) {
      this.logger.error(`🟥 Category not found with id: ${id}`)
      throw new HttpException({status: HttpStatus.NOT_FOUND, error: 'Category Not Found', }, HttpStatus.NOT_FOUND);
    }   
    try {
      // Loop through products and delete their images from the DISK
      if (category.products && category.products.length > 0) {
        for (const product of category.products) {
          if (product.image?.id) {
            await this.imageService.deleteImage(product.image.id);
            this.logger.log(`🗑️ Disk: Deleted product image for ${product.name}`);
          }
        }
      }
      const oldImageId = category.image?.id;
      if (category.image?.id) {
        this.logger.log(`🗑️ Disk: Deleted category image for ${category.name}`);
        await this.imageService.deleteImage(oldImageId);
      }

      await this.categoryRepository.delete(category.id)
      this.logger.log(`🗑️ delete category successfully`);
      return { message: 'Category Deleted Successfully' };
    }
    catch (error) {
      this.logger.error(`🟥 delete catch Error: ${error}`)
      throw new InternalServerErrorException(error)
    }
  }
  // End delete
}
