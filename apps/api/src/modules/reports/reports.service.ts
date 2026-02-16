import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { getCurrentTenantId } from '../../common/context/tenant.context';
import { Knex } from 'knex';

@Injectable()
export class ReportsService {
  constructor(private readonly db: DatabaseService) {}

  private tenantQuery(table: string): Knex.QueryBuilder {
    const tenantId = getCurrentTenantId();
    const query = this.db.knex(table);
    if (tenantId) {
      return query.where(`${table}.tenant_id`, tenantId);
    }
    return query;
  }

  async getSalesSummary(startDate: string, endDate: string) {
    const [summary] = await this.tenantQuery('sales')
      .where('status', 'completed')
      .whereBetween('sale_date', [startDate, endDate])
      .select(
        this.db.knex.raw('COUNT(*) as sale_count'),
        this.db.knex.raw('COALESCE(SUM(subtotal), 0) as subtotal'),
        this.db.knex.raw('COALESCE(SUM(discount_amount), 0) as discount_total'),
        this.db.knex.raw('COALESCE(SUM(vat_total), 0) as vat_total'),
        this.db.knex.raw('COALESCE(SUM(grand_total), 0) as grand_total'),
      );

    const byPaymentMethod = await this.tenantQuery('sales')
      .where('status', 'completed')
      .whereBetween('sale_date', [startDate, endDate])
      .select('payment_method')
      .sum('grand_total as total')
      .count('id as count')
      .groupBy('payment_method');

    const dailySales = await this.tenantQuery('sales')
      .where('status', 'completed')
      .whereBetween('sale_date', [startDate, endDate])
      .select(this.db.knex.raw('DATE(sale_date) as date'))
      .sum('grand_total as total')
      .count('id as count')
      .groupBy(this.db.knex.raw('DATE(sale_date)'))
      .orderBy('date');

    return { summary, byPaymentMethod, dailySales };
  }

  async getDebtOverview() {
    const customers = await this.tenantQuery('customers')
      .where('is_active', true)
      .whereNot('balance', 0)
      .orderBy('balance', 'asc')
      .select('id', 'name', 'phone', 'balance');

    const [totals] = await this.tenantQuery('customers')
      .where('is_active', true)
      .select(
        this.db.knex.raw('COALESCE(SUM(CASE WHEN balance < 0 THEN balance ELSE 0 END), 0) as total_debt'),
        this.db.knex.raw('COALESCE(SUM(CASE WHEN balance > 0 THEN balance ELSE 0 END), 0) as total_credit'),
      );

    const t = totals as any;
    return {
      customers,
      totalDebt: Math.abs(parseFloat(t?.total_debt || '0')),
      totalCredit: parseFloat(t?.total_credit || '0'),
    };
  }

  async getVatReport(startDate: string, endDate: string) {
    const tenantId = getCurrentTenantId();

    let salesVatQuery = this.db.knex('sale_items')
      .join('sales', 'sale_items.sale_id', 'sales.id')
      .where('sales.status', 'completed')
      .whereBetween('sales.sale_date', [startDate, endDate]);
    if (tenantId) salesVatQuery = salesVatQuery.where('sales.tenant_id', tenantId);

    const salesVat = await salesVatQuery
      .select('sale_items.vat_rate')
      .sum('sale_items.vat_amount as vat_amount')
      .sum('sale_items.line_total as total')
      .groupBy('sale_items.vat_rate');

    let returnsVatQuery = this.db.knex('return_items')
      .join('returns', 'return_items.return_id', 'returns.id')
      .where('returns.status', 'completed')
      .whereBetween('returns.return_date', [startDate, endDate]);
    if (tenantId) returnsVatQuery = returnsVatQuery.where('returns.tenant_id', tenantId);

    const returnsVat = await returnsVatQuery
      .select(this.db.knex.raw('0 as vat_rate'))
      .sum('return_items.vat_amount as vat_amount')
      .groupBy(this.db.knex.raw('1'));

    return { salesVat, returnsVat };
  }

