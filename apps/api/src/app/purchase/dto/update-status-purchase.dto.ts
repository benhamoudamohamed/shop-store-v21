import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PurchaseStatus } from '@youssef-brand/shared/shared-enums';

export const UpdateStatusSchema = z.object({
  status: PurchaseStatus
}).required();

export class UpdateStatusDto extends createZodDto(UpdateStatusSchema) {}