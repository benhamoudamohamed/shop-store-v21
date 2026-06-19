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
  const allowedOrigins = [
    'http://localhost:4200', // Client Dashboard App
    'http://localhost:4300'  // Admin Store App
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Blocked by CORS policy: Origin not allowed.'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const mode = process.env.NODE_ENV;
  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`🚀 Application is running '${mode}' Mode on: http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
