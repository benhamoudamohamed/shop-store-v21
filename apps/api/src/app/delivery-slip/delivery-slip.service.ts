import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { DataSource } from 'typeorm';
import PDFDocument from 'pdfkit';
import { DeliverySlip } from './entities/delivery-slip.entity';
import { Response } from 'express';

@Injectable()
export class DeliverySlipService {
  constructor(private dataSource: DataSource) {}

  async generateDeliverySlipPdf(slipId: string, responseStream: Response): Promise<void> {
    const slip = await this.dataSource.manager.findOne(DeliverySlip, {
      where: { id: slipId },
      relations: ['purchase', 'purchase.orderItems', 'purchase.orderItems.product'],
    });

    if (!slip) {
      throw new HttpException('Delivery slip not found', HttpStatus.NOT_FOUND);
    }

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(responseStream);

    // Header specific to Delivery Slip
    doc.fontSize(20).text('DELIVERY SLIP', { align: 'right' });
    doc.fontSize(10).text(`Slip Number: ${slip.slipNumber}`, { align: 'right' });
    doc.text(`Date: ${slip.createdAt.toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();

    doc.fontSize(12).text('Recipient:', { underline: true });
    doc.fontSize(10).text(`Customer Name: ${slip.purchase.clientName}`);
    doc.text(`Phone: ${slip.purchase.phone}`);
    doc.text(`Delivery Address: ${slip.purchase.address}`);
    doc.moveDown(2);

    doc.font('Helvetica-Bold').fontSize(12).text('Items To Deliver');
    doc.font('Helvetica').fontSize(10).text('---------------------------------------------------------------------------------');

    slip.purchase.orderItems.forEach((item) => {
      doc.fontSize(10).text(
        `${item.product.name} x${item.quantity}  |  Price: ${item.unitpriceAtPurchase} TND  |  TVA: ${item.tvaRate}%  |  Total: ${item.totalTTC} TND`
      );
    });

    doc.text('---------------------------------------------------------------------------------');
    doc.moveDown();

    doc.fontSize(11);
    doc.text(`Subtotal (HT): ${slip.subtotalHT} TND`, { align: 'right' });
    doc.text(`Total Tax (TVA): ${slip.totalTax} TND`, { align: 'right' });
    doc.text(`Discount Applied: -${slip.discount} TND`, { align: 'right' });
    doc.font('Helvetica-Bold').fontSize(14).text(`Grand Total (TTC): ${slip.grandTotal} TND`, { align: 'right' });

    doc.end();
  }
}
