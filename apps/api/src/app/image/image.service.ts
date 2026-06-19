import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Image } from './entities/image.entity';
import sharp from 'sharp';
import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * Service responsible for image persistence, thumbnail generation, and cleanup.
 */
@Injectable()
export class ImageService {
  
  private logger = new Logger('🖼️ ImageService 🖼️')

  constructor(@InjectRepository(Image) private readonly imageRepository: Repository<Image>) {}

  /**
   * Upload a new image, generate a thumbnail, and save metadata to the database.
   */
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

  /**
   * Upload multiple images, generate thumbnails, and save metadata to the database.
  */
  async uploadMultiple(files: Express.Multer.File[]): Promise<Image[]> {
    this.logger.log(`📤 upload multiple files call - Count: ${files?.length || 0}`);
    
    if (!files || files.length === 0) {
      return [];
    }

    const uploadDir = './upload';
    const savedImages: Image[] = [];

    for (const file of files) {
      const thumbnailFilename = `thumb_${file.filename}`;
      
      // Create the low-res version automatically
      await sharp(file.path)
        .resize(300) 
        .toFile(join(uploadDir, thumbnailFilename));

      const newImage = this.imageRepository.create({
        originalName: `Large_${file.originalname}`,
        originalUrl: file.filename,
        thumbnailName: `Thumb_${file.originalname}`,
        thumbnailUrl: thumbnailFilename,
        mimeType: file.mimetype,
      });

      const saved = await this.imageRepository.save(newImage);
      savedImages.push(saved);
    }

    this.logger.log(`✅ Uploaded ${savedImages.length} images successfully.`);
    return savedImages;
  }

  /**
   * Upload an image and replace an existing image if one exists.
   */
  async uploadAndReplace(oldImageId: string | undefined, file: Express.Multer.File): Promise<Image> {
    const newImage = await this.upload(file);
    await this.deleteImage(oldImageId);
    return newImage;
  }

  /**
   * Delete the image files from disk and remove the database record.
   */
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

  async deleteMultiple(images: Image[]): Promise<void> {
    this.logger.log(`🗑️ ImageService: deleteMultiple called for ${images?.length || 0} images`);
    
    if (!images || images.length === 0) return;

    const uploadDir = './upload';

    for (const image of images) {
      try {
        // 1. Delete original high-res asset from filesystem
        if (image.originalUrl) {
          await fs.unlink(join(uploadDir, image.originalUrl));
        }
        
        // 2. Delete thumbnail asset from filesystem
        if (image.thumbnailUrl) {
          await fs.unlink(join(uploadDir, image.thumbnailUrl));
        }
        
        this.logger.log(`💾 Deleted physical files for image ID: ${image.id}`);
      } catch (err) {
        // Log warning if file wasn't found on disk, but proceed to clear DB row anyway
        this.logger.warn(`⚠️ Physical file deletion skipped/failed for image ID ${image.id}: ${err}`);
      }
    }

    // 3. Clear all tracking records from your database table pool in one query
    const idsToDelete = images.map(img => img.id);
    await this.imageRepository.delete(idsToDelete);
    this.logger.log(`✅ Successfully cleared ${idsToDelete.length} image rows from Database.`);
  }
}