  async getProfitLoss(startDate: string, endDate: string) {
    const tenantId = getCurrentTenantId();

    const [salesTotal] = await this.tenantQuery('sales')
      .where('status', 'completed')
      .whereBetween('sale_date', [startDate, endDate])
      .sum('grand_total as revenue');

    let costQuery = this.db.knex('sale_items')
      .join('sales', 'sale_items.sale_id', 'sales.id')
      .join('products', 'sale_items.product_id', 'products.id')
      .where('sales.status', 'completed')
      .whereBetween('sales.sale_date', [startDate, endDate]);
    if (tenantId) costQuery = costQuery.where('sales.tenant_id', tenantId);

    const [costOfGoods] = await costQuery
      .select(this.db.knex.raw('COALESCE(SUM(sale_items.quantity * products.purchase_price), 0) as cost'));

    const [expensesTotal] = await this.tenantQuery('expenses')
      .whereBetween('expense_date', [startDate, endDate])
      .sum('amount as total');

    const [returnsTotal] = await this.tenantQuery('returns')
      .where('status', 'completed')
      .whereBetween('return_date', [startDate, endDate])
      .sum('total_amount as total');

    const revenue = parseFloat((salesTotal as any)?.revenue || '0');
    const cost = parseFloat((costOfGoods as any)?.cost || '0');
    const expenses = parseFloat(expensesTotal?.total || '0');
    const returns = parseFloat(returnsTotal?.total || '0');
    const grossProfit = revenue - cost - returns;
    const netProfit = grossProfit - expenses;

    return { revenue, costOfGoods: cost, returns, grossProfit, expenses, netProfit };
  }

  async getTopProducts(startDate: string, endDate: string, limit: number = 10) {
    const tenantId = getCurrentTenantId();

    let query = this.db.knex('sale_items')
      .join('sales', 'sale_items.sale_id', 'sales.id')
      .join('products', 'sale_items.product_id', 'products.id')
      .where('sales.status', 'completed')
      .whereBetween('sales.sale_date', [startDate, endDate]);
    if (tenantId) query = query.where('sales.tenant_id', tenantId);

    return query
      .select('products.id', 'products.name')
      .sum('sale_items.quantity as total_quantity')
      .sum('sale_items.line_total as total_revenue')
      .groupBy('products.id', 'products.name')
      .orderBy('total_quantity', 'desc')
      .limit(limit);
  }

  async getTopCustomers(startDate: string, endDate: string, limit: number = 10) {
    return this.tenantQuery('sales')
      .join('customers', 'sales.customer_id', 'customers.id')
      .where('sales.status', 'completed')
      .whereBetween('sales.sale_date', [startDate, endDate])
      .select('customers.id', 'customers.name', 'customers.phone')
      .sum('sales.grand_total as total_amount')
      .count('sales.id as sale_count')
      .groupBy('customers.id', 'customers.name', 'customers.phone')
      .orderBy('total_amount', 'desc')
      .limit(limit);
  }

  async getUpcomingPayments(days: number = 30) {
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return this.tenantQuery('sales')
      .leftJoin('customers', 'sales.customer_id', 'customers.id')
      .where('sales.status', 'completed')
      .where('sales.payment_method', 'veresiye')
      .whereNotNull('sales.due_date')
      .whereBetween('sales.due_date', [today, futureDate])
      .select(
        'sales.id',
        'sales.invoice_number',
        'sales.grand_total',
        'sales.due_date',
        'sales.sale_date',
        'customers.name as customer_name',
        'customers.phone as customer_phone'
      )
      .orderBy('sales.due_date', 'asc');
  }

  async getOverduePayments() {
    const today = new Date().toISOString().split('T')[0];

    const overdueList = await this.tenantQuery('sales')
      .leftJoin('customers', 'sales.customer_id', 'customers.id')
      .where('sales.status', 'completed')
      .where('sales.payment_method', 'veresiye')
      .whereNotNull('sales.due_date')
      .where('sales.due_date', '<', today)
      .select(
        'sales.id',
        'sales.invoice_number',
        'sales.grand_total',
        'sales.due_date',
        'sales.sale_date',
        'customers.id as customer_id',
        'customers.name as customer_name',
        'customers.phone as customer_phone',
        this.db.knex.raw(`(CURRENT_DATE - DATE(sales.due_date)) as days_overdue`)
      )
      .orderBy('sales.due_date', 'asc');

    const [totals] = await this.tenantQuery('sales')
      .where('status', 'completed')
      .where('payment_method', 'veresiye')
      .whereNotNull('due_date')
      .where('due_date', '<', today)
      .select(
        this.db.knex.raw('COUNT(*) as count'),
        this.db.knex.raw('COALESCE(SUM(grand_total), 0) as total')
      );

    return {
      overdueList,
      totalCount: parseInt((totals as any)?.count || '0'),
      totalAmount: parseFloat((totals as any)?.total || '0'),
    };
  }

