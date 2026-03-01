import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { Knex } from 'knex';

@Injectable()
export class ReportsService {
  constructor(private readonly db: DatabaseService) {}

  private tenantQuery(table: string, tenantId?: string | null): Knex.QueryBuilder {
    const query = this.db.knex(table);
    if (tenantId) {
      return query.where(`${table}.tenant_id`, tenantId);
    }
    return query;
  }

  async getSalesSummary(startDate: string, endDate: string, tenantId?: string | null) {
    const [summary] = await this.tenantQuery('sales', tenantId)
      .where('status', 'completed')
      .whereBetween('sale_date', [startDate, endDate])
      .select(
        this.db.knex.raw('COUNT(*) as sale_count'),
        this.db.knex.raw('COALESCE(SUM(subtotal), 0) as subtotal'),
        this.db.knex.raw('COALESCE(SUM(discount_amount), 0) as discount_total'),
        this.db.knex.raw('COALESCE(SUM(vat_total), 0) as vat_total'),
        this.db.knex.raw('COALESCE(SUM(grand_total), 0) as grand_total'),
      );

    const byPaymentMethod = await this.tenantQuery('sales', tenantId)
      .where('status', 'completed')
      .whereBetween('sale_date', [startDate, endDate])
      .select('payment_method')
      .sum('grand_total as total')
      .count('id as count')
      .groupBy('payment_method');

    const dailySales = await this.tenantQuery('sales', tenantId)
      .where('status', 'completed')
      .whereBetween('sale_date', [startDate, endDate])
      .select(this.db.knex.raw('DATE(sale_date) as date'))
      .sum('grand_total as total')
      .count('id as count')
      .groupBy(this.db.knex.raw('DATE(sale_date)'))
      .orderBy('date');

    return { summary, byPaymentMethod, dailySales };
  }

