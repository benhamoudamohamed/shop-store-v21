import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';

/**
 * Service responsible for generating sequential document numbers
 * for invoices and delivery slips using database sequences.
 */
@Injectable()
export class DocumentNumberService {
  private readonly INVOICE_SEQUENCE_NAME = 'invoice_number_seq';
  private readonly DELIVERY_SLIP_SEQUENCE_NAME = 'delivery_slip_number_seq';

  /**
   * Generate a formatted invoice identifier from the next sequence value.
   */
  async generateInvoiceNumber(manager: EntityManager): Promise<string> {
    const sequenceValue = await this.nextSequenceValue(manager, this.INVOICE_SEQUENCE_NAME);
    const currentYear = new Date().getFullYear();
    return `INV-${currentYear}-${String(sequenceValue).padStart(5, '0')}`;
  }

  /**
   * Generate a formatted delivery slip identifier from the next sequence value.
   */
  async generateDeliverySlipNumber(manager: EntityManager): Promise<string> {
    const sequenceValue = await this.nextSequenceValue(manager, this.DELIVERY_SLIP_SEQUENCE_NAME);
    const currentYear = new Date().getFullYear();
    return `DS-${currentYear}-${String(sequenceValue).padStart(5, '0')}`;
  }

  private async nextSequenceValue(manager: EntityManager, sequenceName: string): Promise<number> {
    const result = await manager.query(`SELECT nextval($1) AS value`, [sequenceName]);
    const value = result?.[0]?.value ?? result?.[0]?.nextval;
    return Number(value);
  }
}
