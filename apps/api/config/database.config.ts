import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { join } from 'path';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions() {
    const config = this.configService.get('database');
    return {
      ...config,
      migrations: [join(__dirname, '..', 'src', 'migrations', '*.ts')],
    };
  }
}
