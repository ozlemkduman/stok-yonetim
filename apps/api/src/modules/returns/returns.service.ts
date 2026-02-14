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

      for (const item of dto.items) {
        const product = await this.productsRepository.findById(item.product_id);
        if (!product) throw new BadRequestException(`Urun bulunamadi: ${item.product_id}`);
        const vatAmount = item.unit_price * item.quantity * product.vat_rate / 100;
        const lineTotal = item.unit_price * item.quantity + vatAmount;
        totalAmount += item.unit_price * item.quantity;
        vatTotal += vatAmount;
        returnItems.push({
          product_id: item.product_id,
          sale_item_id: item.sale_item_id || null,
          quantity: item.quantity,
          unit_price: item.unit_price,
          vat_amount: vatAmount,
          line_total: lineTotal,
        });
        await trx('products').where('id', item.product_id).update({
          stock_quantity: trx.raw('stock_quantity + ?', [item.quantity]),
          updated_at: trx.fn.now(),
        });
      }

      const ret = await this.returnsRepository.createReturn({
        return_number: returnNumber,
        sale_id: dto.sale_id || null,
        customer_id: dto.customer_id || null,
        return_date: new Date(),
        total_amount: totalAmount + vatTotal,
        vat_total: vatTotal,
        reason: dto.reason || null,
        status: 'completed',
      }, returnItems, trx);

      if (dto.customer_id) {
        await trx('customers').where('id', dto.customer_id).update({
          balance: trx.raw('balance + ?', [totalAmount + vatTotal]),
          updated_at: trx.fn.now(),
        });
        await trx('account_transactions').insert({
          customer_id: dto.customer_id,
          type: 'alacak',
          amount: totalAmount + vatTotal,
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
