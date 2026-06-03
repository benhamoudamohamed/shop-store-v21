import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { Token } from './entities/token.entity';
import { TokenType } from '@youssef-brand/shared/shared-types';
import { HelperService } from '../shared/helpers/helper.service';

@Injectable()
export class TokenHashService {
  private logger = new Logger('🔐 TokenHashService 🔐');

  constructor(private helperService: HelperService) {}

  private getRepository(repository: Repository<Token>, manager?: EntityManager): Repository<Token> {
    return manager ? manager.getRepository(Token) : repository;
  }

  async updateHashes(
    tokenId: string,
    data: TokenType,
    repository: Repository<Token>,
    manager?: EntityManager,
  ): Promise<Token> {
    const { key, value } = data;

    const hashedKey = await this.helperService.hashData(key);
    const hashedToken = await this.helperService.hashData(value);

    const repo = this.getRepository(repository, manager);
    const token = await repo.findOne({ where: { id: tokenId } });

    if (!token) {
      this.logger.error(`🟥🚨 Token not found before update: ${tokenId}`);
      throw new HttpException({ status: HttpStatus.NOT_FOUND, error: 'Token Not Found' }, HttpStatus.NOT_FOUND);
    }

    token.accessToken = hashedToken;
    token.accessKey = hashedKey;
    await repo.save(token);

    const updatedToken = await repo.findOne({ where: { id: tokenId }, relations: ['owner', 'admin', 'moderator'] });
    if (!updatedToken) {
      this.logger.error(`🟥🚨 Token not found after update: ${tokenId}`);
      throw new HttpException({ status: HttpStatus.NOT_FOUND, error: 'Token Not Found' }, HttpStatus.NOT_FOUND);
    }

    this.logger.log(`🔄 Update hashed token successfully`);
    return updatedToken;
  }
}
