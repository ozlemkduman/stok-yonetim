import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { PaginationParams, createPaginatedResponse } from '../../../common/dto/pagination.dto';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logo_url: string | null;
  plan_id: string | null;
  settings: Record<string, any>;
  status: string;
  trial_ends_at: Date | null;
  subscription_starts_at: Date | null;
  subscription_ends_at: Date | null;
  billing_email: string | null;
  owner_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface TenantWithPlan extends Tenant {
  plan_name?: string;
  plan_code?: string;
  user_count?: number;
}

@Injectable()
export class TenantsRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAll(params: PaginationParams & { status?: string; search?: string }) {
    const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc', status, search } = params;
    const offset = (page - 1) * limit;

    let query = this.db.knex<TenantWithPlan>('tenants')
      .select(
        'tenants.*',
        'plans.name as plan_name',
        'plans.code as plan_code',
      )
      .leftJoin('plans', 'tenants.plan_id', 'plans.id');

    if (status) {
      query = query.where('tenants.status', status);
    }

    if (search) {
      query = query.where((builder) => {
        builder
          .whereILike('tenants.name', `%${search}%`)
          .orWhereILike('tenants.slug', `%${search}%`)
          .orWhereILike('tenants.billing_email', `%${search}%`);
      });
    }

    const countQuery = query.clone().count('* as count').first();
    const dataQuery = query
      .clone()
      .orderBy(`tenants.${sortBy}`, sortOrder)
      .limit(limit)
      .offset(offset);

    const [countResult, items] = await Promise.all([countQuery, dataQuery]);
    const total = parseInt(countResult?.count as string, 10) || 0;

    // Get user counts
    const tenantIds = items.map((t) => t.id);
    const userCounts = await this.db.knex('users')
      .select('tenant_id')
      .count('* as count')
      .whereIn('tenant_id', tenantIds)
      .groupBy('tenant_id');

    const userCountMap = new Map(userCounts.map((uc) => [uc.tenant_id, parseInt(uc.count as string, 10)]));

    const itemsWithCounts = items.map((item) => ({
      ...item,
      user_count: userCountMap.get(item.id) || 0,
    }));

    return createPaginatedResponse(itemsWithCounts, total, page, limit);
  }

  async findById(id: string): Promise<TenantWithPlan | null> {
    const tenant = await this.db.knex<TenantWithPlan>('tenants')
      .select(
        'tenants.*',
        'plans.name as plan_name',
        'plans.code as plan_code',
      )
      .leftJoin('plans', 'tenants.plan_id', 'plans.id')
      .where('tenants.id', id)
      .first();

    if (!tenant) return null;

    const userCount = await this.db.knex('users')
      .where('tenant_id', id)
      .count('* as count')
      .first();

    return {
      ...tenant,
      user_count: parseInt(userCount?.count as string, 10) || 0,
    };
  }

  async create(data: Partial<Tenant>): Promise<Tenant> {
    const insertData = {
      ...data,
      settings: JSON.stringify(data.settings || {}),
    };
    const [tenant] = await this.db.knex('tenants')
      .insert(insertData)
      .returning('*');
    return tenant as Tenant;
  }

  async update(id: string, data: Partial<Tenant>): Promise<Tenant | null> {
    const updateData: any = { ...data, updated_at: this.db.knex.fn.now() };

    if (data.settings) {
      updateData.settings = JSON.stringify(data.settings);
    }

    const [tenant] = await this.db.knex<Tenant>('tenants')
      .where({ id })
      .update(updateData)
      .returning('*');

    return tenant || null;
  }

  async delete(id: string): Promise<boolean> {
    const count = await this.db.knex('tenants').where({ id }).del();
    return count > 0;
  }

  async updateStatus(id: string, status: string): Promise<Tenant | null> {
    return this.update(id, { status } as any);
  }

  async getTenantStats(id: string) {
    const [users, products, customers, sales] = await Promise.all([
      this.db.knex('users').where('tenant_id', id).count('* as count').first(),
      this.db.knex('products').where('tenant_id', id).count('* as count').first(),
      this.db.knex('customers').where('tenant_id', id).count('* as count').first(),
      this.db.knex('sales').where('tenant_id', id).count('* as count').first(),
    ]);

    return {
      userCount: parseInt(users?.count as string, 10) || 0,
      productCount: parseInt(products?.count as string, 10) || 0,
      customerCount: parseInt(customers?.count as string, 10) || 0,
      saleCount: parseInt(sales?.count as string, 10) || 0,
    };
  }
}
