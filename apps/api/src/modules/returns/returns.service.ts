import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ReturnsRepository, Return, ReturnItem } from './returns.repository';
import { ProductsRepository } from '../products/products.repository';
import { CreateReturnDto } from './dto';
import { DatabaseService } from '../../database/database.service';
import { createPaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class ReturnsService {
  constructor(
    private readonly returnsRepository: ReturnsRepository,
    private readonly productsRepository: ProductsRepository,
    private readonly db: DatabaseService,
  ) {}

  async findAll(params: any) {
    const { items, total } = await this.returnsRepository.findAll(params);
    return createPaginatedResult(items, total, params.page, params.limit);
  }

  async findById(id: string): Promise<Return & { items: ReturnItem[] }> {
    const ret = await this.returnsRepository.findReturnById(id);
    if (!ret) throw new NotFoundException(`Iade bulunamadi: ${id}`);
    const items = await this.returnsRepository.findItemsByReturnId(id);
    return { ...ret, items };
  }

  async create(dto: CreateReturnDto): Promise<Return> {
    return this.db.transaction(async (trx) => {
      const returnNumber = await this.returnsRepository.generateReturnNumber();
      let totalAmount = 0;
      let vatTotal = 0;
      const returnItems: Partial<ReturnItem>[] = [];

      // Satis varsa, satis kalemlerini ve onceki iadeleri kontrol et
      let saleItemsMap: Record<string, { quantity: number; vat_rate: number }> = {};
      if (dto.sale_id) {
        const sale = await trx('sales').where('id', dto.sale_id).first();
        if (!sale) throw new BadRequestException('Satis bulunamadi');
        if (sale.status === 'cancelled') throw new BadRequestException('Iptal edilmis satista iade yapilamaz');

        // Satis kalemlerini al
        const saleItems = await trx('sale_items').where('sale_id', dto.sale_id);
        for (const si of saleItems) {
          saleItemsMap[si.id] = { quantity: si.quantity, vat_rate: si.vat_rate };
        }

        // Bu satista daha once yapilan iadeleri bul
        const previousReturns = await trx('return_items')
          .join('returns', 'return_items.return_id', 'returns.id')
          .where('returns.sale_id', dto.sale_id)
          .where('returns.status', 'completed')
          .select('return_items.sale_item_id', trx.raw('SUM(return_items.quantity) as returned_quantity'))
          .groupBy('return_items.sale_item_id');

        const returnedMap: Record<string, number> = {};
        for (const pr of previousReturns) {
          if (pr.sale_item_id) {
            returnedMap[pr.sale_item_id] = Number(pr.returned_quantity);
          }
        }

        // Miktar kontrolu
        for (const item of dto.items) {
          if (item.sale_item_id && saleItemsMap[item.sale_item_id]) {
            const soldQty = saleItemsMap[item.sale_item_id].quantity;
            const alreadyReturned = returnedMap[item.sale_item_id] || 0;
            const available = soldQty - alreadyReturned;
            if (item.quantity > available) {
              throw new BadRequestException(
                `Iade miktari satistan fazla olamaz. Kalan iade edilebilir miktar: ${available}`
              );
            }
          }
        }
      }

      for (const item of dto.items) {
        // Urun kilidini al (race condition onleme)
        const product = await trx('products')
          .where('id', item.product_id)
          .forUpdate()
          .first();
        if (!product) throw new BadRequestException(`Urun bulunamadi: ${item.product_id}`);

        // VAT rate: once frontend'den gelen, sonra satis kaleminden, en son urun varsayilani
        let vatRate = product.vat_rate;
        if (item.vat_rate !== undefined && item.vat_rate !== null) {
          vatRate = item.vat_rate;
        } else if (item.sale_item_id && saleItemsMap[item.sale_item_id]) {
          vatRate = saleItemsMap[item.sale_item_id].vat_rate;
        }

        const lineSubtotal = item.unit_price * item.quantity;
        const vatAmount = lineSubtotal * vatRate / 100;
        const lineTotal = lineSubtotal + vatAmount;
        totalAmount += lineSubtotal;
        vatTotal += vatAmount;

        returnItems.push({
          product_id: item.product_id,
          sale_item_id: item.sale_item_id || null,
          quantity: item.quantity,
          unit_price: item.unit_price,
          vat_amount: vatAmount,
          line_total: lineTotal,
        });

        // Stogu geri ekle
        await trx('products').where('id', item.product_id).update({
          stock_quantity: trx.raw('stock_quantity + ?', [item.quantity]),
          updated_at: trx.fn.now(),
        });
      }

      const grandTotal = totalAmount + vatTotal;

      const ret = await this.returnsRepository.createReturn({
        return_number: returnNumber,
        sale_id: dto.sale_id || null,
        customer_id: dto.customer_id || null,
        return_date: new Date(),
        total_amount: grandTotal,
        vat_total: vatTotal,
        reason: dto.reason || null,
        status: 'completed',
      }, returnItems, trx);

      if (dto.customer_id) {
        await trx('customers').where('id', dto.customer_id).forUpdate().update({
          balance: trx.raw('balance + ?', [grandTotal]),
          updated_at: trx.fn.now(),
        });
        await trx('account_transactions').insert({
          customer_id: dto.customer_id,
          type: 'alacak',
          amount: grandTotal,
          description: `Iade: ${returnNumber}`,
          reference_type: 'return',
          reference_id: ret.id,
          transaction_date: new Date(),
        });
      }
      return ret;
    });
  }
}
