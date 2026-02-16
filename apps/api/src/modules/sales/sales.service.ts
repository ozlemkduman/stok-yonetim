import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SalesRepository, Sale, SaleItem } from './sales.repository';
import { ProductsRepository } from '../products/products.repository';
import { CustomersRepository } from '../customers/customers.repository';
import { CreateSaleDto } from './dto';
import { DatabaseService } from '../../database/database.service';
import { createPaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class SalesService {
  constructor(
    private readonly salesRepository: SalesRepository,
    private readonly productsRepository: ProductsRepository,
    private readonly customersRepository: CustomersRepository,
    private readonly db: DatabaseService,
  ) {}

  async findAll(params: any) {
    const { items, total } = await this.salesRepository.findAll(params);
    return createPaginatedResult(items, total, params.page, params.limit);
  }

  async findById(id: string): Promise<Sale & { items: SaleItem[] }> {
    const sale = await this.salesRepository.findById(id);
    if (!sale) throw new NotFoundException(`Satis bulunamadi: ${id}`);
    const items = await this.salesRepository.findItemsBySaleId(id);
    return { ...sale, items };
  }

  async findDetail(id: string): Promise<Sale & { items: SaleItem[]; payments: { id: string; payment_date: Date; amount: number; method: string; notes: string | null }[] }> {
    const sale = await this.salesRepository.findById(id);
    if (!sale) throw new NotFoundException(`Satis bulunamadi: ${id}`);
    const [items, payments] = await Promise.all([
      this.salesRepository.findItemsBySaleId(id),
      this.salesRepository.findPaymentsBySaleId(id),
    ]);
    return { ...sale, items, payments };
  }

  async create(dto: CreateSaleDto): Promise<Sale> {
    if (dto.customer_id) {
      const customer = await this.customersRepository.findById(dto.customer_id);
      if (!customer) throw new BadRequestException('Musteri bulunamadi');
    }

    if (dto.payment_method === 'veresiye' && !dto.customer_id) {
      throw new BadRequestException('Veresiye satis icin musteri secilmelidir');
    }

    return this.db.transaction(async (trx) => {
      const invoiceNumber = await this.salesRepository.generateInvoiceNumber();
      let subtotal = 0;
      let vatTotal = 0;
      const saleItems: Partial<SaleItem>[] = [];

      for (const item of dto.items) {
        // Lock product row and check stock inside transaction
        const product = await trx('products')
          .where('id', item.product_id)
          .forUpdate()
          .first();
        if (!product) throw new BadRequestException(`Urun bulunamadi: ${item.product_id}`);
        if (product.stock_quantity < item.quantity) {
          throw new BadRequestException(`Yetersiz stok: ${product.name}`);
        }

        const lineSubtotal = item.unit_price * item.quantity;
        const lineDiscount = lineSubtotal * (item.discount_rate || 0) / 100;
        const lineAfterDiscount = lineSubtotal - lineDiscount;
        const vatAmount = dto.include_vat ? lineAfterDiscount * product.vat_rate / 100 : 0;
        const lineTotal = lineAfterDiscount + vatAmount;

        subtotal += lineAfterDiscount;
        vatTotal += vatAmount;

        saleItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_rate: item.discount_rate || 0,
          vat_rate: product.vat_rate,
          vat_amount: vatAmount,
          line_total: lineTotal,
        });

        await this.productsRepository.updateStock(item.product_id, -item.quantity, trx);
      }

      const discountAmount = dto.discount_amount || (subtotal * (dto.discount_rate || 0) / 100);
      const grandTotal = subtotal - discountAmount + vatTotal;

      const sale = await this.salesRepository.createSale({
        invoice_number: invoiceNumber,
        customer_id: dto.customer_id || null,
        sale_date: dto.sale_date ? new Date(dto.sale_date) : new Date(),
        subtotal,
        discount_amount: discountAmount,
        discount_rate: dto.discount_rate || 0,
        vat_total: vatTotal,
        grand_total: grandTotal,
        include_vat: dto.include_vat !== false,
        payment_method: dto.payment_method,
        due_date: dto.due_date ? new Date(dto.due_date) : null,
        status: 'completed',
        notes: dto.notes || null,
      }, saleItems, trx);

      if (dto.customer_id && dto.payment_method === 'veresiye') {
        await trx('customers').where('id', dto.customer_id).update({
          balance: trx.raw('balance - ?', [grandTotal]),
          updated_at: trx.fn.now(),
        });
        await trx('account_transactions').insert({
          customer_id: dto.customer_id,
          type: 'borc',
          amount: grandTotal,
          description: `Satis: ${invoiceNumber}`,
          reference_type: 'sale',
          reference_id: sale.id,
          transaction_date: new Date(),
        });
      }

      return sale;
    });
  }

  async cancel(id: string): Promise<void> {
    const sale = await this.findById(id);
    if (sale.status === 'cancelled') throw new BadRequestException('Satis zaten iptal edilmis');

    await this.db.transaction(async (trx) => {
      for (const item of sale.items) {
        await trx('products').where('id', item.product_id).update({
          stock_quantity: trx.raw('stock_quantity + ?', [item.quantity]),
          updated_at: trx.fn.now(),
        });
      }

      if (sale.customer_id && sale.payment_method === 'veresiye') {
        await trx('customers').where('id', sale.customer_id).update({
          balance: trx.raw('balance + ?', [sale.grand_total]),
          updated_at: trx.fn.now(),
        });
        await trx('account_transactions').insert({
          customer_id: sale.customer_id,
          type: 'alacak',
          amount: sale.grand_total,
          description: `Satis iptali: ${sale.invoice_number}`,
          reference_type: 'sale',
          reference_id: sale.id,
          transaction_date: new Date(),
        });
      }

      await trx('sales').where('id', id).update({ status: 'cancelled', updated_at: trx.fn.now() });
    });
  }
}
