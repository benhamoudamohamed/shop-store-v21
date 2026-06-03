import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Image } from './entities/image.entity';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class ImageService {
  
  private logger = new Logger('🖼️ ImageService 🖼️')

  constructor(@InjectRepository(Image) private readonly imageRepository: Repository<Image>) {}

  async upload(file: Express.Multer.File): Promise<Image> {
    this.logger.log(`📤 upload call`);

    const uploadDir = './upload';
    const thumbnailFilename = `thumb_${file.filename}`;
    
    // Create the low-res version automatically
    await sharp(file.path)
      .resize(300) // Tiny width for the "blurry" effect
      .toFile(join(uploadDir, thumbnailFilename));

    const newImage = this.imageRepository.create({
      originalName:`Large_${file.originalname}`,
      originalUrl: file.filename,
      thumbnailName: `Thumb_${file.originalname}`,
      thumbnailUrl: thumbnailFilename,
      mimeType: file.mimetype,
    });
    this.logger.log(`📤 Uploading images...`);
    return await this.imageRepository.save(newImage);
  }

  async uploadAndReplace(oldImageId: string | undefined, file: Express.Multer.File): Promise<Image> {
    const newImage = await this.upload(file);
    await this.deleteImage(oldImageId);
    return newImage;
  }

  async deleteImage(imageId?: string) {
    if (!imageId) {
      this.logger.log(`🗑️ deleteImage skipped because no image id was provided`);
      return;
    }

    this.logger.log(`🗑️ deleteImage call`);
    const image = await this.imageRepository.findOne({ where: { id: imageId } });
    if (!image) {
      this.logger.warn(`Image ${imageId} already gone, skipping disk cleanup.`);
      return;
    }

    const uploadDir = './upload';
 
    // 1. Define paths for both files
    const originalPath = join(uploadDir, image.originalUrl);
    const thumbnailPath = join(uploadDir, image.thumbnailUrl);

    // 2. Delete files from disk (using try-catch in case they were already moved/deleted)
    await fs.unlink(originalPath);
    await fs.unlink(thumbnailPath);
    this.logger.log(`🗑️ Remove the images from the database`);

    // 3. Remove the record from the database
    await this.imageRepository.remove(image);
  }
}
