import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { BaseTenantRepository } from '../../common/repositories/base.repository';
import { CreateExpenseDto, UpdateExpenseDto } from './dto';

export interface Expense {
  id: string;
  category: string;
  description: string | null;
  amount: number;
  expense_date: Date;
  is_recurring: boolean;
  recurrence_period: string | null;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  created_by_name?: string;
}

@Injectable()
export class ExpensesRepository extends BaseTenantRepository<Expense> {
  protected tableName = 'expenses';

  constructor(db: DatabaseService) {
    super(db);
  }

  async findExpenseById(id: string): Promise<Expense | null> {
    return this.query.clone()
      .leftJoin('users', `${this.tableName}.created_by`, 'users.id')
      .select(`${this.tableName}.*`, 'users.name as created_by_name')
      .where(`${this.tableName}.id`, id)
      .first() || null;
  }

  async findAll(params: { page: number; limit: number; category?: string; startDate?: string; endDate?: string; sortBy: string; sortOrder: 'asc' | 'desc' }): Promise<{ items: Expense[]; total: number }> {
    const { page, limit, category, startDate, endDate, sortBy, sortOrder } = params;

    let query = this.query.clone()
      .leftJoin('users', `${this.tableName}.created_by`, 'users.id');
    let countQuery = this.query.clone();

    if (category) {
      query = query.where(`${this.tableName}.category`, category);
      countQuery = countQuery.where('category', category);
    }
    if (startDate) {
      query = query.where(`${this.tableName}.expense_date`, '>=', startDate);
      countQuery = countQuery.where('expense_date', '>=', startDate);
    }
    if (endDate) {
      query = query.where(`${this.tableName}.expense_date`, '<=', endDate);
      countQuery = countQuery.where('expense_date', '<=', endDate);
    }

    const [items, [{ count }]] = await Promise.all([
      query.orderBy(`${this.tableName}.${sortBy}`, sortOrder).limit(limit).offset((page - 1) * limit).select(`${this.tableName}.*`, 'users.name as created_by_name'),
      countQuery.count('id as count'),
    ]);
    return { items, total: parseInt(count as string, 10) };
  }

  async createExpense(data: CreateExpenseDto, userId?: string): Promise<Expense> {
    const insertData = this.getInsertData({ ...data, created_by: userId || null } as any);
    const [expense] = await this.knex(this.tableName).insert(insertData).returning('*');
    return expense;
  }

  async updateExpense(id: string, data: UpdateExpenseDto): Promise<Expense | null> {
    const [expense] = await this.query
      .where(`${this.tableName}.id`, id)
      .update({ ...data, updated_at: this.knex.fn.now() })
      .returning('*');
    return expense || null;
  }

  async deleteExpense(id: string): Promise<boolean> {
    const result = await this.query.where(`${this.tableName}.id`, id).delete();
    return result > 0;
  }

  async getTotalByCategory(startDate?: string, endDate?: string): Promise<{ category: string; total: number }[]> {
    let query = this.query.clone().select('category').sum('amount as total').groupBy('category');
    if (startDate) query = query.where('expense_date', '>=', startDate);
    if (endDate) query = query.where('expense_date', '<=', endDate);
    return query;
  }
}
