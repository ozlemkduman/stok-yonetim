import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CustomersRepository } from '../customers/customers.repository';
import { ProductsRepository } from '../products/products.repository';
import { SalesRepository } from '../sales/sales.repository';
import { parseUblXml, ParsedUblInvoice } from './ubl-parser';
import { getCurrentTenantId } from '../../common/context/tenant.context';

export interface PreviewMatch<T> {
  parsed: T;
  isNew: boolean;
  matchedId: string | null;
  matchedName: string | null;
}

export interface ParsePreviewResponse {
  invoice: ParsedUblInvoice['invoice'];
  customer: PreviewMatch<ParsedUblInvoice['customer']>;
  items: (PreviewMatch<ParsedUblInvoice['items'][number]> & { index: number })[];
  totals: ParsedUblInvoice['totals'];
}

export interface ConfirmImportData {
  invoice: ParsedUblInvoice['invoice'];
  customer: PreviewMatch<ParsedUblInvoice['customer']>;
  items: {
    parsed: ParsedUblInvoice['items'][number];
    isNew: boolean;
    matchedId: string | null;
    purchasePrice?: number;
  }[];
  totals: ParsedUblInvoice['totals'];
  warehouseId?: string;
  paymentMethod?: string;
  saleType?: string;
  dueDate?: string;
  notes?: string;
}

@Injectable()
export class InvoiceImportService {
  constructor(
    private readonly db: DatabaseService,
    private readonly customersRepository: CustomersRepository,
    private readonly productsRepository: ProductsRepository,
    private readonly salesRepository: SalesRepository,
  ) {}

  async parseAndPreview(fileBuffer: Buffer): Promise<ParsePreviewResponse> {
    let parsed: ParsedUblInvoice;
    try {
      parsed = await parseUblXml(fileBuffer);
    } catch (err) {
      throw new BadRequestException('XML dosyası parse edilemedi: ' + (err instanceof Error ? err.message : 'Bilinmeyen hata'));
    }

    if (!parsed.customer.name && !parsed.customer.taxNumber) {
      throw new BadRequestException('Faturada müşteri bilgisi bulunamadı');
    }
    if (parsed.items.length === 0) {
      throw new BadRequestException('Faturada ürün satırı bulunamadı');
    }

    // Match customer by tax_number
    let customerMatch: PreviewMatch<ParsedUblInvoice['customer']> = {
      parsed: parsed.customer,
      isNew: true,
      matchedId: null,
      matchedName: null,
    };

    if (parsed.customer.taxNumber) {
      const tenantId = getCurrentTenantId();
      const existing = await this.db.knex('customers')
        .where('tax_number', parsed.customer.taxNumber)
        .modify((qb) => {
          if (tenantId) qb.where('tenant_id', tenantId);
        })
        .first();

      if (existing) {
        customerMatch = {
          parsed: parsed.customer,
          isNew: false,
          matchedId: existing.id,
          matchedName: existing.name,
        };
      }
    }

    // Match products by name (case-insensitive)
    const tenantId = getCurrentTenantId();
    const itemMatches = await Promise.all(
      parsed.items.map(async (item, index) => {
        const existing = await this.db.knex('products')
          .whereRaw('LOWER(name) = LOWER(?)', [item.name.trim()])
          .modify((qb) => {
            if (tenantId) qb.where('tenant_id', tenantId);
          })
          .first();

        return {
          parsed: item,
          isNew: !existing,
          matchedId: existing?.id || null,
          matchedName: existing?.name || null,
          stockQuantity: existing?.stock_quantity ?? null,
          index,
        };
      }),
    );

    return {
      invoice: parsed.invoice,
      customer: customerMatch,
      items: itemMatches,
      totals: parsed.totals,
    };
  }

