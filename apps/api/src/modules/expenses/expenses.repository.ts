import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto';

export interface Expense {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  expense_date: Date;
  is_recurring: boolean;
  recurrence_period: string | null;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class ExpensesRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAll(params: { page: number; limit: number; category?: string; startDate?: string; endDate?: string; sortBy: string; sortOrder: 'asc' | 'desc' }): Promise<{ items: Expense[]; total: number }> {
    const { page, limit, category, startDate, endDate, sortBy, sortOrder } = params;
    let query = this.db.knex('expenses');
    let countQuery = this.db.knex('expenses');
    if (category) { query = query.where('category', category); countQuery = countQuery.where('category', category); }
    if (startDate) { query = query.where('expense_date', '>=', startDate); countQuery = countQuery.where('expense_date', '>=', startDate); }
    if (endDate) { query = query.where('expense_date', '<=', endDate); countQuery = countQuery.where('expense_date', '<=', endDate); }
    const [items, [{ count }]] = await Promise.all([
      query.orderBy(sortBy, sortOrder).limit(limit).offset((page - 1) * limit).select('*'),
      countQuery.count('id as count'),
    ]);
    return { items, total: parseInt(count as string, 10) };
  }

  async findById(id: string): Promise<Expense | null> {
    return this.db.knex('expenses').where('id', id).first() || null;
  }

  async create(data: CreateExpenseDto): Promise<Expense> {
    const [expense] = await this.db.knex('expenses').insert(data).returning('*');
    return expense;
  }

  async update(id: string, data: UpdateExpenseDto): Promise<Expense | null> {
    const [expense] = await this.db.knex('expenses').where('id', id).update({ ...data, updated_at: this.db.knex.fn.now() }).returning('*');
    return expense || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.knex('expenses').where('id', id).delete();
    return result > 0;
  }

  async getTotalByCategory(startDate?: string, endDate?: string): Promise<{ category: string; total: number }[]> {
    let query = this.db.knex('expenses').select('category').sum('amount as total').groupBy('category');
    if (startDate) query = query.where('expense_date', '>=', startDate);
    if (endDate) query = query.where('expense_date', '<=', endDate);
    return query;
  }
}
