import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CustomersRepository, Customer, CustomerListParams } from './customers.repository';
import { CreateCustomerDto, UpdateCustomerDto } from './dto';
import { createPaginatedResult, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly customersRepository: CustomersRepository) {}

  async findAll(params: CustomerListParams): Promise<PaginatedResult<Customer>> {
    const { items, total } = await this.customersRepository.findAll(params);
    return createPaginatedResult(items, total, params.page, params.limit);
  }

  async findById(id: string): Promise<Customer> {
    const customer = await this.customersRepository.findById(id);
    if (!customer) {
      throw new NotFoundException(`Musteri bulunamadi: ${id}`);
    }
    return customer;
  }

  async create(dto: CreateCustomerDto): Promise<Customer> {
    // Check for duplicate email if provided
    if (dto.email) {
      const existing = await this.customersRepository.findByEmail(dto.email);
      if (existing) {
        throw new ConflictException('Bu e-posta adresi zaten kullaniliyor');
      }
    }

    return this.customersRepository.create(dto);
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    // Check if customer exists
    await this.findById(id);

    // Check for duplicate email if updating email
    if (dto.email) {
      const existing = await this.customersRepository.findByEmail(dto.email);
      if (existing && existing.id !== id) {
        throw new ConflictException('Bu e-posta adresi zaten kullaniliyor');
      }
    }

    const updated = await this.customersRepository.update(id, dto);
    if (!updated) {
      throw new NotFoundException(`Musteri bulunamadi: ${id}`);
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const customer = await this.findById(id);

    // Check if customer has balance
    if (customer.balance !== 0) {
      throw new ConflictException(
        'Bakiyesi olan musteri silinemez. Once bakiyeyi sifirlayin.'
      );
    }

    const deleted = await this.customersRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Musteri bulunamadi: ${id}`);
    }
  }

  async getCustomersWithDebt(): Promise<Customer[]> {
    return this.customersRepository.getCustomersWithDebt();
  }

  async getCustomersWithCredit(): Promise<Customer[]> {
    return this.customersRepository.getCustomersWithCredit();
  }

  async updateBalance(id: string, amount: number): Promise<void> {
    await this.findById(id); // Ensure customer exists
    await this.customersRepository.updateBalance(id, amount);
  }

  async getCustomerSales(id: string) {
    await this.findById(id);
    return this.customersRepository.getCustomerSalesWithItems(id);
  }

  async getCustomerReturns(id: string) {
    await this.findById(id);
    return this.customersRepository.getCustomerReturns(id);
  }

  async getCustomerPayments(id: string) {
    await this.findById(id);
    return this.customersRepository.getCustomerPayments(id);
  }

  async getCustomerStats(id: string) {
    await this.findById(id);
    return this.customersRepository.getCustomerStats(id);
  }

  async getCustomerDetail(id: string) {
    const customer = await this.findById(id);
    const [sales, returns, payments, stats] = await Promise.all([
      this.customersRepository.getCustomerSalesWithItems(id),
      this.customersRepository.getCustomerReturns(id),
      this.customersRepository.getCustomerPayments(id),
      this.customersRepository.getCustomerStats(id),
    ]);

    return {
      customer,
      sales,
      returns,
      payments,
      stats,
    };
  }
}
