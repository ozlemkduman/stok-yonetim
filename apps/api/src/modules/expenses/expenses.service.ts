import { Injectable, NotFoundException } from '@nestjs/common';
import { ExpensesRepository, Expense } from './expenses.repository';
import { CreateExpenseDto, UpdateExpenseDto } from './dto';
import { createPaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class ExpensesService {
  constructor(private readonly expensesRepository: ExpensesRepository) {}

  async findAll(params: any) {
    const { items, total } = await this.expensesRepository.findAll(params);
    return createPaginatedResult(items, total, params.page, params.limit);
  }

  async findById(id: string): Promise<Expense> {
    const expense = await this.expensesRepository.findById(id);
    if (!expense) throw new NotFoundException(`Gider bulunamadi: ${id}`);
    return expense;
  }

  async create(dto: CreateExpenseDto): Promise<Expense> {
    return this.expensesRepository.createExpense(dto);
  }

  async update(id: string, dto: UpdateExpenseDto): Promise<Expense> {
    await this.findById(id);
    const updated = await this.expensesRepository.updateExpense(id, dto);
    if (!updated) throw new NotFoundException(`Gider bulunamadi: ${id}`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.expensesRepository.deleteExpense(id);
  }

  async getTotalByCategory(startDate?: string, endDate?: string) {
    return this.expensesRepository.getTotalByCategory(startDate, endDate);
  }
}
