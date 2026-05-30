import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { PaginateConfig } from 'nestjs-paginate';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const GLOBAL_PAGINATION_CONFIG: PaginateConfig<any> = {
  sortableColumns: ['id', 'createdAt'],
  defaultSortBy: [['id', 'DESC']],
  maxLimit: 20,
  defaultLimit: 20,
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const mode = process.env.NODE_ENV;
  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`🚀 Application is running '${mode}' Mode on: http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
