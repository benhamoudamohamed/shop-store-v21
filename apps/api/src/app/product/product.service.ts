import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { customAlphabet } from 'nanoid';
import { Product } from './entities/product.entity';
import { Category } from '../category/entities/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { ImageService } from '../image/image.service';
import { Seed } from '../shared/seed/seed.class';

@Injectable()
export class ProductService extends Seed {

  protected logger = new Logger('📦 ProductService 📦')

  constructor(
    entityManager: EntityManager,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private readonly imageService: ImageService) { 
    super(entityManager)
    // this.fakeIt(Product) 
  }

  // Start findAll
  async findAll(): Promise<{ data: Product[]; count: number }> {    
    
    const [products, count] = await this.productRepository
    .createQueryBuilder("product")
    .leftJoinAndSelect("product.image", "image")
    .orderBy('product.createdAt', 'DESC')
    .getManyAndCount()

    this.logger.log(`🟩 findAll successfully`);
    return {
      count: count,
      data: products,
    };
  }
  // End findAll

  // Start findbyId
  async findbyId(id: string): Promise<Product>  {
    const category = await this.productRepository.findOne({ 
      where: { id }, 
      relations: ['image', 'category'] 
    }); 

    if(!category) {
      this.logger.error(`🟥 Product not found with id: ${id}`)
      throw new HttpException({status: HttpStatus.NOT_FOUND, error: 'Product Not Found', }, HttpStatus.NOT_FOUND);
    }
    
    this.logger.log(`🟩 findOne Product successfully with id: ${id}`);
    return category;
  }
  // End findbyId

  // Start findByFavorite
  async findByFavorite(isFavorite: boolean): Promise<{ data: Product[]; count: number }> {
    if (isFavorite === undefined || isFavorite === null) {
      this.logger.error(`🟥 Product Param not found: ${isFavorite}`)
      throw new HttpException({status: HttpStatus.NOT_FOUND, error: 'No Param is Found', }, HttpStatus.NOT_FOUND);
    }
    
    const [products, count] = await this.productRepository
    .createQueryBuilder("product")
    .where("product.isFavorite = :isFavorite", { isFavorite })
    .leftJoinAndSelect("product.image", "image")
    .leftJoinAndSelect("product.category", "category")
    .orderBy('product.createdAt', 'DESC')
    .getManyAndCount()

    this.logger.log(`🟩 find Products ByFavorite successfully`);
    return {
      count: count,
      data: products,
    };
  }
  // End findByFavorite

  // start create
  async create(data: CreateProductDto, file: Express.Multer.File, catID: string): Promise<Partial<Product> & { totalTTC: number }> {
    const category = await this.categoryRepository.findOne({where: {id: catID}});
    if(!category) {
      this.logger.error(`🟥 findOne category not found with id: ${catID}`)
      throw new HttpException({status: HttpStatus.NOT_FOUND, error: 'Category not found', }, HttpStatus.NOT_FOUND);
    }

    const generateRandom = customAlphabet('123456789ABCDEFGHJKLMNPQRSTUVWXYZ', 6);

    const prefix = category.name
      .substring(0, 4)
      .toUpperCase()
      .padEnd(4, 'X');

    const productCode = `${prefix}-${generateRandom()}`;

    const imageEntity = await this.imageService.upload(file);
     
    // 1. Convert inputs to numbers to ensure math safety
    const unitPrice = Number(data.unitPrice);
    const tvaRate = Number(data.tva);

    const product = this.productRepository.create({
      ...data,
      unitPrice,      // Save the base price
      tvaRate,        // Save the % rate (e.g., 19)
      productCode,
      image: imageEntity,
      category,
    });

    const savedProduct = await this.productRepository.save(product);
    this.logger.log(`✅ create Product Successfully with ${product.name}`);

    const { ...productData } = savedProduct; 
    return {
      ...productData,
      totalTTC: savedProduct.totalTTC // Explicitly set the calculated value
    };
  }
  // End create

  // start update
  async update(id: string, catID: string, data: CreateProductDto, file?: Express.Multer.File): Promise<Partial<Product> & { totalTTC: number }> {
    const product = await this.productRepository.findOne({ 
      where: { id }, 
      relations: ['image', 'category']
    }); 
    if (!product) {
      throw new HttpException({ status: HttpStatus.NOT_FOUND, error: 'Product not found' }, HttpStatus.NOT_FOUND);
    }

    const category = await this.categoryRepository.findOne({where: {id: catID}});
    if(!category) {
      this.logger.error(`🟥 findOne category not found with id: ${catID}`)
      throw new HttpException({status: HttpStatus.NOT_FOUND, error: 'Category not found', }, HttpStatus.NOT_FOUND);
    }

    if (file) {
      product.image = await this.imageService.uploadAndReplace(product.image?.id, file);
    }
    
    const updateData = { ...data } as Partial<CreateProductDto> & { id?: string };
    delete updateData.id;
    
    Object.assign(product, updateData);
    product.category = category;

    // Convert to Number to ensure math safety from string inputs
    product.unitPrice = Number(data.unitPrice);
    product.tvaRate = Number(data.tva);
    product.isFavorite = data.isFavorite;
    product.isAvailable = data.isAvailable;
    
    // 3. Save the product
    Object.assign(product, data);
    const updatedProduct = await this.productRepository.save(product); 

    this.logger.log(`✅ Update product successfully ${product.name}`);

    const { ...productData } = updatedProduct; 
    return {
      ...productData,
      totalTTC: updatedProduct.totalTTC // Explicitly set the calculated value
    };
  }
  // End update

  // Start delete
  async delete(id: string): Promise<{ message: string }> {
    const product = await this.findbyId(id)
    const oldImageId = product.image?.id;
    
    await this.imageService.deleteImage(oldImageId);
    await this.productRepository.delete(product.id)
    
    this.logger.log(`🗑️ delete produc successfully`);
    return { message: 'Product Deleted Successfully' };
  }
  // End delete
}

