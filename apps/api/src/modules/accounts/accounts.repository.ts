import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { BaseTenantRepository } from '../../common/repositories/base.repository';
import { Knex } from 'knex';

export interface Account {
  id: string;
  name: string;
  account_type: string;
  bank_name: string | null;
  iban: string | null;
  account_number: string | null;
  branch_name: string | null;
  currency: string;
  opening_balance: number;
  current_balance: number;
  is_default: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AccountMovement {
  id: string;
  account_id: string;
  movement_type: string;
  amount: number;
  balance_after: number;
  category: string | null;
  description: string | null;
  reference_type: string | null;
  reference_id: string | null;
  movement_date: Date;
  created_at: Date;
  account_name?: string;
}

export interface AccountTransfer {
  id: string;
  from_account_id: string;
  to_account_id: string;
  amount: number;
  description: string | null;
  transfer_date: Date;
  created_at: Date;
  from_account_name?: string;
  to_account_name?: string;
}

@Injectable()
export class AccountsRepository extends BaseTenantRepository<Account> {
  protected tableName = 'accounts';

  constructor(db: DatabaseService) {
    super(db);
  }

  async findAll(params: {
    page: number;
    limit: number;
    accountType?: string;
    isActive?: boolean;
    sortBy: string;
    sortOrder: 'asc' | 'desc'
  }): Promise<{ items: Account[]; total: number }> {
    const { page, limit, accountType, isActive, sortBy, sortOrder } = params;
    const offset = (page - 1) * limit;

    let query = this.query.clone().select('*');
    let countQuery = this.query.clone();

    if (accountType) {
      query = query.where('account_type', accountType);
      countQuery = countQuery.where('account_type', accountType);
    }

    if (isActive !== undefined) {
      query = query.where('is_active', isActive);
      countQuery = countQuery.where('is_active', isActive);
    }

    const [items, [{ count }]] = await Promise.all([
      query.orderBy(sortBy, sortOrder).limit(limit).offset(offset),
      countQuery.count('id as count'),
    ]);

    return { items, total: parseInt(count as string, 10) };
  }

  async findDefault(accountType?: string): Promise<Account | null> {
    let query = this.query.where('is_default', true).where('is_active', true);
    if (accountType) {
      query = query.where('account_type', accountType);
    }
    return query.first() || null;
  }

  async createAccount(data: Partial<Account>, trx?: Knex.Transaction): Promise<Account> {
    const insertData = this.getInsertData({
      ...data,
      current_balance: data.opening_balance || 0,
    });
    const query = trx ? trx('accounts') : this.knex('accounts');
    const [account] = await query.insert(insertData).returning('*');
    return account;
  }

  async updateAccount(id: string, data: Partial<Account>): Promise<Account> {
    const [account] = await this.query
      .where(`${this.tableName}.id`, id)
      .update({ ...data, updated_at: this.knex.fn.now() })
      .returning('*');
    return account;
  }

  async updateBalance(id: string, amount: number, trx?: Knex.Transaction): Promise<void> {
    const baseQuery = trx ? trx('accounts') : this.knex('accounts');
    await this.applyTenantFilter(baseQuery).where('id', id).increment('current_balance', amount).update({ updated_at: this.knex.fn.now() });
  }

  async setDefault(id: string, accountType: string): Promise<void> {
    await this.db.knex.transaction(async (trx) => {
      // Remove default from all accounts of same type
      await this.applyTenantFilter(trx('accounts')).where('account_type', accountType).update({ is_default: false });
      // Set new default
      await this.applyTenantFilter(trx('accounts')).where('id', id).update({ is_default: true, updated_at: trx.fn.now() });
    });
  }

  async deleteAccount(id: string): Promise<void> {
    await this.query.where(`${this.tableName}.id`, id).update({ is_active: false, updated_at: this.knex.fn.now() });
  }

