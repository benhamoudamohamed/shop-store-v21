import { Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntitySubscriberInterface, EventSubscriber, RemoveEvent } from 'typeorm';
import { Product } from './entities/product.entity';
import { ImageService } from '../image/image.service';

@EventSubscriber()
export class ProductSubscriber implements EntitySubscriberInterface<Product> {
    private logger = new Logger('ProductSubscriber')

    constructor(private readonly imageService: ImageService,
    @InjectDataSource() readonly dataSource: DataSource) {
    // This line manually registers the subscriber with TypeORM
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Product;
  }

  async beforeRemove(event: RemoveEvent<Product>) {
    // 🚨 The 'entity' in a cascade might be partial. 
    // If image ID is missing, we check the database one last time.
    let imageId = event.entity?.image?.id;

    if (!imageId && event.entityId) {
        const product = await event.manager.findOne(Product, {
            where: { id: event.entityId },
            relations: ['image']
        });
        imageId = product?.image?.id;
    }

    if (imageId) {
      this.logger.log(`🗑️ Subscriber: Cleaning up image ${imageId}`);
      await this.imageService.deleteImage(imageId);
    }
  }
}