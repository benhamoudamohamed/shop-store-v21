import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HelperService } from './helpers/helper.service';
import { TransactionService } from './helpers/transaction.service';
import { AuthHelperService } from './helpers/auth-helper.service';
import { ExceptionHelperService } from './helpers/exception-helper.service';
import { DocumentNumberService } from './helpers/document-number.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [HelperService, TransactionService, AuthHelperService, ExceptionHelperService, DocumentNumberService],
  exports: [HelperService, TransactionService, AuthHelperService, ExceptionHelperService, DocumentNumberService],
})
export class SharedModule {}
