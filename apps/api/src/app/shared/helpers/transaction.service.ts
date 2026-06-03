import { Injectable, Logger } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

/**
 * Transaction helper to execute work inside a TypeORM query runner transaction.
 */
@Injectable()
export class TransactionService {
  private readonly logger = new Logger('⚙️ TransactionService ⚙️');

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Run a callback function inside a database transaction.
   */
  async run<T>(work: (manager: EntityManager) => Promise<T>): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await work(queryRunner.manager);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      this.logger.error(`Transaction failed and will rollback: ${error}`);
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
