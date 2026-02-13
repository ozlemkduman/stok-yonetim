import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

export interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  tenantCount: number;
}

export interface TenantGrowthData {
  month: string;
  newTenants: number;
  totalTenants: number;
}

@Injectable()
export class AdminDashboardService {
  constructor(private readonly db: DatabaseService) {}

  async getStats(): Promise<DashboardStats> {
    const [tenantStats, userStats, revenueStats] = await Promise.all([
      this.getTenantStats(),
      this.getUserStats(),
      this.getRevenueStats(),
    ]);

    return {
      ...tenantStats,
      ...userStats,
      ...revenueStats,
    };
  }

  private async getTenantStats() {
    const results = await this.db.knex('tenants')
      .select('status')
      .count('* as count')
      .groupBy('status');

    const statsMap = new Map(results.map((r) => [r.status, parseInt(r.count as string, 10)]));

    return {
      totalTenants: results.reduce((sum, r) => sum + parseInt(r.count as string, 10), 0),
      activeTenants: statsMap.get('active') || 0,
      trialTenants: statsMap.get('trial') || 0,
      suspendedTenants: statsMap.get('suspended') || 0,
    };
  }

  private async getUserStats() {
    const results = await this.db.knex('users')
      .select('status')
      .count('* as count')
      .groupBy('status');

    const totalUsers = results.reduce((sum, r) => sum + parseInt(r.count as string, 10), 0);
    const activeUsers = parseInt(
      results.find((r) => r.status === 'active')?.count as string || '0',
      10,
    );

    return {
      totalUsers,
      activeUsers,
    };
  }

  private async getRevenueStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalRevenue, monthlyRevenue] = await Promise.all([
      this.db.knex('tenant_invoices')
        .where('status', 'paid')
        .sum('total_amount as total')
        .first(),
      this.db.knex('tenant_invoices')
        .where('status', 'paid')
        .where('paid_at', '>=', startOfMonth)
        .sum('total_amount as total')
        .first(),
    ]);

    return {
      totalRevenue: parseFloat(totalRevenue?.total || '0'),
      monthlyRevenue: parseFloat(monthlyRevenue?.total || '0'),
    };
  }

  async getRevenueByMonth(months = 12): Promise<RevenueData[]> {
    const results = await this.db.knex('tenant_invoices')
      .select(
        this.db.knex.raw("to_char(paid_at, 'YYYY-MM') as month"),
      )
      .sum('total_amount as revenue')
      .count('distinct tenant_id as tenant_count')
      .where('status', 'paid')
      .whereNotNull('paid_at')
      .groupByRaw("to_char(paid_at, 'YYYY-MM')")
      .orderByRaw("to_char(paid_at, 'YYYY-MM') DESC")
      .limit(months);

    return results.map((r) => ({
      month: r.month,
      revenue: parseFloat(r.revenue || '0'),
      tenantCount: parseInt(r.tenant_count as string, 10),
    }));
  }

  async getTenantGrowth(months = 12): Promise<TenantGrowthData[]> {
    const results = await this.db.knex('tenants')
      .select(
        this.db.knex.raw("to_char(created_at, 'YYYY-MM') as month"),
      )
      .count('* as new_tenants')
      .groupByRaw("to_char(created_at, 'YYYY-MM')")
      .orderByRaw("to_char(created_at, 'YYYY-MM') DESC")
      .limit(months);

    // Calculate running total
    let runningTotal = 0;
    const reversed = results.reverse();

    return reversed.map((r: any) => {
      runningTotal += parseInt(r.new_tenants as string, 10);
      return {
        month: String(r.month),
        newTenants: parseInt(r.new_tenants as string, 10),
        totalTenants: runningTotal,
      };
    });
  }

  async getPlanDistribution(): Promise<{ planName: string; count: number; percentage: number }[]> {
    const results = await this.db.knex('tenants')
      .select('plans.name as plan_name')
      .count('tenants.id as count')
      .leftJoin('plans', 'tenants.plan_id', 'plans.id')
      .groupBy('plans.name');

    const total = results.reduce((sum, r) => sum + parseInt(r.count as string, 10), 0);

    return results.map((r) => ({
      planName: r.plan_name || 'No Plan',
      count: parseInt(r.count as string, 10),
      percentage: total > 0 ? (parseInt(r.count as string, 10) / total) * 100 : 0,
    }));
  }

  async getRecentActivity(limit = 20) {
    return this.db.knex('tenant_activity_logs')
      .select(
        'tenant_activity_logs.*',
        'users.name as user_name',
        'users.email as user_email',
        'tenants.name as tenant_name',
      )
      .leftJoin('users', 'tenant_activity_logs.user_id', 'users.id')
      .leftJoin('tenants', 'tenant_activity_logs.tenant_id', 'tenants.id')
      .orderBy('tenant_activity_logs.created_at', 'desc')
      .limit(limit);
  }
}
