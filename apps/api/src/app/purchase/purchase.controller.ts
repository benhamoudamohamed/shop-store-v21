import { Controller, Get, Post, Put, Delete, Body, Param, Res, Query, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { Purchase } from './entities/purchase.entity';
import { PurchaseService } from './purchase.service';
import { InvoiceService } from '../invoice/invoice.service';
import { DeliverySlipService } from '../delivery-slip/delivery-slip.service';
import { AuthenticationGuard } from '../shared/auth/auth.guard';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdateStatusDto } from './dto/update-status-purchase.dto';

@Controller('purchase')
export class PurchaseController {
  
  constructor(private readonly purchaseService: PurchaseService, 
    private readonly deliverySlipService: DeliverySlipService,
    private readonly invoiceService: InvoiceService) {}

  @UseGuards(AuthenticationGuard)
  @Get('/all')
  @HttpCode(HttpStatus.OK)
  findAll(@Query('status') status?: string ): Promise<{ data: Purchase[]; count: number; breakdown: Record<string, number> }> {  
    return this.purchaseService.findAll(status);
  }

  @UseGuards(AuthenticationGuard)
  @Get('/:id')
  @HttpCode(HttpStatus.OK)
  findbyId(@Param('id') id: string): Promise<Purchase> {
    return this.purchaseService.findbyId(id);
  }

  @Get(':id/invoice/pdf')
  @HttpCode(HttpStatus.OK)
  async generateInvoicePdf(@Param('id') id: string, @Res() res: Response) {
    const invoiceId = await this.purchaseService.getInvoiceIdByPurchaseId(id);
    // Set headers for PDF
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="invoice-${id}.pdf"`,
    });

    await this.invoiceService.generateInvoicePdf(invoiceId, res);
    return res;
  }

  @Get(':id/delivery-slip/pdf')
  @HttpCode(HttpStatus.OK)
  async generateDeliverySlipPdf(@Param('id') id: string, @Res() res: Response) {
    const invoiceId = await this.purchaseService.getInvoiceIdByPurchaseId(id); 
    // Set headers for PDF
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="delivery-slip-${id}.pdf"`,
    });

    await this.deliverySlipService.generateDeliverySlipPdf(invoiceId, res);
    return res;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createPurchaseDto: CreatePurchaseDto) {
    return this.purchaseService.create(createPurchaseDto);
  }

  @UseGuards(AuthenticationGuard)
  @Put('/:id/status')
  @HttpCode(HttpStatus.OK)
  updateStatus(@Param('id') id: string, @Body() status: UpdateStatusDto) {
    return this.purchaseService.updateStatus(id, status);
  }

  @UseGuards(AuthenticationGuard)
  @Delete('/:id')
  @HttpCode(HttpStatus.OK)
  delete(@Param('id') id: string): Promise<{ message: string }> {
    return this.purchaseService.delete(id);
  }  
 
}
