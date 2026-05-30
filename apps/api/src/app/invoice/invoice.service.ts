import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { DataSource } from 'typeorm';
import PDFDocument from 'pdfkit';
import { Invoice } from './entities/invoice.entity';
import { Response } from 'express';

@Injectable()
export class InvoiceService {

  constructor(private dataSource: DataSource) {}

  async generateInvoicePdf(invoiceId: string, responseStream: Response): Promise<void> {
    // Fetch invoice along with purchase and nested order items
    const invoice = await this.dataSource.manager.findOne(Invoice, {
      where: { id: invoiceId },
      relations: ['purchase', 'purchase.orderItems', 'purchase.orderItems.product'],
    });

    if (!invoice) {
      throw new HttpException('Invoice record not found', HttpStatus.NOT_FOUND);
    }

    // Initialize a PDF Document in memory
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // 🔗 Pipe directly to the response socket BEFORE adding content
    doc.pipe(responseStream);

    // --- PDF Layout & Styling ---
    // Header
    doc.fontSize(20).text('COMMERCIAL INVOICE', { align: 'right' });
    doc.fontSize(10).text(`Invoice Number: ${invoice.invoiceNumber}`, { align: 'right' });
    doc.text(`Date of Issue: ${invoice.createdAt.toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();

    // Company & Client Details
    doc.fontSize(12).text('Seller:', { underline: true });
    doc.fontSize(10).text('Your Store Name Inc.');
    doc.text('Tunis, Tunisia\n\n');

    doc.fontSize(12).text('Billed To:', { underline: true });
    doc.fontSize(10).text(`Customer Name: ${invoice.purchase.clientName}`);
    doc.text(`Phone: ${invoice.purchase.phone}`);
    doc.text(`Delivery Address: ${invoice.purchase.address}`);
    doc.moveDown(2);

    // Items Table Header
    doc.font('Helvetica-Bold').fontSize(12).text('Items Summary');

    // Switch back to regular font for the border line and loop content
    doc.font('Helvetica').fontSize(10).text('---------------------------------------------------------------------------------');
        
    // Items Rows
    invoice.purchase.orderItems.forEach((item) => {
      doc.fontSize(10).text(
        `${item.product.name} x${item.quantity}  |  Price: ${item.unitpriceAtPurchase} TND  |  TVA: ${item.tvaRate}%  |  Total: ${item.totalTTC} TND`
      );
    });
    
    doc.text('---------------------------------------------------------------------------------');
    doc.moveDown();

    // Financial Summaries
    doc.fontSize(11);
    doc.text(`Subtotal (HT): ${invoice.subtotalHT} TND`, { align: 'right' });
    doc.text(`Total Tax (TVA): ${invoice.totalTax} TND`, { align: 'right' });
    doc.text(`Discount Applied: -${invoice.discount} TND`, { align: 'right' });
    doc.font('Helvetica-Bold').fontSize(14).text(`Grand Total (TTC): ${invoice.grandTotal} TND`, { align: 'right' });

    // Finalize writing stream
    doc.end();
  }

}