  async getDebtOverview(tenantId?: string | null) {
    const customers = await this.tenantQuery('customers', tenantId)
      .where('is_active', true)
      .whereNot('balance', 0)
      .orderBy('balance', 'asc')
      .select('id', 'name', 'phone', 'balance');

    const [totals] = await this.tenantQuery('customers', tenantId)
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

  async getVatReport(startDate: string, endDate: string, tenantId?: string | null) {
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

  async getProfitLoss(startDate: string, endDate: string, tenantId?: string | null) {
    const [salesTotal] = await this.tenantQuery('sales', tenantId)
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

    const [expensesTotal] = await this.tenantQuery('expenses', tenantId)
      .whereBetween('expense_date', [startDate, endDate])
      .sum('amount as total');

    const [returnsTotal] = await this.tenantQuery('returns', tenantId)
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

  async getTopProducts(startDate: string, endDate: string, limit: number = 10, tenantId?: string | null) {
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

  async getTopCustomers(startDate: string, endDate: string, limit: number = 10, tenantId?: string | null) {
    return this.tenantQuery('sales', tenantId)
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

  async getUpcomingPayments(days: number = 30, tenantId?: string | null) {
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    return this.tenantQuery('sales', tenantId)
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

  async getOverduePayments(tenantId?: string | null) {
    const today = new Date().toISOString().split('T')[0];

    const overdueList = await this.tenantQuery('sales', tenantId)
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

    const [totals] = await this.tenantQuery('sales', tenantId)
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

  async getStockReport(tenantId?: string | null) {
    const products = await this.tenantQuery('products', tenantId)
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

  async getReturnsReport(startDate: string, endDate: string, tenantId?: string | null) {
    const returns = await this.tenantQuery('returns', tenantId)
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

    const [summary] = await this.tenantQuery('returns', tenantId)
      .where('status', 'completed')
      .whereBetween('return_date', [startDate, endDate])
      .select(
        this.db.knex.raw('COUNT(*) as count'),
        this.db.knex.raw('COALESCE(SUM(total_amount), 0) as total')
      );

    const byReason = await this.tenantQuery('returns', tenantId)
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

  async getCustomerSales(startDate: string, endDate: string, tenantId?: string | null) {
    let query = this.db.knex('sales')
      .join('customers', 'sales.customer_id', 'customers.id')
      .where('sales.status', 'completed')
      .whereBetween('sales.sale_date', [startDate, endDate]);
    if (tenantId) query = query.where('sales.tenant_id', tenantId);

    const sales = await query
      .select(
        'sales.id',
        'sales.invoice_number',
        'sales.sale_date',
        'sales.grand_total',
        'sales.payment_method',
        'customers.id as customer_id',
        'customers.name as customer_name',
        'customers.phone as customer_phone',
      )
      .orderBy('customers.name', 'asc')
      .orderBy('sales.sale_date', 'desc');

    // Her satis icin urun detaylarini getir
    const saleIds = sales.map((s: any) => s.id);
    let items: any[] = [];
    if (saleIds.length > 0) {
      let itemsQuery = this.db.knex('sale_items')
        .join('products', 'sale_items.product_id', 'products.id')
        .whereIn('sale_items.sale_id', saleIds);

      items = await itemsQuery
        .select(
          'sale_items.sale_id',
          'products.name as product_name',
          'sale_items.quantity',
          'sale_items.unit_price',
          'sale_items.line_total',
        );
    }

    // Satislara urun detaylarini ekle
    const salesWithItems = sales.map((sale: any) => ({
      ...sale,
      items: items.filter((item: any) => item.sale_id === sale.id),
    }));

    return salesWithItems;
  }

  async getCustomerProductPurchases(startDate: string, endDate: string, tenantId?: string | null) {
    let query = this.db.knex('sale_items')
      .join('sales', 'sale_items.sale_id', 'sales.id')
      .join('products', 'sale_items.product_id', 'products.id')
      .join('customers', 'sales.customer_id', 'customers.id')
      .where('sales.status', 'completed')
      .whereBetween('sales.sale_date', [startDate, endDate]);
    if (tenantId) query = query.where('sales.tenant_id', tenantId);

    return query
      .select(
        'customers.id as customer_id',
        'customers.name as customer_name',
        'products.id as product_id',
        'products.name as product_name',
      )
      .sum('sale_items.quantity as total_quantity')
      .sum('sale_items.line_total as total_amount')
      .groupBy('customers.id', 'customers.name', 'products.id', 'products.name')
      .orderBy('customers.name', 'asc')
      .orderByRaw('SUM(sale_items.quantity) DESC');
  }

  async getEmployeePerformance(startDate: string, endDate: string, tenantId?: string | null, userId?: string, userRole?: string) {
    const isAdmin = userRole === 'super_admin' || userRole === 'tenant_admin';

    let usersQuery = this.db.knex('users')
      .leftJoin('sales', 'users.id', 'sales.created_by')
      .where('users.status', 'active');

    if (tenantId) {
      usersQuery = usersQuery.where('users.tenant_id', tenantId);
    }

    if (!isAdmin && userId) {
      usersQuery = usersQuery.where('users.id', userId);
    }

    const employees = await usersQuery
      .select(
        'users.id',
        'users.name',
        'users.email',
        'users.role',
      )
      .count({ sale_count: this.db.knex.raw("CASE WHEN sales.status = 'completed' AND sales.sale_date BETWEEN ? AND ? THEN 1 END", [startDate, endDate]) })
      .sum({ total_revenue: this.db.knex.raw("CASE WHEN sales.status = 'completed' AND sales.sale_date BETWEEN ? AND ? THEN sales.grand_total ELSE 0 END", [startDate, endDate]) })
      .count({ invoice_count: this.db.knex.raw("CASE WHEN sales.invoice_issued = true AND sales.sale_date BETWEEN ? AND ? THEN 1 END", [startDate, endDate]) })
      .count({ cancelled_count: this.db.knex.raw("CASE WHEN sales.status = 'cancelled' AND sales.sale_date BETWEEN ? AND ? THEN 1 END", [startDate, endDate]) })
      .groupBy('users.id', 'users.name', 'users.email', 'users.role')
      .orderByRaw("COALESCE(SUM(CASE WHEN sales.status = 'completed' AND sales.sale_date BETWEEN ? AND ? THEN sales.grand_total ELSE 0 END), 0) DESC", [startDate, endDate]);

    const formatted = employees.map((e: any) => ({
      id: e.id,
      name: e.name,
      email: e.email,
      role: e.role,
      saleCount: parseInt(e.sale_count || '0'),
      totalRevenue: parseFloat(e.total_revenue || '0'),
      invoiceCount: parseInt(e.invoice_count || '0'),
      cancelledCount: parseInt(e.cancelled_count || '0'),
      avgSale: parseInt(e.sale_count || '0') > 0
        ? parseFloat(e.total_revenue || '0') / parseInt(e.sale_count || '0')
        : 0,
    }));

    const totalSales = formatted.reduce((s: number, e: any) => s + e.saleCount, 0);
    const totalRevenue = formatted.reduce((s: number, e: any) => s + e.totalRevenue, 0);

    return {
      employees: formatted,
      summary: {
        totalSales,
        totalRevenue,
        avgPerEmployee: formatted.length > 0 ? totalRevenue / formatted.length : 0,
      },
    };
  }

  async getExpensesByCategory(startDate: string, endDate: string, tenantId?: string | null) {
    const byCategory = await this.tenantQuery('expenses', tenantId)
      .whereBetween('expense_date', [startDate, endDate])
      .select('category')
      .sum('amount as total')
      .count('id as count')
      .groupBy('category')
      .orderBy('total', 'desc');

    const [totals] = await this.tenantQuery('expenses', tenantId)
      .whereBetween('expense_date', [startDate, endDate])
      .select(
        this.db.knex.raw('COUNT(*) as count'),
        this.db.knex.raw('COALESCE(SUM(amount), 0) as total')
      );

    const monthlyTrend = await this.tenantQuery('expenses', tenantId)
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

  async getRenewals(tenantId?: string | null) {
    const renewals = await this.tenantQuery('sales', tenantId)
      .leftJoin('customers', 'sales.customer_id', 'customers.id')
      .where('sales.has_renewal', true)
      .where('sales.status', 'completed')
      .whereNotNull('sales.renewal_date')
      .select(
        'sales.id',
        'sales.invoice_number',
        'sales.sale_date',
        'sales.renewal_date',
        'sales.reminder_days_before',
        'sales.reminder_note',
        'sales.grand_total',
        'customers.id as customer_id',
        'customers.name as customer_name',
        'customers.phone as customer_phone',
        'customers.email as customer_email',
        this.db.knex.raw('(DATE(sales.renewal_date) - CURRENT_DATE) as days_remaining'),
      )
      .orderBy('sales.renewal_date', 'asc');

    const saleIds = renewals.map((r: any) => r.id);
    const productNames: Record<string, string[]> = {};

    if (saleIds.length > 0) {
      let itemsQuery = this.db.knex('sale_items')
        .join('products', 'sale_items.product_id', 'products.id')
        .whereIn('sale_items.sale_id', saleIds)
        .select('sale_items.sale_id', 'products.name as product_name');
      if (tenantId) {
        itemsQuery = itemsQuery.where('products.tenant_id', tenantId);
      }
      const items = await itemsQuery;
      for (const item of items) {
        if (!productNames[item.sale_id]) productNames[item.sale_id] = [];
        productNames[item.sale_id].push(item.product_name);
      }
    }

    const enriched = renewals.map((r: any) => ({
      ...r,
      days_remaining: parseInt(r.days_remaining || '0', 10),
      product_names: productNames[r.id] || [],
    }));

    const expired = enriched.filter((r: any) => r.days_remaining < 0);
    const urgent = enriched.filter((r: any) => r.days_remaining >= 0 && r.days_remaining <= 7);
    const upcoming = enriched.filter((r: any) => r.days_remaining > 7 && r.days_remaining <= 30);
    const future = enriched.filter((r: any) => r.days_remaining > 30);

    return {
      renewals: enriched,
      summary: {
        total: enriched.length,
        expiredCount: expired.length,
        urgentCount: urgent.length,
        upcomingCount: upcoming.length,
        futureCount: future.length,
      },
    };
  }
}