  // Movements
  async findMovements(params: {
    accountId: string;
    page: number;
    limit: number;
    startDate?: string;
    endDate?: string;
    movementType?: string;
  }): Promise<{ items: AccountMovement[]; total: number }> {
    const { accountId, page, limit, startDate, endDate, movementType } = params;
    const offset = (page - 1) * limit;

    let query = this.knex('account_movements').where('account_id', accountId);
    query = this.applyTenantFilter(query, 'account_movements');

    let countQuery = this.knex('account_movements').where('account_id', accountId);
    countQuery = this.applyTenantFilter(countQuery, 'account_movements');

    if (startDate) {
      query = query.where('movement_date', '>=', startDate);
      countQuery = countQuery.where('movement_date', '>=', startDate);
    }
    if (endDate) {
      query = query.where('movement_date', '<=', endDate);
      countQuery = countQuery.where('movement_date', '<=', endDate);
    }
    if (movementType) {
      query = query.where('movement_type', movementType);
      countQuery = countQuery.where('movement_type', movementType);
    }

    const [items, [{ count }]] = await Promise.all([
      query.orderBy('movement_date', 'desc').orderBy('created_at', 'desc').limit(limit).offset(offset),
      countQuery.count('id as count'),
    ]);

    return { items, total: parseInt(count as string, 10) };
  }

  async createMovement(data: Partial<AccountMovement>, trx?: Knex.Transaction): Promise<AccountMovement> {
    const insertData = this.getInsertData(data);
    const query = trx ? trx('account_movements') : this.knex('account_movements');
    const [movement] = await query.insert(insertData).returning('*');
    return movement;
  }

  // Transfers
  async findTransfers(params: {
    page: number;
    limit: number;
    accountId?: string;
  }): Promise<{ items: AccountTransfer[]; total: number }> {
    const { page, limit, accountId } = params;
    const offset = (page - 1) * limit;

    let query = this.knex('account_transfers')
      .leftJoin('accounts as from_acc', 'account_transfers.from_account_id', 'from_acc.id')
      .leftJoin('accounts as to_acc', 'account_transfers.to_account_id', 'to_acc.id')
      .select(
        'account_transfers.*',
        'from_acc.name as from_account_name',
        'to_acc.name as to_account_name'
      );

    query = this.applyTenantFilter(query, 'account_transfers');

    let countQuery = this.knex('account_transfers');
    countQuery = this.applyTenantFilter(countQuery, 'account_transfers');

    if (accountId) {
      query = query.where((b) => b.where('from_account_id', accountId).orWhere('to_account_id', accountId));
      countQuery = countQuery.where((b) => b.where('from_account_id', accountId).orWhere('to_account_id', accountId));
    }

    const [items, [{ count }]] = await Promise.all([
      query.orderBy('account_transfers.transfer_date', 'desc').limit(limit).offset(offset),
      countQuery.count('account_transfers.id as count'),
    ]);

    return { items, total: parseInt(count as string, 10) };
  }

  async createTransfer(data: Partial<AccountTransfer>, trx?: Knex.Transaction): Promise<AccountTransfer> {
    const insertData = this.getInsertData(data);
    const query = trx ? trx('account_transfers') : this.knex('account_transfers');
    const [transfer] = await query.insert(insertData).returning('*');
    return transfer;
  }

  // Summary
  async getSummary(): Promise<{ totalKasa: number; totalBanka: number; totalBalance: number }> {
    const kasaQuery = this.query.clone()
      .where('account_type', 'kasa')
      .where('is_active', true)
      .sum('current_balance as total');

    const bankaQuery = this.query.clone()
      .where('account_type', 'banka')
      .where('is_active', true)
      .sum('current_balance as total');

    const [kasaResult] = await kasaQuery;
    const [bankaResult] = await bankaQuery;

    const totalKasa = parseFloat((kasaResult as any)?.total || '0');
    const totalBanka = parseFloat((bankaResult as any)?.total || '0');

    return {
      totalKasa,
      totalBanka,
      totalBalance: totalKasa + totalBanka,
    };
  }
}
