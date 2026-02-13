import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

export interface Plan {
  id: string;
  name: string;
  code: string;
  price: number;
  billing_period: string;
  features: Record<string, any>;
  limits: Record<string, any>;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface PlanWithTenantCount extends Plan {
  tenant_count?: number;
}

@Injectable()
export class PlansRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAll(includeInactive = false): Promise<PlanWithTenantCount[]> {
    let query = this.db.knex<Plan>('plans');

    if (!includeInactive) {
      query = query.where('is_active', true);
    }

    const plans = await query.orderBy('sort_order', 'asc');

    // Get tenant counts for each plan
    const tenantCounts = await this.db.knex('tenants')
      .select('plan_id')
      .count('* as count')
      .groupBy('plan_id');

    const countMap = new Map(tenantCounts.map((tc) => [tc.plan_id, parseInt(tc.count as string, 10)]));

    return plans.map((plan) => ({
      ...plan,
      features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
      limits: typeof plan.limits === 'string' ? JSON.parse(plan.limits) : plan.limits,
      tenant_count: countMap.get(plan.id) || 0,
    }));
  }

  async findById(id: string): Promise<Plan | null> {
    const plan = await this.db.knex<Plan>('plans').where({ id }).first();

    if (!plan) return null;

    return {
      ...plan,
      features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
      limits: typeof plan.limits === 'string' ? JSON.parse(plan.limits) : plan.limits,
    };
  }

  async findByCode(code: string): Promise<Plan | null> {
    const plan = await this.db.knex<Plan>('plans').where({ code }).first();

    if (!plan) return null;

    return {
      ...plan,
      features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
      limits: typeof plan.limits === 'string' ? JSON.parse(plan.limits) : plan.limits,
    };
  }

  async create(data: Partial<Plan>): Promise<Plan> {
    const insertData = {
      ...data,
      features: JSON.stringify(data.features || {}),
      limits: JSON.stringify(data.limits || {}),
    };
    const [plan] = await this.db.knex('plans')
      .insert(insertData)
      .returning('*');

    return {
      ...plan,
      features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
      limits: typeof plan.limits === 'string' ? JSON.parse(plan.limits) : plan.limits,
    } as Plan;
  }

  async update(id: string, data: Partial<Plan>): Promise<Plan | null> {
    const updateData: any = { ...data, updated_at: this.db.knex.fn.now() };

    if (data.features) {
      updateData.features = JSON.stringify(data.features);
    }
    if (data.limits) {
      updateData.limits = JSON.stringify(data.limits);
    }

    const [plan] = await this.db.knex<Plan>('plans')
      .where({ id })
      .update(updateData)
      .returning('*');

    if (!plan) return null;

    return {
      ...plan,
      features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
      limits: typeof plan.limits === 'string' ? JSON.parse(plan.limits) : plan.limits,
    };
  }

  async delete(id: string): Promise<boolean> {
    // Check if plan is in use
    const tenantCount = await this.db.knex('tenants')
      .where('plan_id', id)
      .count('* as count')
      .first();

    if (parseInt(tenantCount?.count as string, 10) > 0) {
      return false;
    }

    const count = await this.db.knex('plans').where({ id }).del();
    return count > 0;
  }
}
