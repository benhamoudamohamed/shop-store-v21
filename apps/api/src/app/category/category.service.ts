import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
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

  /**
   * Fetch all categories including related images and products.
   * Returns paginated metadata with total count and category list.
   */
  async findAll(): Promise<{ data: Category[]; count: number }> {
    const [categories, count] = await this.categoryRepository
      .createQueryBuilder('cat')
      .leftJoinAndSelect('cat.image', 'image')
      .leftJoinAndSelect('cat.products', 'products')
      .orderBy('cat.createdAt', 'DESC')
      .getManyAndCount();

    this.logger.log(`🟩 findAll successfully`);
    return {
      count: count,
      data: categories,
    };
  }

  /**
   * Load a category by id with its products and image relations.
   * Throws 404 if the requested category does not exist.
   */
  async findbyId(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['products', 'products.image', 'image'],
    });

    if (!category) {
      this.logger.error(`🟥 Category not found with id: ${id}`);
      throw new HttpException(
        { status: HttpStatus.NOT_FOUND, error: 'Category Not Found' },
        HttpStatus.NOT_FOUND,
      );
    }

    this.logger.log(`🟩 findOne Category successfully with id: ${id}`);
    return category;
  }

  /**
   * Create a new category and attach the uploaded image entity.
   * The uploaded image is persisted first, then the category is saved.
   */
  async create(data: CreateCategoryDto, file: Express.Multer.File): Promise<Category> {
    const imageEntity = await this.imageService.upload(file);
    const category = this.categoryRepository.create({ ...data, image: imageEntity });
    const savedCategory = await this.categoryRepository.save(category);
    this.logger.log(`🏗️ create Category successfully with ${category.name}`);
    return savedCategory;
  }

  /**
   * Update an existing category and optionally replace its image.
   * Preserves the existing category record, then updates fields and image relations.
   */
  async update(id: string, data: CreateCategoryDto, file?: Express.Multer.File): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['image'],
    });

    if (!category) {
      throw new HttpException(
        { status: HttpStatus.NOT_FOUND, error: 'Category not found' },
        HttpStatus.NOT_FOUND,
      );
    }

    if (file) {
      category.image = await this.imageService.uploadAndReplace(category.image?.id, file);
    }

    const updateData: Record<string, unknown> = { ...data };
    delete updateData.id;
    Object.assign(category, updateData);

    this.logger.log(`✅ Update Category successfully: ${category.name}`);
    return await this.categoryRepository.save(category);
  }

  /**
   * Delete a category after cleaning up associated product and category images.
   * Ensures related product image files are removed from disk before delete.
   */
  async delete(id: string): Promise<{ message: string }> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['products', 'products.image', 'image'], // TypeORM needs to "see" these to delete them
    });

    if (!category) {
      this.logger.error(`🟥 Category not found with id: ${id}`);
      throw new HttpException(
        { status: HttpStatus.NOT_FOUND, error: 'Category Not Found' },
        HttpStatus.NOT_FOUND,
      );
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

    await this.categoryRepository.delete(category.id);
    this.logger.log(`🗑️ delete category successfully`);
    return { message: 'Category Deleted Successfully' };
  }
}
