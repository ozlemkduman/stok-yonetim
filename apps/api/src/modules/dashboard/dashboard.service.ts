import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { Knex } from 'knex';

@Injectable()
export class DashboardService {
  constructor(private readonly db: DatabaseService) {}

  private tenantQuery(table: string, tenantId?: string | null): Knex.QueryBuilder {
    const query = this.db.knex(table);
    if (tenantId) {
      return query.where(`${table}.tenant_id`, tenantId);
    }
    return query;
  }

  async getSummary(tenantId?: string | null) {
    const today = new Date().toISOString().split('T')[0];

    const [
      todaySales,
      totalCustomers,
      totalProducts,
      lowStockCount,
      totalDebt,
      totalCredit,
      monthlyExpenses,
    ] = await Promise.all([
      this.tenantQuery('sales', tenantId)
        .where('status', 'completed')
        .whereRaw('DATE(sale_date) = ?', [today])
        .select(this.db.knex.raw('COUNT(*) as count, COALESCE(SUM(grand_total), 0) as total'))
        .first(),

      this.tenantQuery('customers', tenantId).where('is_active', true).count('id as count').first(),

      this.tenantQuery('products', tenantId).where('is_active', true).count('id as count').first(),

      this.tenantQuery('products', tenantId)
        .where('is_active', true)
        .whereRaw('stock_quantity <= min_stock_level')
        .count('id as count')
        .first(),

      this.tenantQuery('customers', tenantId)
        .where('balance', '<', 0)
        .sum('balance as total')
        .first(),

      this.tenantQuery('customers', tenantId)
        .where('balance', '>', 0)
        .sum('balance as total')
        .first(),

      this.tenantQuery('expenses', tenantId)
        .whereRaw("expense_date >= DATE_TRUNC('month', CURRENT_DATE)")
        .sum('amount as total')
        .first(),
    ]);

    const sales = todaySales as any;
    return {
      todaySales: {
        count: parseInt(sales?.count || '0', 10),
        total: parseFloat(sales?.total || '0'),
      },
      totalCustomers: parseInt(totalCustomers?.count as string || '0', 10),
      totalProducts: parseInt(totalProducts?.count as string || '0', 10),
      lowStockCount: parseInt(lowStockCount?.count as string || '0', 10),
      totalDebt: Math.abs(parseFloat(totalDebt?.total || '0')),
      totalCredit: parseFloat(totalCredit?.total || '0'),
      monthlyExpenses: parseFloat(monthlyExpenses?.total || '0'),
    };
  }

  async getRecentSales(limit: number = 5, tenantId?: string | null) {
    return this.tenantQuery('sales', tenantId)
      .leftJoin('customers', 'sales.customer_id', 'customers.id')
      .select('sales.*', 'customers.name as customer_name')
      .where('sales.status', 'completed')
      .orderBy('sales.sale_date', 'desc')
      .limit(limit);
  }

  async getLowStockProducts(limit: number = 5, tenantId?: string | null) {
    return this.tenantQuery('products', tenantId)
      .where('is_active', true)
      .whereRaw('stock_quantity <= min_stock_level')
      .orderBy('stock_quantity', 'asc')
      .limit(limit);
  }

  async getTopCustomersWithDebt(limit: number = 5, tenantId?: string | null) {
    return this.tenantQuery('customers', tenantId)
      .where('is_active', true)
      .where('balance', '<', 0)
      .orderBy('balance', 'asc')
      .limit(limit);
  }
}
