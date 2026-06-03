import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource, LessThan } from 'typeorm';
import { Purchase } from './entities/purchase.entity';
import { PurchaseService } from './purchase.service';
import { PurchaseStatus } from '@youssef-brand/shared/shared-enums';

@Injectable()
export class PurchaseCleanupService {
  protected logger = new Logger('⏰ PurchaseCleanupService ⏰');

  constructor(
    private readonly dataSource: DataSource,
    private readonly purchaseService: PurchaseService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleAbandonedCODOrders(): Promise<void> {
    this.logger.log('⏰ Running midnight cleanup for stale COD orders...');

    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const stalePurchases = await this.dataSource.manager.find(Purchase, {
      where: {
        status: PurchaseStatus.enum.PENDING,
        createdAt: LessThan(fiveDaysAgo),
      },
    });

    for (const purchase of stalePurchases) {
      await this.purchaseService.updateStatus(purchase.id, { status: PurchaseStatus.enum.CANCELLED });
      this.logger.log(`🗑️ Automatically cancelled stagnant order ${purchase.id} due to inactivity.`);
    }
  }
}
