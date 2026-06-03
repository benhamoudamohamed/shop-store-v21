import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { CreatePurchaseDto, CreatePurchaseSchema } from './dto/create-purchase.dto';

@Injectable()
export class PurchaseValidationService {
  validatePurchasePayload(dto: CreatePurchaseDto): void {
    const validation = CreatePurchaseSchema.safeParse(dto);
    if (!validation.success) {
      const formattedErrors = validation.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      throw new BadRequestException({
        status: HttpStatus.BAD_REQUEST,
        error: 'Validation Failed',
        details: formattedErrors,
      });
    }
  }
}
