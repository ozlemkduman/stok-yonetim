import { Injectable, NotFoundException } from '@nestjs/common';
import { ExpensesRepository, Expense } from './expenses.repository';
import { CreateExpenseDto, UpdateExpenseDto } from './dto';
import { createPaginatedResult } from '../../common/dto/pagination.dto';
import { DatabaseService } from '../../database/database.service';
import { getCurrentTenantId } from '../../common/context/tenant.context';
import { postAccountMovement, removeAccountMovements } from '../../common/helpers/account-movement.helper';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly expensesRepository: ExpensesRepository,
    private readonly db: DatabaseService,
  ) {}

  async findAll(params: any) {
    const { items, total } = await this.expensesRepository.findAll(params);
    return createPaginatedResult(items, total, params.page, params.limit);
  }

  async findById(id: string): Promise<Expense> {
    const expense = await this.expensesRepository.findExpenseById(id);
    if (!expense) throw new NotFoundException(`Gider bulunamadi: ${id}`);
    return expense;
  }

  async create(dto: CreateExpenseDto, userId?: string): Promise<Expense> {
    const tenantId = getCurrentTenantId();
    return this.db.transaction(async (trx) => {
      const [expense] = await trx('expenses').insert({
        category: dto.category,
        description: dto.description ?? null,
        amount: dto.amount,
        expense_date: dto.expense_date,
        is_recurring: dto.is_recurring ?? false,
        recurrence_period: dto.recurrence_period ?? null,
        account_id: dto.account_id ?? null,
        created_by: userId ?? null,
        tenant_id: tenantId ?? null,
      }).returning('*');

      // Gider parası seçili (yoksa default kasa) hesaptan çıksın.
      if (tenantId) {
        await postAccountMovement(trx, {
          tenantId,
          accountId: dto.account_id,
          accountType: 'kasa',
          movementType: 'gider',
          amount: dto.amount,
          category: `gider: ${dto.category}`,
          description: dto.description || dto.category,
          referenceType: 'expense',
          referenceId: expense.id,
          movementDate: new Date(dto.expense_date),
        });
      }
      return expense;
    });
  }

  async update(id: string, dto: UpdateExpenseDto): Promise<Expense> {
    const tenantId = getCurrentTenantId();
    await this.findById(id); // tenant-filtreli doğrulama (yoksa 404)
    return this.db.transaction(async (trx) => {
      const [expense] = await trx('expenses')
        .where({ id, ...(tenantId ? { tenant_id: tenantId } : {}) })
        .update({ ...dto, updated_at: trx.fn.now() })
        .returning('*');
      if (!expense) throw new NotFoundException(`Gider bulunamadi: ${id}`);

      // Eski hareketi geri al, yeni değerlerle tekrar işle (bakiye tam kalır).
      if (tenantId) {
        await removeAccountMovements(trx, tenantId, 'expense', id);
        await postAccountMovement(trx, {
          tenantId,
          accountId: expense.account_id,
          accountType: 'kasa',
          movementType: 'gider',
          amount: Number(expense.amount),
          category: `gider: ${expense.category}`,
          description: expense.description || expense.category,
          referenceType: 'expense',
          referenceId: id,
          movementDate: new Date(expense.expense_date),
        });
      }
      return expense;
    });
  }

  async delete(id: string): Promise<void> {
    const tenantId = getCurrentTenantId();
    await this.findById(id);
    await this.db.transaction(async (trx) => {
      if (tenantId) await removeAccountMovements(trx, tenantId, 'expense', id);
      await trx('expenses').where({ id, ...(tenantId ? { tenant_id: tenantId } : {}) }).delete();
    });
  }

  async getTotalByCategory(startDate?: string, endDate?: string) {
    return this.expensesRepository.getTotalByCategory(startDate, endDate);
  }
}
