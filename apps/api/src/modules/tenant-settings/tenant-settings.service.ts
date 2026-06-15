import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { getCurrentTenantId } from '../../common/context/tenant.context';

export interface TenantSettings {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logo_url: string | null;
  plan_id: string | null;
  business_type: string;
  settings: Record<string, any>;
  status: string;
  trial_ends_at: Date | null;
  subscription_starts_at: Date | null;
  subscription_ends_at: Date | null;
  billing_email: string | null;
  plan_name?: string;
  plan_code?: string;
  plan_features?: Record<string, any>;
  plan_limits?: Record<string, any>;
}

export interface UpdateTenantSettingsDto {
  name?: string;
  domain?: string;
  logoUrl?: string;
  billingEmail?: string;
  settings?: Record<string, any>;
}

@Injectable()
export class TenantSettingsService {
  constructor(private readonly db: DatabaseService) {}

  async getSettings(): Promise<TenantSettings> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      throw new ForbiddenException('Tenant bilgisi bulunamadı');
    }

    const tenant = await this.db.knex('tenants')
      .select(
        'tenants.*',
        'plans.name as plan_name',
        'plans.code as plan_code',
        'plans.features as plan_features',
        'plans.limits as plan_limits',
      )
      .leftJoin('plans', 'tenants.plan_id', 'plans.id')
      .where('tenants.id', tenantId)
      .first();

    if (!tenant) {
      throw new NotFoundException('Kiracı bulunamadı');
    }

    return {
      ...tenant,
      settings: typeof tenant.settings === 'string' ? JSON.parse(tenant.settings) : tenant.settings,
      plan_features: tenant.plan_features
        ? (typeof tenant.plan_features === 'string' ? JSON.parse(tenant.plan_features) : tenant.plan_features)
        : null,
      plan_limits: tenant.plan_limits
        ? (typeof tenant.plan_limits === 'string' ? JSON.parse(tenant.plan_limits) : tenant.plan_limits)
        : null,
    };
  }

  async updateSettings(dto: UpdateTenantSettingsDto): Promise<TenantSettings> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      throw new ForbiddenException('Tenant bilgisi bulunamadı');
    }

    const updateData: any = { updated_at: this.db.knex.fn.now() };

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.domain !== undefined) updateData.domain = dto.domain;
    if (dto.logoUrl !== undefined) updateData.logo_url = dto.logoUrl;
    if (dto.billingEmail !== undefined) updateData.billing_email = dto.billingEmail;
    if (dto.settings !== undefined) updateData.settings = JSON.stringify(dto.settings);

    await this.db.knex('tenants').where('id', tenantId).update(updateData);

    return this.getSettings();
  }

  async getUsage(): Promise<{
    users: { current: number; limit: number };
    products: { current: number; limit: number };
    customers: { current: number; limit: number };
    warehouses: { current: number; limit: number };
    integrations: { current: number; limit: number };
  }> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      throw new ForbiddenException('Tenant bilgisi bulunamadı');
    }

    const tenant = await this.db.knex('tenants')
      .select('plans.limits')
      .leftJoin('plans', 'tenants.plan_id', 'plans.id')
      .where('tenants.id', tenantId)
      .first();

    const limits = tenant?.limits
      ? (typeof tenant.limits === 'string' ? JSON.parse(tenant.limits) : tenant.limits)
      : {};

    const [users, products, customers, warehouses, integrations] = await Promise.all([
      this.db.knex('users').where('tenant_id', tenantId).count('* as count').first(),
      this.db.knex('products').where('tenant_id', tenantId).count('* as count').first(),
      this.db.knex('customers').where('tenant_id', tenantId).count('* as count').first(),
      this.db.knex('warehouses').where('tenant_id', tenantId).count('* as count').first(),
      this.db.knex('integrations').where('tenant_id', tenantId).count('* as count').first(),
    ]);

    return {
      users: {
        current: parseInt(users?.count as string, 10) || 0,
        limit: limits.maxUsers || -1,
      },
      products: {
        current: parseInt(products?.count as string, 10) || 0,
        limit: limits.maxProducts || -1,
      },
      customers: {
        current: parseInt(customers?.count as string, 10) || 0,
        limit: limits.maxCustomers || -1,
      },
      warehouses: {
        current: parseInt(warehouses?.count as string, 10) || 0,
        limit: limits.maxWarehouses || -1,
      },
      integrations: {
        current: parseInt(integrations?.count as string, 10) || 0,
        limit: limits.maxIntegrations || -1,
      },
    };
  }

  /**
   * Tenant'ın plan'ında belirtilen feature açık mı?
   * @param feature - kontrol edilecek feature key
   * @param providedTenantId - opsiyonel; verilirse AsyncLocalStorage'dan okumaz
   *   (Guard'lar TenantInterceptor'dan önce çalıştığı için onlar bu paramı geçer)
   */
  async checkFeature(feature: string, providedTenantId?: string): Promise<boolean> {
    const tenantId = providedTenantId || getCurrentTenantId();
    if (!tenantId) {
      return false;
    }

    const tenant = await this.db.knex('tenants')
      .select('plans.features')
      .leftJoin('plans', 'tenants.plan_id', 'plans.id')
      .where('tenants.id', tenantId)
      .first();

    if (!tenant?.features) {
      return false;
    }

    const features = typeof tenant.features === 'string' ? JSON.parse(tenant.features) : tenant.features;
    return features[feature] === true;
  }

  /**
   * Tenant'ın sektörü (business_type) verilen sektörle eşleşiyor mu?
   * Plandan bağımsızdır; SectorGuard tarafından kullanılır.
   * @param sector - kontrol edilecek sektör (örn. 'auto_service')
   * @param providedTenantId - opsiyonel; Guard'lar TenantInterceptor'dan önce
   *   çalıştığı için tenant_id'yi parametre olarak geçer.
   */
  async checkSector(sector: string, providedTenantId?: string): Promise<boolean> {
    const tenantId = providedTenantId || getCurrentTenantId();
    if (!tenantId) {
      return false;
    }

    const tenant = await this.db.knex('tenants')
      .select('business_type')
      .where('id', tenantId)
      .first();

    return tenant?.business_type === sector;
  }

  async checkLimit(resource: string): Promise<{ allowed: boolean; current: number; limit: number }> {
    const usage = await this.getUsage();
    const resourceUsage = (usage as any)[resource];

    if (!resourceUsage) {
      return { allowed: true, current: 0, limit: -1 };
    }

    const { current, limit } = resourceUsage;

    if (limit === -1) {
      return { allowed: true, current, limit };
    }

    return {
      allowed: current < limit,
      current,
      limit,
    };
  }
}
