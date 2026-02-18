import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { DatabaseService } from '../../database/database.service';
import { getCurrentTenantId } from '../context/tenant.context';

@Injectable()
export abstract class BaseTenantRepository<T = any> {
  protected abstract tableName: string;

  constructor(protected readonly db: DatabaseService) {}

  protected get knex(): Knex {
    return this.db.knex;
  }

  protected get query(): Knex.QueryBuilder {
    const tenantId = getCurrentTenantId();

    let query = this.knex(this.tableName);

    if (tenantId) {
      query = query.where(`${this.tableName}.tenant_id`, tenantId);
    }

    return query;
  }

  protected applyTenantFilter(query: Knex.QueryBuilder, alias?: string): Knex.QueryBuilder {
    const tenantId = getCurrentTenantId();

    if (tenantId) {
      const column = alias ? `${alias}.tenant_id` : `${this.tableName}.tenant_id`;
      return query.where(column, tenantId);
    }

    return query;
  }

  protected getInsertData(data: Partial<T>): Partial<T> & { tenant_id?: string } {
    const tenantId = getCurrentTenantId();

    if (tenantId) {
      return { ...data, tenant_id: tenantId };
    }

    return data;
  }

  async findById(id: string): Promise<T | null> {
    const result = await this.query.where(`${this.tableName}.id`, id).first();
    return result || null;
  }

  async create(data: Partial<T>): Promise<T> {
    const insertData = this.getInsertData(data);
    const [result] = await this.knex(this.tableName).insert(insertData).returning('*');
    return result;
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const [result] = await this.query
      .where(`${this.tableName}.id`, id)
      .update({ ...data, updated_at: this.knex.fn.now() })
      .returning('*');
    return result || null;
  }

  async delete(id: string): Promise<boolean> {
    const count = await this.query.where(`${this.tableName}.id`, id).del();
    return count > 0;
  }

  async count(): Promise<number> {
    const result = await this.query.count('* as count').first();
    return parseInt(result?.count as string, 10) || 0;
  }
}