  async getStockReport() {
    const products = await this.tenantQuery('products')
      .where('is_active', true)
      .select(
        'id',
        'name',
        'barcode',
        'stock_quantity',
        'min_stock_level',
        'purchase_price',
        'sale_price'
      )
      .orderBy('stock_quantity', 'asc');

    const lowStock = products.filter(p => p.stock_quantity <= p.min_stock_level);
    const outOfStock = products.filter(p => p.stock_quantity === 0);
    const totalStockValue = products.reduce((sum, p) => sum + (p.stock_quantity * p.purchase_price), 0);
    const totalSaleValue = products.reduce((sum, p) => sum + (p.stock_quantity * p.sale_price), 0);

    return {
      products,
      summary: {
        totalProducts: products.length,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        totalStockValue,
        totalSaleValue,
        potentialProfit: totalSaleValue - totalStockValue,
      },
    };
  }

  async getReturnsReport(startDate: string, endDate: string) {
    const tenantId = getCurrentTenantId();

    const returns = await this.tenantQuery('returns')
      .leftJoin('customers', 'returns.customer_id', 'customers.id')
      .where('returns.status', 'completed')
      .whereBetween('returns.return_date', [startDate, endDate])
      .select(
        'returns.id',
        'returns.return_number',
        'returns.return_date',
        'returns.total_amount',
        'returns.reason',
        'customers.name as customer_name'
      )
      .orderBy('returns.return_date', 'desc');

    const [summary] = await this.tenantQuery('returns')
      .where('status', 'completed')
      .whereBetween('return_date', [startDate, endDate])
      .select(
        this.db.knex.raw('COUNT(*) as count'),
        this.db.knex.raw('COALESCE(SUM(total_amount), 0) as total')
      );

    const byReason = await this.tenantQuery('returns')
      .where('status', 'completed')
      .whereBetween('return_date', [startDate, endDate])
      .select('reason')
      .count('id as count')
      .sum('total_amount as total')
      .groupBy('reason');

    let topReturnedQuery = this.db.knex('return_items')
      .join('returns', 'return_items.return_id', 'returns.id')
      .join('products', 'return_items.product_id', 'products.id')
      .where('returns.status', 'completed')
      .whereBetween('returns.return_date', [startDate, endDate]);
    if (tenantId) topReturnedQuery = topReturnedQuery.where('returns.tenant_id', tenantId);

    const topReturnedProducts = await topReturnedQuery
      .select('products.id', 'products.name')
      .sum('return_items.quantity as total_quantity')
      .sum('return_items.line_total as total_amount')
      .groupBy('products.id', 'products.name')
      .orderBy('total_quantity', 'desc')
      .limit(10);

    return {
      returns,
      summary: {
        count: parseInt((summary as any)?.count || '0'),
        total: parseFloat((summary as any)?.total || '0'),
      },
      byReason,
      topReturnedProducts,
    };
  }

  async getExpensesByCategory(startDate: string, endDate: string) {
    const byCategory = await this.tenantQuery('expenses')
      .whereBetween('expense_date', [startDate, endDate])
      .select('category')
      .sum('amount as total')
      .count('id as count')
      .groupBy('category')
      .orderBy('total', 'desc');

    const [totals] = await this.tenantQuery('expenses')
      .whereBetween('expense_date', [startDate, endDate])
      .select(
        this.db.knex.raw('COUNT(*) as count'),
        this.db.knex.raw('COALESCE(SUM(amount), 0) as total')
      );

    const monthlyTrend = await this.tenantQuery('expenses')
      .whereBetween('expense_date', [startDate, endDate])
      .select(this.db.knex.raw("TO_CHAR(expense_date, 'YYYY-MM') as month"))
      .sum('amount as total')
      .groupBy(this.db.knex.raw("TO_CHAR(expense_date, 'YYYY-MM')"))
      .orderBy('month');

    return {
      byCategory,
      summary: {
        count: parseInt((totals as any)?.count || '0'),
        total: parseFloat((totals as any)?.total || '0'),
      },
      monthlyTrend,
    };
  }
}
