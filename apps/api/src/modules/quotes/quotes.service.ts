import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { QuotesRepository, Quote, QuoteItem } from './quotes.repository';
import { CreateQuoteDto, UpdateQuoteDto, ConvertToSaleDto } from './dto';
import { DatabaseService } from '../../database/database.service';
import { SalesRepository } from '../sales/sales.repository';
import { validateSortColumn } from '../../common/utils/validate-sort';

const ALLOWED_SORT_COLUMNS = ['quote_date', 'valid_until', 'grand_total', 'quote_number', 'status', 'created_at'];

@Injectable()
export class QuotesService {
  constructor(
    private readonly repository: QuotesRepository,
    private readonly salesRepository: SalesRepository,
    private readonly db: DatabaseService,
  ) {}

  async findAll(params: {
    page?: number;
    limit?: number;
    search?: string;
    customerId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    return this.repository.findAll({
      page: params.page || 1,
      limit: params.limit || 20,
      search: params.search,
      customerId: params.customerId,
      status: params.status,
      startDate: params.startDate,
      endDate: params.endDate,
      sortBy: validateSortColumn(params.sortBy || 'created_at', ALLOWED_SORT_COLUMNS, 'created_at'),
      sortOrder: params.sortOrder || 'desc',
    });
  }

  async findById(id: string) {
    const quote = await this.repository.findQuoteById(id);
    if (!quote) {
      throw new NotFoundException('Teklif bulunamadi');
    }

    const items = await this.repository.findItemsByQuoteId(id);
    return { ...quote, items };
  }

  async create(dto: CreateQuoteDto, userId?: string): Promise<Quote> {
    const quoteNumber = await this.repository.generateQuoteNumber();

    // Calculate totals
    let subtotal = 0;
    let vatTotal = 0;
    const itemsData: Partial<QuoteItem>[] = [];

    for (const item of dto.items) {
      const discountedPrice = item.unit_price * (1 - (item.discount_rate || 0) / 100);
      const lineSubtotal = discountedPrice * item.quantity;
      const vatAmount = lineSubtotal * ((item.vat_rate || 0) / 100);
      const lineTotal = dto.include_vat ? lineSubtotal + vatAmount : lineSubtotal;

      subtotal += lineSubtotal;
      vatTotal += vatAmount;

      itemsData.push({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_rate: item.discount_rate || 0,
        vat_rate: item.vat_rate || 0,
        vat_amount: vatAmount,
        line_total: lineTotal,
      });
    }

    // Apply order-level discount
    const orderDiscount = dto.discount_amount || (subtotal * (dto.discount_rate || 0) / 100);
    const grandTotal = dto.include_vat ? subtotal - orderDiscount + vatTotal : subtotal - orderDiscount;

    return this.repository.createQuote({
      quote_number: quoteNumber,
      customer_id: dto.customer_id || null,
      quote_date: new Date(),
      valid_until: new Date(dto.valid_until),
      subtotal,
      discount_amount: dto.discount_amount || 0,
      discount_rate: dto.discount_rate || 0,
      vat_total: vatTotal,
      grand_total: grandTotal,
      include_vat: dto.include_vat ?? true,
      status: 'draft',
      notes: dto.notes,
      created_by: userId || null,
    }, itemsData);
  }

  async update(id: string, dto: UpdateQuoteDto): Promise<Quote> {
    const quote = await this.repository.findById(id);
    if (!quote) {
      throw new NotFoundException('Teklif bulunamadi');
    }

    if (!['draft', 'sent'].includes(quote.status)) {
      throw new BadRequestException('Sadece taslak veya gonderilmis teklifler duzenlenebilir');
    }

    return this.db.transaction(async (trx) => {
      let updateData: Partial<Quote> = {
        customer_id: dto.customer_id ?? quote.customer_id,
        valid_until: dto.valid_until ? new Date(dto.valid_until) : quote.valid_until,
        include_vat: dto.include_vat ?? quote.include_vat,
        notes: dto.notes ?? quote.notes,
      };

      // If items are provided, recalculate totals
      if (dto.items && dto.items.length > 0) {
        let subtotal = 0;
        let vatTotal = 0;
        const itemsData: Partial<QuoteItem>[] = [];
        const includeVat = dto.include_vat ?? quote.include_vat;

        for (const item of dto.items) {
          const discountedPrice = item.unit_price * (1 - (item.discount_rate || 0) / 100);
          const lineSubtotal = discountedPrice * item.quantity;
          const vatAmount = lineSubtotal * ((item.vat_rate || 0) / 100);
          const lineTotal = includeVat ? lineSubtotal + vatAmount : lineSubtotal;

          subtotal += lineSubtotal;
          vatTotal += vatAmount;

          itemsData.push({
            quote_id: id,
            product_id: item.product_id,
            product_name: item.product_name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            discount_rate: item.discount_rate || 0,
            vat_rate: item.vat_rate || 0,
            vat_amount: vatAmount,
            line_total: lineTotal,
          });
        }

        const discountAmount = dto.discount_amount ?? quote.discount_amount;
        const discountRate = dto.discount_rate ?? quote.discount_rate;
        const orderDiscount = discountAmount || (subtotal * discountRate / 100);
        const grandTotal = includeVat ? subtotal - orderDiscount + vatTotal : subtotal - orderDiscount;

        updateData = {
          ...updateData,
          subtotal,
          discount_amount: discountAmount,
          discount_rate: discountRate,
          vat_total: vatTotal,
          grand_total: grandTotal,
        };

        // Replace items
        await this.repository.deleteItems(id, trx);
        await this.repository.insertItems(itemsData, trx);
      }

      return this.repository.updateQuote(id, updateData, trx);
    });
  }

  async send(id: string): Promise<Quote> {
    const quote = await this.repository.findById(id);
    if (!quote) {
      throw new NotFoundException('Teklif bulunamadi');
    }

    if (quote.status !== 'draft') {
      throw new BadRequestException('Sadece taslak teklifler gonderilebilir');
    }

    await this.repository.updateStatus(id, 'sent');
    return { ...quote, status: 'sent' };
  }

  async accept(id: string): Promise<Quote> {
    const quote = await this.repository.findById(id);
    if (!quote) {
      throw new NotFoundException('Teklif bulunamadi');
    }

    if (!['draft', 'sent'].includes(quote.status)) {
      throw new BadRequestException('Teklif kabul edilemez');
    }

    await this.repository.updateStatus(id, 'accepted');
    return { ...quote, status: 'accepted' };
  }

  async reject(id: string): Promise<Quote> {
    const quote = await this.repository.findById(id);
    if (!quote) {
      throw new NotFoundException('Teklif bulunamadi');
    }

    if (!['draft', 'sent'].includes(quote.status)) {
      throw new BadRequestException('Teklif reddedilemez');
    }

    await this.repository.updateStatus(id, 'rejected');
    return { ...quote, status: 'rejected' };
  }

  async convertToSale(id: string, dto: ConvertToSaleDto) {
    const quote = await this.repository.findById(id);
    if (!quote) {
      throw new NotFoundException('Teklif bulunamadi');
    }

    if (!['draft', 'sent', 'accepted'].includes(quote.status)) {
      throw new BadRequestException('Bu teklif satisa donusturulemez');
    }

    const items = await this.repository.findItemsByQuoteId(id);

    return this.db.transaction(async (trx) => {
      const invoiceNumber = await this.salesRepository.generateInvoiceNumber();

      // Create sale
      const sale = await this.salesRepository.createSale({
        invoice_number: invoiceNumber,
        customer_id: quote.customer_id,
        sale_date: new Date(),
        subtotal: quote.subtotal,
        discount_amount: quote.discount_amount,
        discount_rate: quote.discount_rate,
        vat_total: quote.vat_total,
        grand_total: quote.grand_total,
        include_vat: quote.include_vat,
        payment_method: dto.payment_method,
        due_date: dto.due_date ? new Date(dto.due_date) : null,
        status: 'completed',
        notes: dto.notes || quote.notes,
        warehouse_id: dto.warehouse_id,
      }, items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_rate: item.discount_rate,
        vat_rate: item.vat_rate,
        vat_amount: item.vat_amount,
        line_total: item.line_total,
      })), trx);

      // Update quote status
      await this.repository.updateStatus(id, 'converted', sale.id);

      return sale;
    });
  }

  async delete(id: string): Promise<void> {
    const quote = await this.repository.findById(id);
    if (!quote) {
      throw new NotFoundException('Teklif bulunamadi');
    }

    if (quote.status === 'converted') {
      throw new BadRequestException('Satisa donusturulmus teklif silinemez');
    }

    await this.repository.deleteQuote(id);
  }

  async markExpiredQuotes(): Promise<number> {
    const expiredQuotes = await this.repository.getExpiredQuotes();

    for (const quote of expiredQuotes) {
      await this.repository.updateStatus(quote.id, 'expired');
    }

    return expiredQuotes.length;
  }
}