  async confirmImport(data: ConfirmImportData, userId?: string): Promise<{ saleId: string }> {
    try {
    return this.db.transaction(async (trx) => {
      const tenantId = getCurrentTenantId();

      // Duplicate invoice check
      if (data.invoice.id) {
        const existingSale = await trx('sales')
          .where('notes', 'like', `%E-Fatura import: ${data.invoice.id}%`)
          .modify((qb) => {
            if (tenantId) qb.where('tenant_id', tenantId);
          })
          .first();

        if (existingSale) {
          throw new BadRequestException(
            `Bu fatura daha önce içe aktarılmış (Fatura No: ${data.invoice.id}). Mevcut satış: ${existingSale.invoice_number}`,
          );
        }
      }

      // 1. Customer: create if new, or use matched
      let customerId: string;
      if (data.customer.isNew) {
        const insertData: any = {
          name: data.customer.parsed.name,
          tax_number: data.customer.parsed.taxNumber,
          tax_office: data.customer.parsed.taxOffice,
          address: data.customer.parsed.address,
          phone: data.customer.parsed.phone,
          email: data.customer.parsed.email,
        };
        if (tenantId) insertData.tenant_id = tenantId;

        const [customer] = await trx('customers').insert(insertData).returning('*');
        customerId = customer.id;
      } else {
        customerId = data.customer.matchedId!;
      }

      // 2. Products: create new ones, collect IDs
      const saleItems: any[] = [];
      for (const item of data.items) {
        let productId: string;

        if (item.isNew) {
          const productData: any = {
            name: item.parsed.name,
            unit: item.parsed.unit || 'adet',
            purchase_price: item.purchasePrice ?? 0,
            sale_price: item.parsed.unitPrice,
            wholesale_price: item.parsed.unitPrice,
            vat_rate: item.parsed.vatRate,
            stock_quantity: 0,
            min_stock_level: 0,
          };
          if (tenantId) productData.tenant_id = tenantId;

          const [product] = await trx('products').insert(productData).returning('*');
          productId = product.id;
        } else {
          productId = item.matchedId!;
        }

        // Lock product row and update stock
        const product = await trx('products')
          .where('id', productId)
          .forUpdate()
          .first();

        if (!product) {
          throw new BadRequestException(`Ürün bulunamadı: ${item.parsed.name}`);
        }

        const lineSubtotal = item.parsed.unitPrice * item.parsed.quantity;
        const vatAmount = lineSubtotal * (item.parsed.vatRate / 100);
        const lineTotal = lineSubtotal + vatAmount;

        saleItems.push({
          product_id: productId,
          quantity: item.parsed.quantity,
          unit_price: item.parsed.unitPrice,
          discount_rate: 0,
          vat_rate: item.parsed.vatRate,
          vat_amount: vatAmount,
          line_total: lineTotal,
        });

        // Decrease stock
        await trx('products').where('id', productId).update({
          stock_quantity: trx.raw('stock_quantity - ?', [item.parsed.quantity]),
          updated_at: trx.fn.now(),
        });
      }

      // 3. Create sale
      const invoiceNumber = await this.salesRepository.generateInvoiceNumber();
      const subtotal = saleItems.reduce((s, i) => s + (i.unit_price * i.quantity), 0);
      const vatTotal = saleItems.reduce((s, i) => s + i.vat_amount, 0);
      const grandTotal = subtotal + vatTotal;

      const saleData: any = {
        invoice_number: invoiceNumber,
        customer_id: customerId,
        warehouse_id: data.warehouseId || null,
        sale_date: data.invoice.issueDate ? new Date(data.invoice.issueDate) : new Date(),
        subtotal,
        discount_amount: 0,
        discount_rate: 0,
        vat_total: vatTotal,
        grand_total: grandTotal,
        include_vat: true,
        sale_type: data.saleType || 'retail',
        payment_method: data.paymentMethod || 'nakit',
        due_date: data.dueDate ? new Date(data.dueDate) : null,
        status: 'completed',
        invoice_issued: true,
        notes: data.notes
          ? `${data.notes}\nE-Fatura import: ${data.invoice.id}`
          : `E-Fatura import: ${data.invoice.id}`,
        created_by: userId || null,
      };
      if (tenantId) saleData.tenant_id = tenantId;

      const [sale] = await trx('sales').insert(saleData).returning('*');

      // 4. Insert sale items
      if (saleItems.length > 0) {
        await trx('sale_items').insert(
          saleItems.map((item) => ({ ...item, sale_id: sale.id })),
        );
      }

      return { saleId: sale.id };
    });
    } catch (err) {
      console.error('InvoiceImport confirmImport error:', err);
      const fs = require('fs');
      fs.writeFileSync('/tmp/invoice-import-error.log', `${new Date().toISOString()}\n${err instanceof Error ? err.stack || err.message : JSON.stringify(err)}\nData keys: ${JSON.stringify(Object.keys(data || {}))}\nCustomer keys: ${JSON.stringify(Object.keys(data?.customer || {}))}\nItems count: ${data?.items?.length}\n`);
      throw err;
    }
  }
}
