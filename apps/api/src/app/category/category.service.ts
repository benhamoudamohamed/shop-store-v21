import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ExceptionHelperService } from '../shared/helpers/exception-helper.service';
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
    private readonly imageService: ImageService,
    private readonly exceptionHelper: ExceptionHelperService) { 
    super(entityManager)
    // this.fakeIt(Category)
  }

  // Start findAll
  async findAll(): Promise<{ data: Category[]; count: number }> {    
    
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
    
    this.logger.log(`🟩 findOne Category successfully with id: ${id}`);
    return category;
  }
  // End findbyId

  // start create
  async create(data: CreateCategoryDto, file: Express.Multer.File): Promise<Category> {
    const imageEntity = await this.imageService.upload(file);
    const category = this.categoryRepository.create({ ...data, image: imageEntity });
    const savedCategory = await this.categoryRepository.save(category);
    this.logger.log(`🏗️ create Category successfully with ${category.name}`);
    return savedCategory;
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
    
    const updateData = { ...data };
    delete (updateData as any).id;
    Object.assign(category, updateData);

    this.logger.log(`✅ Update Category successfully: ${category.name}`);
    return await this.categoryRepository.save(category);
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
  // End delete
}
