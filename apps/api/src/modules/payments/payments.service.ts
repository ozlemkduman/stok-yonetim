import { Injectable, NotFoundException } from '@nestjs/common';
import { PaymentsRepository, Payment } from './payments.repository';
import { CustomersRepository } from '../customers/customers.repository';
import { CreatePaymentDto } from './dto';
import { DatabaseService } from '../../database/database.service';
import { createPaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly paymentsRepository: PaymentsRepository,
    private readonly customersRepository: CustomersRepository,
    private readonly db: DatabaseService,
  ) {}

  async findAll(params: any) {
    const { items, total } = await this.paymentsRepository.findAll(params);
    return createPaginatedResult(items, total, params.page, params.limit);
  }

  async create(dto: CreatePaymentDto): Promise<Payment> {
    const customer = await this.customersRepository.findById(dto.customer_id);
    if (!customer) throw new NotFoundException('Musteri bulunamadi');

    return this.db.transaction(async (trx) => {
      const payment = await this.paymentsRepository.createPayment({
        customer_id: dto.customer_id,
        sale_id: dto.sale_id || null,
        payment_date: dto.payment_date ? new Date(dto.payment_date) : new Date(),
        amount: dto.amount,
        method: dto.method,
        notes: dto.notes || null,
      }, trx);

      await trx('customers').where('id', dto.customer_id).update({
        balance: trx.raw('balance + ?', [dto.amount]),
        updated_at: trx.fn.now(),
      });

      await trx('account_transactions').insert({
        customer_id: dto.customer_id,
        type: 'alacak',
        amount: dto.amount,
        description: `Tahsilat: ${dto.method}`,
        reference_type: 'payment',
        reference_id: payment.id,
        transaction_date: new Date(),
      });

      return payment;
    });
  }
}
