import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { Knex } from 'knex';
import { getCurrentTenantId } from '../../common/context/tenant.context';

@Injectable()
export class ReportsService {
  constructor(private readonly db: DatabaseService) {}

  // Reports use the same tenant context as the rest of the app (TenantInterceptor +
  // AsyncLocalStorage). The explicit tenantId argument is kept for backwards
  // compatibility with the controller but is overridden by the context when present.
  private tenantQuery(table: string, tenantId?: string | null): Knex.QueryBuilder {
    const effectiveTenantId = getCurrentTenantId() ?? tenantId;
    const query = this.db.knex(table);
    if (effectiveTenantId) {
      return query.where(`${table}.tenant_id`, effectiveTenantId);
    }
    return query;
  }

  // endDate'in TÜM gününü dahil et: "2026-06-02" → "2026-06-02 23:59:59.999"
  // Aksi halde timestamp kolonlarda o günün saatleri filtre dışı kalır.
  private toEndOfDay(endDate: string): string {
    return endDate.includes(' ') ? endDate : `${endDate} 23:59:59.999`;
  }

  async getSalesSummary(startDate: string, endDate: string, tenantId?: string | null) {
    const [rawSummary] = await this.tenantQuery('sales', tenantId)
      .where('status', 'completed')
      .whereBetween('sale_date', [startDate, this.toEndOfDay(endDate)])
      .select(
        this.db.knex.raw('COUNT(*) as sale_count'),
        this.db.knex.raw('COALESCE(SUM(subtotal), 0) as subtotal'),
        this.db.knex.raw('COALESCE(SUM(discount_amount), 0) as discount_total'),
        this.db.knex.raw('COALESCE(SUM(vat_total), 0) as vat_total'),
        this.db.knex.raw('COALESCE(SUM(grand_total), 0) as grand_total'),
      );

    const r = rawSummary as any;
    const summary = {
      sale_count: parseInt(r?.sale_count || '0', 10),
      subtotal: parseFloat(r?.subtotal || '0'),
      discount_total: parseFloat(r?.discount_total || '0'),
      vat_total: parseFloat(r?.vat_total || '0'),
      grand_total: parseFloat(r?.grand_total || '0'),
    };

    const byPaymentMethodRaw = await this.tenantQuery('sales', tenantId)
      .where('status', 'completed')
      .whereBetween('sale_date', [startDate, this.toEndOfDay(endDate)])
      .select('payment_method')
      .sum('grand_total as total')
      .count('id as count')
      .groupBy('payment_method');
    const byPaymentMethod = byPaymentMethodRaw.map((row: any) => ({
      payment_method: row.payment_method,
      total: parseFloat(row.total || '0'),
      count: parseInt(row.count || '0', 10),
    }));

    const dailySalesRaw = await this.tenantQuery('sales', tenantId)
      .where('status', 'completed')
      .whereBetween('sale_date', [startDate, this.toEndOfDay(endDate)])
      .select(this.db.knex.raw('DATE(sale_date) as date'))
      .sum('grand_total as total')
      .count('id as count')
      .groupBy(this.db.knex.raw('DATE(sale_date)'))
      .orderBy('date');
    const dailySales = dailySalesRaw.map((row: any) => ({
      date: row.date,
      total: parseFloat(row.total || '0'),
      count: parseInt(row.count || '0', 10),
    }));

    return { summary, byPaymentMethod, dailySales };
  }

  async getDebtOverview(tenantId?: string | null) {
    const rawCustomers = await this.tenantQuery('customers', tenantId)
      .where('is_active', true)
      .whereNot('balance', 0)
      .orderBy('balance', 'asc')
      .select('id', 'name', 'phone', 'balance');
    const customers = rawCustomers.map((c: any) => ({
      ...c,
      balance: parseFloat(c.balance || '0'),
    }));

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
      .whereBetween('sales.sale_date', [startDate, this.toEndOfDay(endDate)]);
    if (tenantId) salesVatQuery = salesVatQuery.where('sales.tenant_id', tenantId);

    const salesVat = await salesVatQuery
      .select('sale_items.vat_rate')
      .sum('sale_items.vat_amount as vat_amount')
      .sum('sale_items.line_total as total')
      .groupBy('sale_items.vat_rate');

    let returnsVatQuery = this.db.knex('return_items')
      .join('returns', 'return_items.return_id', 'returns.id')
      .where('returns.status', 'completed')
      .whereBetween('returns.return_date', [startDate, this.toEndOfDay(endDate)]);
    if (tenantId) returnsVatQuery = returnsVatQuery.where('returns.tenant_id', tenantId);

    const returnsVat = await returnsVatQuery
      .select(this.db.knex.raw('0 as vat_rate'))
      .sum('return_items.vat_amount as vat_amount')
      .groupBy(this.db.knex.raw('1'));

    return { salesVat, returnsVat };
  }

  async getProfitLoss(startDate: string, endDate: string, tenantId?: string | null) {
    // Net satış geliri (KDV hariç) = grand_total - vat_total
    // cost (alış fiyatı, KDV hariç) ile aynı zeminde karşılaştırmak için KDV'siz değerler kullanılır.
    const [salesTotal] = await this.tenantQuery('sales', tenantId)
      .where('status', 'completed')
      .whereBetween('sale_date', [startDate, this.toEndOfDay(endDate)])
      .select(this.db.knex.raw('COALESCE(SUM(grand_total - vat_total), 0) as revenue'));

    let costQuery = this.db.knex('sale_items')
      .join('sales', 'sale_items.sale_id', 'sales.id')
      .join('products', 'sale_items.product_id', 'products.id')
      .where('sales.status', 'completed')
      .whereBetween('sales.sale_date', [startDate, this.toEndOfDay(endDate)]);
    if (tenantId) costQuery = costQuery.where('sales.tenant_id', tenantId);

    const [costOfGoods] = await costQuery
      .select(this.db.knex.raw('COALESCE(SUM(sale_items.quantity * products.purchase_price), 0) as cost'));

    const [expensesTotal] = await this.tenantQuery('expenses', tenantId)
      .whereBetween('expense_date', [startDate, this.toEndOfDay(endDate)])
      .sum('amount as total');

    // İade net tutarı (KDV hariç) = total_amount - vat_total
    const [returnsTotal] = await this.tenantQuery('returns', tenantId)
      .where('status', 'completed')
      .whereBetween('return_date', [startDate, this.toEndOfDay(endDate)])
      .select(this.db.knex.raw('COALESCE(SUM(total_amount - vat_total), 0) as total'));

    const revenue = parseFloat((salesTotal as any)?.revenue || '0');
    const cost = parseFloat((costOfGoods as any)?.cost || '0');
    const expenses = parseFloat(expensesTotal?.total || '0');
    const returns = parseFloat((returnsTotal as any)?.total || '0');
    const grossProfit = revenue - cost - returns;
    const netProfit = grossProfit - expenses;

    return { revenue, costOfGoods: cost, returns, grossProfit, expenses, netProfit };
  }

  async getTopProducts(startDate: string, endDate: string, limit: number = 10, tenantId?: string | null) {
    let query = this.db.knex('sale_items')
      .join('sales', 'sale_items.sale_id', 'sales.id')
      .join('products', 'sale_items.product_id', 'products.id')
      .where('sales.status', 'completed')
      .whereBetween('sales.sale_date', [startDate, this.toEndOfDay(endDate)]);
    if (tenantId) query = query.where('sales.tenant_id', tenantId);

    const rows = await query
      .select('products.id', 'products.name')
      .sum('sale_items.quantity as total_quantity')
      .sum('sale_items.line_total as total_revenue')
      .groupBy('products.id', 'products.name')
      .orderBy('total_quantity', 'desc')
      .limit(limit);
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      total_quantity: parseFloat(r.total_quantity || '0'),
      total_revenue: parseFloat(r.total_revenue || '0'),
    }));
  }

  async getTopCustomers(startDate: string, endDate: string, limit: number = 10, tenantId?: string | null) {
    const rows = await this.tenantQuery('sales', tenantId)
      .join('customers', 'sales.customer_id', 'customers.id')
      .where('sales.status', 'completed')
      .whereBetween('sales.sale_date', [startDate, this.toEndOfDay(endDate)])
      .select('customers.id', 'customers.name', 'customers.phone')
      .sum('sales.grand_total as total_amount')
      .count('sales.id as sale_count')
      .groupBy('customers.id', 'customers.name', 'customers.phone')
      .orderBy('total_amount', 'desc')
      .limit(limit);
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      total_amount: parseFloat(r.total_amount || '0'),
      sale_count: parseInt(r.sale_count || '0', 10),
    }));
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
    const rawProducts = await this.tenantQuery('products', tenantId)
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

    const products = rawProducts.map((p: any) => ({
      ...p,
      stock_quantity: Number(p.stock_quantity) || 0,
      min_stock_level: Number(p.min_stock_level) || 0,
      purchase_price: Number(p.purchase_price) || 0,
      sale_price: Number(p.sale_price) || 0,
    }));

    const lowStock = products.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= p.min_stock_level);
    const outOfStock = products.filter((p) => p.stock_quantity === 0);
    const totalStockValue = products.reduce((sum, p) => sum + p.stock_quantity * p.purchase_price, 0);
    const totalSaleValue = products.reduce((sum, p) => sum + p.stock_quantity * p.sale_price, 0);

    return {
      products,
      summary: {
        totalProducts: products.length,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        totalStockValue: Math.round(totalStockValue * 100) / 100,
        totalSaleValue: Math.round(totalSaleValue * 100) / 100,
        potentialProfit: Math.round((totalSaleValue - totalStockValue) * 100) / 100,
      },
    };
  }

  async getReturnsReport(startDate: string, endDate: string, tenantId?: string | null) {
    const returns = await this.tenantQuery('returns', tenantId)
      .leftJoin('customers', 'returns.customer_id', 'customers.id')
      .where('returns.status', 'completed')
      .whereBetween('returns.return_date', [startDate, this.toEndOfDay(endDate)])
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
      .whereBetween('return_date', [startDate, this.toEndOfDay(endDate)])
      .select(
        this.db.knex.raw('COUNT(*) as count'),
        this.db.knex.raw('COALESCE(SUM(total_amount), 0) as total')
      );

    const byReason = await this.tenantQuery('returns', tenantId)
      .where('status', 'completed')
      .whereBetween('return_date', [startDate, this.toEndOfDay(endDate)])
      .select('reason')
      .count('id as count')
      .sum('total_amount as total')
      .groupBy('reason');

    let topReturnedQuery = this.db.knex('return_items')
      .join('returns', 'return_items.return_id', 'returns.id')
      .join('products', 'return_items.product_id', 'products.id')
      .where('returns.status', 'completed')
      .whereBetween('returns.return_date', [startDate, this.toEndOfDay(endDate)]);
    if (tenantId) topReturnedQuery = topReturnedQuery.where('returns.tenant_id', tenantId);

    const topReturnedRaw = await topReturnedQuery
      .select('products.id', 'products.name')
      .sum('return_items.quantity as total_quantity')
      .sum('return_items.line_total as total_amount')
      .groupBy('products.id', 'products.name')
      .orderBy('total_quantity', 'desc')
      .limit(10);

    const topReturnedProducts = topReturnedRaw.map((r: any) => ({
      id: r.id,
      name: r.name,
      total_quantity: parseFloat(r.total_quantity || '0'),
      total_amount: parseFloat(r.total_amount || '0'),
    }));

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
      .whereBetween('sales.sale_date', [startDate, this.toEndOfDay(endDate)]);
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
      .whereBetween('sales.sale_date', [startDate, this.toEndOfDay(endDate)]);
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
    // endDate'in tüm gününü dahil et (diğer raporlarla tutarlı olsun).
    const endTs = this.toEndOfDay(endDate);

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
      .count({ sale_count: this.db.knex.raw("CASE WHEN sales.status = 'completed' AND sales.sale_date BETWEEN ? AND ? THEN 1 END", [startDate, endTs]) })
      .sum({ total_revenue: this.db.knex.raw("CASE WHEN sales.status = 'completed' AND sales.sale_date BETWEEN ? AND ? THEN sales.grand_total ELSE 0 END", [startDate, endTs]) })
      .count({ invoice_count: this.db.knex.raw("CASE WHEN sales.invoice_issued = true AND sales.sale_date BETWEEN ? AND ? THEN 1 END", [startDate, endTs]) })
      .count({ cancelled_count: this.db.knex.raw("CASE WHEN sales.status = 'cancelled' AND sales.sale_date BETWEEN ? AND ? THEN 1 END", [startDate, endTs]) })
      .groupBy('users.id', 'users.name', 'users.email', 'users.role')
      .orderByRaw("COALESCE(SUM(CASE WHEN sales.status = 'completed' AND sales.sale_date BETWEEN ? AND ? THEN sales.grand_total ELSE 0 END), 0) DESC", [startDate, endTs]);

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
      .whereBetween('expense_date', [startDate, this.toEndOfDay(endDate)])
      .select('category')
      .sum('amount as total')
      .count('id as count')
      .groupBy('category')
      .orderBy('total', 'desc');

    const [totals] = await this.tenantQuery('expenses', tenantId)
      .whereBetween('expense_date', [startDate, this.toEndOfDay(endDate)])
      .select(
        this.db.knex.raw('COUNT(*) as count'),
        this.db.knex.raw('COALESCE(SUM(amount), 0) as total')
      );

    const monthlyTrend = await this.tenantQuery('expenses', tenantId)
      .whereBetween('expense_date', [startDate, this.toEndOfDay(endDate)])
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
        'customers.renewal_red_days',
        'customers.renewal_yellow_days',
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

    const enriched = renewals.map((r: any) => {
      const daysRemaining = parseInt(r.days_remaining || '0', 10);
      const redDays = r.renewal_red_days || 30;
      const yellowDays = r.renewal_yellow_days || 60;
      let renewalStatus: string;
      if (daysRemaining < 0) {
        renewalStatus = 'expired';
      } else if (daysRemaining <= redDays) {
        renewalStatus = 'red';
      } else if (daysRemaining <= yellowDays) {
        renewalStatus = 'yellow';
      } else {
        renewalStatus = 'green';
      }
      return {
        ...r,
        days_remaining: daysRemaining,
        product_names: productNames[r.id] || [],
        renewal_red_days: redDays,
        renewal_yellow_days: yellowDays,
        renewal_status: renewalStatus,
      };
    });

    const expired = enriched.filter((r: any) => r.renewal_status === 'expired');
    const urgent = enriched.filter((r: any) => r.renewal_status === 'red');
    const upcoming = enriched.filter((r: any) => r.renewal_status === 'yellow');
    const future = enriched.filter((r: any) => r.renewal_status === 'green');

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

  /**
   * Gün Sonu (Z) Raporu — belirli bir tarihte gerçekleşen tüm işlemlerin özeti.
   * Perakende standardı: günlük kasa kapanışı için kullanılır.
   *
   * - Satışlar (ödeme tipine göre kırılım, iptaller hariç)
   * - İptal edilen satışlar (sadece bilgi)
   * - İadeler
   * - Tahsilatlar (payments)
   * - Giderler
   * - Hesap hareketleri (gelir/gider/transfer)
   * - Hesapların güncel bakiyesi (snapshot)
   */
  async getEndOfDayReport(date: string, tenantId?: string | null) {
    const startOfDay = `${date} 00:00:00.000`;
    const endOfDay = `${date} 23:59:59.999`;
    const knex = this.db.knex;

    // 1) Satışlar — ödeme tipine göre
    const salesByMethodRaw = await this.tenantQuery('sales', tenantId)
      .where('status', 'completed')
      .whereBetween('sale_date', [startOfDay, endOfDay])
      .groupBy('payment_method')
      .select('payment_method')
      .sum('grand_total as total')
      .count('id as count');

    // 2) İptal edilen satışlar (info)
    const cancelledRows = await this.tenantQuery('sales', tenantId)
      .where('status', 'cancelled')
      .whereBetween('sale_date', [startOfDay, endOfDay])
      .select(
        knex.raw('COUNT(id)::int as count'),
        knex.raw('COALESCE(SUM(grand_total), 0) as total'),
      );

    // 3) İadeler
    const returnsRows = await this.tenantQuery('returns', tenantId)
      .where('status', 'completed')
      .whereBetween('return_date', [startOfDay, endOfDay])
      .select(
        knex.raw('COUNT(id)::int as count'),
        knex.raw('COALESCE(SUM(total_amount), 0) as total'),
      );

    // 4) Tahsilatlar
    const paymentsRows = await this.tenantQuery('payments', tenantId)
      .whereBetween('payment_date', [startOfDay, endOfDay])
      .select(
        knex.raw('COUNT(id)::int as count'),
        knex.raw('COALESCE(SUM(amount), 0) as total'),
      );

    // 5) Giderler — expenses.expense_date DATE tipinde
    const expensesRows = await this.tenantQuery('expenses', tenantId)
      .where('expense_date', date)
      .select(
        knex.raw('COUNT(id)::int as count'),
        knex.raw('COALESCE(SUM(amount), 0) as total'),
      );

    // 6) Hesap hareketleri — account_type × movement_type
    const accountMovementsRaw = await this.tenantQuery('account_movements', tenantId)
      .leftJoin('accounts', 'account_movements.account_id', 'accounts.id')
      .whereBetween('account_movements.movement_date', [startOfDay, endOfDay])
      .groupBy('accounts.account_type', 'account_movements.movement_type')
      .select(
        'accounts.account_type',
        'account_movements.movement_type',
        knex.raw('COUNT(account_movements.id)::int as count'),
        knex.raw('COALESCE(SUM(account_movements.amount), 0) as total'),
      );

    // 7) Hesap bakiyeleri snapshot
    const accountBalancesRaw = await this.tenantQuery('accounts', tenantId)
      .where('is_active', true)
      .orderBy('account_type', 'asc')
      .orderBy('is_default', 'desc')
      .orderBy('name', 'asc')
      .select('id', 'name', 'account_type', 'currency', 'current_balance', 'is_default');

    // Build response
    const byPaymentMethod: Record<string, { count: number; total: number }> = {};
    let salesTotal = 0;
    let salesCount = 0;
    for (const row of salesByMethodRaw as any[]) {
      const m = row.payment_method as string;
      const t = parseFloat(row.total) || 0;
      const c = parseInt(row.count, 10) || 0;
      byPaymentMethod[m] = { count: c, total: t };
      salesTotal += t;
      salesCount += c;
    }

    const cancelledRow = (cancelledRows[0] as any) || {};
    const returnsRow = (returnsRows[0] as any) || {};
    const paymentsRow = (paymentsRows[0] as any) || {};
    const expensesRow = (expensesRows[0] as any) || {};

    const returnsTotal = parseFloat(returnsRow.total || '0');
    const expensesTotal = parseFloat(expensesRow.total || '0');
    const paymentsTotal = parseFloat(paymentsRow.total || '0');

    let cashIn = 0;
    let cashOut = 0;
    const accountMovements = (accountMovementsRaw as any[]).map((m) => {
      const total = parseFloat(m.total) || 0;
      const count = parseInt(m.count, 10) || 0;
      if (m.movement_type === 'gelir') cashIn += total;
      else if (m.movement_type === 'gider') cashOut += total;
      return { account_type: m.account_type, movement_type: m.movement_type, count, total };
    });

    const accountBalances = (accountBalancesRaw as any[]).map((a) => ({
      id: a.id,
      name: a.name,
      account_type: a.account_type,
      currency: a.currency,
      is_default: !!a.is_default,
      current_balance: parseFloat(a.current_balance) || 0,
    }));

    const totalAccountBalance = accountBalances.reduce((s, a) => s + a.current_balance, 0);

    return {
      date,
      sales: { count: salesCount, total: salesTotal, byPaymentMethod },
      cancelledSales: {
        count: parseInt(cancelledRow.count || '0', 10),
        total: parseFloat(cancelledRow.total || '0'),
      },
      returns: { count: parseInt(returnsRow.count || '0', 10), total: returnsTotal },
      payments: { count: parseInt(paymentsRow.count || '0', 10), total: paymentsTotal },
      expenses: { count: parseInt(expensesRow.count || '0', 10), total: expensesTotal },
      netSales: salesTotal - returnsTotal,
      cashFlow: { in: cashIn, out: cashOut, net: cashIn - cashOut },
      accountMovements,
      accountBalances,
      totalAccountBalance,
    };
  }

  /**
   * Cari Yaşlandırma (Aging Report) — veresiye satışları vade tarihine göre
   * 4 bucket'a böler: 0-30, 30-60, 60-90, 90+ gün.
   *
   * Notlar:
   * - Sadece COMPLETED veresiye satışlar dahil
   * - Vadesi gelmemiş (due_date > today) satışlar dahil EDİLMEZ
   * - Kısmi tahsilat takip edilmiyor — her satışın full grand_total'u bucket'a düşer
   *   (gerçek payment allocation için ileride payments tablosu join'lenebilir)
   */
  async getAgingReport(tenantId?: string | null) {
    const knex = this.db.knex;
    const todayStr = new Date().toISOString().split('T')[0];

    const rows = await this.tenantQuery('sales', tenantId)
      .leftJoin('customers', 'sales.customer_id', 'customers.id')
      .where('sales.status', 'completed')
      .where('sales.payment_method', 'veresiye')
      .where('sales.due_date', '<=', todayStr)
      .whereNotNull('sales.due_date')
      .select(
        'sales.id as sale_id',
        'sales.invoice_number',
        'sales.sale_date',
        'sales.due_date',
        'sales.grand_total',
        'sales.customer_id',
        'customers.name as customer_name',
        knex.raw('(CURRENT_DATE - sales.due_date::date)::int as days_overdue'),
      )
      .orderBy('sales.due_date', 'asc');

    const customerMap: Record<string, any> = {};
    for (const sale of rows as any[]) {
      const customerId = sale.customer_id || '__unknown__';
      const daysOverdue = parseInt(sale.days_overdue, 10) || 0;
      const amount = parseFloat(sale.grand_total) || 0;

      let bucket: '0_30' | '30_60' | '60_90' | '90_plus';
      if (daysOverdue <= 30) bucket = '0_30';
      else if (daysOverdue <= 60) bucket = '30_60';
      else if (daysOverdue <= 90) bucket = '60_90';
      else bucket = '90_plus';

      if (!customerMap[customerId]) {
        customerMap[customerId] = {
          customer_id: sale.customer_id,
          customer_name: sale.customer_name || 'Müşterisiz',
          buckets: { '0_30': 0, '30_60': 0, '60_90': 0, '90_plus': 0 },
          total: 0,
          oldest_days_overdue: 0,
          sale_count: 0,
        };
      }
      customerMap[customerId].buckets[bucket] += amount;
      customerMap[customerId].total += amount;
      customerMap[customerId].sale_count += 1;
      if (daysOverdue > customerMap[customerId].oldest_days_overdue) {
        customerMap[customerId].oldest_days_overdue = daysOverdue;
      }
    }

    const customers = Object.values(customerMap).sort((a: any, b: any) => b.total - a.total);

    const summary = customers.reduce(
      (acc: any, c: any) => {
        acc['0_30'] += c.buckets['0_30'];
        acc['30_60'] += c.buckets['30_60'];
        acc['60_90'] += c.buckets['60_90'];
        acc['90_plus'] += c.buckets['90_plus'];
        acc.total += c.total;
        return acc;
      },
      { '0_30': 0, '30_60': 0, '60_90': 0, '90_plus': 0, total: 0, customer_count: customers.length },
    );

    return { customers, summary };
  }

  /**
   * Ürün Bazlı Kârlılık — belirli aralıkta her ürünün kâr/zarar performansı.
   *
   * COGS hesabı: SUM(sale_items.quantity * products.purchase_price). NOT:
   * products.purchase_price şu anki güncel maliyettir — geçmiş alış fiyatları
   * snapshot'lanmıyor. Bu yüzden COGS proxy bir hesaptır (alış fiyatı çok
   * dalgalanan ürünlerde sapma olur). Gerçek FIFO/Avg cost ileride
   * sale_items'a unit_cost kolonu eklenerek snapshot'lanabilir.
   */
  async getProductProfitability(startDate: string, endDate: string, tenantId?: string | null) {
    const knex = this.db.knex;
    const rawRows = await this.tenantQuery('sale_items', tenantId)
      .join('sales', 'sale_items.sale_id', 'sales.id')
      .join('products', 'sale_items.product_id', 'products.id')
      .where('sales.status', 'completed')
      .whereBetween('sales.sale_date', [startDate, this.toEndOfDay(endDate)])
      .groupBy('products.id', 'products.name', 'products.barcode', 'products.unit', 'products.purchase_price', 'products.sale_price')
      .select(
        'products.id',
        'products.name',
        'products.barcode',
        'products.unit',
        'products.purchase_price as current_purchase_price',
        'products.sale_price as current_sale_price',
        knex.raw('COALESCE(SUM(sale_items.quantity), 0) as total_quantity'),
        knex.raw('COALESCE(SUM(sale_items.line_total), 0) as total_revenue'),
        knex.raw('COALESCE(SUM(sale_items.quantity * products.purchase_price), 0) as total_cogs'),
      )
      .orderByRaw('SUM(sale_items.line_total - sale_items.quantity * products.purchase_price) DESC NULLS LAST');

    const products = (rawRows as any[]).map((r) => {
      const quantity = parseFloat(r.total_quantity) || 0;
      const revenue = parseFloat(r.total_revenue) || 0;
      const cogs = parseFloat(r.total_cogs) || 0;
      const profit = revenue - cogs;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
      return {
        id: r.id,
        name: r.name,
        barcode: r.barcode,
        unit: r.unit,
        current_purchase_price: parseFloat(r.current_purchase_price) || 0,
        current_sale_price: parseFloat(r.current_sale_price) || 0,
        total_quantity: quantity,
        total_revenue: revenue,
        total_cogs: cogs,
        gross_profit: profit,
        margin_percent: Math.round(margin * 100) / 100,
      };
    });

    const summary = products.reduce(
      (acc: any, p: any) => {
        acc.total_quantity += p.total_quantity;
        acc.total_revenue += p.total_revenue;
        acc.total_cogs += p.total_cogs;
        acc.gross_profit += p.gross_profit;
        return acc;
      },
      { total_quantity: 0, total_revenue: 0, total_cogs: 0, gross_profit: 0 },
    );
    summary.margin_percent = summary.total_revenue > 0
      ? Math.round((summary.gross_profit / summary.total_revenue) * 10000) / 100
      : 0;
    summary.product_count = products.length;

    return { products, summary };
  }

  /**
   * Alış Raporu — satış raporunun mirror'ı. Period totals, payment method,
   * tedarikçi top-N, günlük trend, iptaller. Sadece status='completed' dahil.
   */
  async getPurchasesSummary(startDate: string, endDate: string, tenantId?: string | null) {
    const knex = this.db.knex;

    const [rawSummary] = await this.tenantQuery('purchases', tenantId)
      .where('status', 'completed')
      .whereBetween('purchase_date', [startDate, this.toEndOfDay(endDate)])
      .select(
        knex.raw('COUNT(*) as purchase_count'),
        knex.raw('COALESCE(SUM(subtotal), 0) as subtotal'),
        knex.raw('COALESCE(SUM(discount_amount), 0) as discount_total'),
        knex.raw('COALESCE(SUM(vat_total), 0) as vat_total'),
        knex.raw('COALESCE(SUM(grand_total), 0) as grand_total'),
      );

    const r = rawSummary as any;
    const summary = {
      purchase_count: parseInt(r?.purchase_count || '0', 10),
      subtotal: parseFloat(r?.subtotal || '0'),
      discount_total: parseFloat(r?.discount_total || '0'),
      vat_total: parseFloat(r?.vat_total || '0'),
      grand_total: parseFloat(r?.grand_total || '0'),
    };

    // İptaller
    const [cancelledRaw] = await this.tenantQuery('purchases', tenantId)
      .where('status', 'cancelled')
      .whereBetween('purchase_date', [startDate, this.toEndOfDay(endDate)])
      .select(
        knex.raw('COUNT(*) as count'),
        knex.raw('COALESCE(SUM(grand_total), 0) as total'),
      );
    const cancelled = {
      count: parseInt((cancelledRaw as any)?.count || '0', 10),
      total: parseFloat((cancelledRaw as any)?.total || '0'),
    };

    // Ödeme tipi kırılımı
    const byPaymentRaw = await this.tenantQuery('purchases', tenantId)
      .where('status', 'completed')
      .whereBetween('purchase_date', [startDate, this.toEndOfDay(endDate)])
      .select('payment_method')
      .sum('grand_total as total')
      .count('id as count')
      .groupBy('payment_method');
    const byPaymentMethod = byPaymentRaw.map((row: any) => ({
      payment_method: row.payment_method,
      total: parseFloat(row.total || '0'),
      count: parseInt(row.count || '0', 10),
    }));

    // Top tedarikçiler
    const topSuppliersRaw = await this.tenantQuery('purchases', tenantId)
      .leftJoin('suppliers', 'purchases.supplier_id', 'suppliers.id')
      .where('purchases.status', 'completed')
      .whereBetween('purchases.purchase_date', [startDate, this.toEndOfDay(endDate)])
      .whereNotNull('purchases.supplier_id')
      .groupBy('purchases.supplier_id', 'suppliers.name')
      .select(
        'purchases.supplier_id',
        'suppliers.name as supplier_name',
        knex.raw('COUNT(purchases.id) as purchase_count'),
        knex.raw('COALESCE(SUM(purchases.grand_total), 0) as total'),
      )
      .orderByRaw('SUM(purchases.grand_total) DESC NULLS LAST')
      .limit(10);
    const topSuppliers = topSuppliersRaw.map((row: any) => ({
      supplier_id: row.supplier_id,
      supplier_name: row.supplier_name || 'Tedarikçisiz',
      purchase_count: parseInt(row.purchase_count || '0', 10),
      total: parseFloat(row.total || '0'),
    }));

    // Günlük trend
    const dailyRaw = await this.tenantQuery('purchases', tenantId)
      .where('status', 'completed')
      .whereBetween('purchase_date', [startDate, this.toEndOfDay(endDate)])
      .select(knex.raw('DATE(purchase_date) as date'))
      .sum('grand_total as total')
      .count('id as count')
      .groupBy(knex.raw('DATE(purchase_date)'))
      .orderBy('date');
    const dailyPurchases = dailyRaw.map((row: any) => ({
      date: row.date,
      total: parseFloat(row.total || '0'),
      count: parseInt(row.count || '0', 10),
    }));

    return { summary, cancelled, byPaymentMethod, topSuppliers, dailyPurchases };
  }

  /**
   * Kasa Hareketleri Raporu — account_movements üzerinden gelir/gider/transfer
   * özeti + son N hareket listesi.
   */
  async getAccountMovementsReport(
    startDate: string,
    endDate: string,
    accountId: string | undefined,
    tenantId?: string | null,
  ) {
    const knex = this.db.knex;

    // movement_type kırılımı
    let groupQuery = this.tenantQuery('account_movements', tenantId)
      .whereBetween('movement_date', [startDate, this.toEndOfDay(endDate)])
      .groupBy('movement_type')
      .select(
        'movement_type',
        knex.raw('COUNT(*) as count'),
        knex.raw('COALESCE(SUM(amount), 0) as total'),
      );
    if (accountId) groupQuery = groupQuery.where('account_id', accountId);

    const byTypeRaw = await groupQuery;
    const byType = byTypeRaw.map((row: any) => ({
      movement_type: row.movement_type,
      count: parseInt(row.count || '0', 10),
      total: parseFloat(row.total || '0'),
    }));

    // Hareket listesi (son 200, tarih sıralı)
    let listQuery = this.tenantQuery('account_movements', tenantId)
      .leftJoin('accounts', 'account_movements.account_id', 'accounts.id')
      .whereBetween('account_movements.movement_date', [startDate, this.toEndOfDay(endDate)])
      .select(
        'account_movements.id',
        'account_movements.movement_type',
        'account_movements.amount',
        'account_movements.balance_after',
        'account_movements.category',
        'account_movements.description',
        'account_movements.movement_date',
        'account_movements.reference_type',
        'account_movements.reference_id',
        'accounts.name as account_name',
        'accounts.account_type',
      )
      .orderBy('account_movements.movement_date', 'desc')
      .limit(200);
    if (accountId) listQuery = listQuery.where('account_movements.account_id', accountId);

    const movements = (await listQuery).map((row: any) => ({
      id: row.id,
      movement_type: row.movement_type,
      amount: parseFloat(row.amount || '0'),
      balance_after: parseFloat(row.balance_after || '0'),
      category: row.category,
      description: row.description,
      movement_date: row.movement_date,
      reference_type: row.reference_type,
      reference_id: row.reference_id,
      account_name: row.account_name,
      account_type: row.account_type,
    }));

    // Hesap listesi (filter için)
    const accountsRaw = await this.tenantQuery('accounts', tenantId)
      .where('is_active', true)
      .orderBy('name')
      .select('id', 'name', 'account_type');
    const accounts = accountsRaw.map((a: any) => ({
      id: a.id,
      name: a.name,
      account_type: a.account_type,
    }));

    // Net cash flow
    const cashIn = byType.filter((r) => r.movement_type === 'gelir').reduce((s, r) => s + r.total, 0);
    const cashOut = byType.filter((r) => r.movement_type === 'gider').reduce((s, r) => s + r.total, 0);

    return {
      byType,
      movements,
      accounts,
      summary: { cashIn, cashOut, net: cashIn - cashOut, totalMovements: movements.length },
    };
  }

  // Ürün bazında satış + iade detayı: her ürünün satılan/iade edilen miktar ve
  // tutarı, net değerleri, iade oranı; ayrıca dönemin aylık satış/iade trendi.
  async getSalesReturnsDetail(startDate: string, endDate: string, tenantId?: string | null) {
    // Ürün bazında satış toplamları
    let salesQuery = this.db.knex('sale_items')
      .join('sales', 'sale_items.sale_id', 'sales.id')
      .join('products', 'sale_items.product_id', 'products.id')
      .where('sales.status', 'completed')
      .whereBetween('sales.sale_date', [startDate, this.toEndOfDay(endDate)]);
    if (tenantId) salesQuery = salesQuery.where('sales.tenant_id', tenantId);
    const salesRaw = await salesQuery
      .select('products.id', 'products.name', 'products.barcode', 'products.unit', 'products.category')
      .sum('sale_items.quantity as sold_quantity')
      .sum('sale_items.line_total as sold_revenue')
      .groupBy('products.id', 'products.name', 'products.barcode', 'products.unit', 'products.category');

    // Ürün bazında iade toplamları
    let returnsQuery = this.db.knex('return_items')
      .join('returns', 'return_items.return_id', 'returns.id')
      .join('products', 'return_items.product_id', 'products.id')
      .where('returns.status', 'completed')
      .whereBetween('returns.return_date', [startDate, this.toEndOfDay(endDate)]);
    if (tenantId) returnsQuery = returnsQuery.where('returns.tenant_id', tenantId);
    const returnsRaw = await returnsQuery
      .select('products.id', 'products.name', 'products.barcode', 'products.unit', 'products.category')
      .sum('return_items.quantity as returned_quantity')
      .sum('return_items.line_total as returned_amount')
      .groupBy('products.id', 'products.name', 'products.barcode', 'products.unit', 'products.category');

    // Ürün bazında birleştir (sadece iadesi olan ürünler de dahil)
    const map = new Map<string, any>();
    for (const r of salesRaw as any[]) {
      map.set(r.id, {
        id: r.id, name: r.name, barcode: r.barcode, unit: r.unit, category: r.category,
        sold_quantity: parseFloat(r.sold_quantity || '0'),
        sold_revenue: parseFloat(r.sold_revenue || '0'),
        returned_quantity: 0, returned_amount: 0,
      });
    }
    for (const r of returnsRaw as any[]) {
      const existing = map.get(r.id);
      if (existing) {
        existing.returned_quantity = parseFloat(r.returned_quantity || '0');
        existing.returned_amount = parseFloat(r.returned_amount || '0');
      } else {
        map.set(r.id, {
          id: r.id, name: r.name, barcode: r.barcode, unit: r.unit, category: r.category,
          sold_quantity: 0, sold_revenue: 0,
          returned_quantity: parseFloat(r.returned_quantity || '0'),
          returned_amount: parseFloat(r.returned_amount || '0'),
        });
      }
    }

    const products = Array.from(map.values())
      .map((p) => ({
        ...p,
        net_quantity: Math.round((p.sold_quantity - p.returned_quantity) * 1000) / 1000,
        net_revenue: Math.round((p.sold_revenue - p.returned_amount) * 100) / 100,
        return_rate_percent: p.sold_quantity > 0
          ? Math.round((p.returned_quantity / p.sold_quantity) * 10000) / 100
          : 0,
      }))
      .sort((a, b) => b.net_revenue - a.net_revenue);

    const acc = products.reduce(
      (s, p) => {
        s.sold_quantity += p.sold_quantity;
        s.sold_revenue += p.sold_revenue;
        s.returned_quantity += p.returned_quantity;
        s.returned_amount += p.returned_amount;
        return s;
      },
      { sold_quantity: 0, sold_revenue: 0, returned_quantity: 0, returned_amount: 0 },
    );
    const summary = {
      sold_quantity: Math.round(acc.sold_quantity * 1000) / 1000,
      sold_revenue: Math.round(acc.sold_revenue * 100) / 100,
      returned_quantity: Math.round(acc.returned_quantity * 1000) / 1000,
      returned_amount: Math.round(acc.returned_amount * 100) / 100,
      net_revenue: Math.round((acc.sold_revenue - acc.returned_amount) * 100) / 100,
      return_rate_percent: acc.sold_quantity > 0
        ? Math.round((acc.returned_quantity / acc.sold_quantity) * 10000) / 100
        : 0,
      product_count: products.length,
    };

    // Aylık trend (satış ve iade ayrı sorgu, ay bazında birleştir)
    const monthlySalesRaw = await this.tenantQuery('sales', tenantId)
      .where('status', 'completed')
      .whereBetween('sale_date', [startDate, this.toEndOfDay(endDate)])
      .select(this.db.knex.raw("TO_CHAR(sale_date, 'YYYY-MM') as month"))
      .count('id as sale_count')
      .sum('grand_total as sold_revenue')
      .groupBy(this.db.knex.raw("TO_CHAR(sale_date, 'YYYY-MM')"));
    const monthlyReturnsRaw = await this.tenantQuery('returns', tenantId)
      .where('status', 'completed')
      .whereBetween('return_date', [startDate, this.toEndOfDay(endDate)])
      .select(this.db.knex.raw("TO_CHAR(return_date, 'YYYY-MM') as month"))
      .sum('total_amount as returned_amount')
      .groupBy(this.db.knex.raw("TO_CHAR(return_date, 'YYYY-MM')"));

    const monthMap = new Map<string, any>();
    for (const r of monthlySalesRaw as any[]) {
      monthMap.set(r.month, {
        month: r.month,
        sale_count: parseInt(r.sale_count || '0', 10),
        sold_revenue: parseFloat(r.sold_revenue || '0'),
        returned_amount: 0,
      });
    }
    for (const r of monthlyReturnsRaw as any[]) {
      const existing = monthMap.get(r.month);
      if (existing) existing.returned_amount = parseFloat(r.returned_amount || '0');
      else monthMap.set(r.month, { month: r.month, sale_count: 0, sold_revenue: 0, returned_amount: parseFloat(r.returned_amount || '0') });
    }
    const monthlyTrend = Array.from(monthMap.values())
      .map((m) => ({ ...m, net_revenue: Math.round((m.sold_revenue - m.returned_amount) * 100) / 100 }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return { products, summary, monthlyTrend };
  }

  // Detaylı stok raporu: tüm aktif ürünlerin stok miktarı/değeri, potansiyel
  // satış değeri/kârı, seçili dönemde satılan miktarı ve durumu; kategori kırılımı.
  async getStockDetail(startDate: string, endDate: string, tenantId?: string | null) {
    const rawProducts = await this.tenantQuery('products', tenantId)
      .where('is_active', true)
      .select('id', 'name', 'barcode', 'category', 'unit', 'stock_quantity', 'min_stock_level', 'purchase_price', 'sale_price')
      .orderBy('name', 'asc');

    // Dönemde satılan miktar (ürün bazında)
    let soldQuery = this.db.knex('sale_items')
      .join('sales', 'sale_items.sale_id', 'sales.id')
      .where('sales.status', 'completed')
      .whereBetween('sales.sale_date', [startDate, this.toEndOfDay(endDate)]);
    if (tenantId) soldQuery = soldQuery.where('sales.tenant_id', tenantId);
    const soldRaw = await soldQuery
      .select('sale_items.product_id')
      .sum('sale_items.quantity as sold_quantity')
      .groupBy('sale_items.product_id');
    const soldMap = new Map<string, number>();
    for (const r of soldRaw as any[]) soldMap.set(r.product_id, parseFloat(r.sold_quantity || '0'));

    const products = rawProducts.map((p: any) => {
      const stock_quantity = Number(p.stock_quantity) || 0;
      const min_stock_level = Number(p.min_stock_level) || 0;
      const purchase_price = Number(p.purchase_price) || 0;
      const sale_price = Number(p.sale_price) || 0;
      const stock_value = Math.round(stock_quantity * purchase_price * 100) / 100;
      const potential_sale_value = Math.round(stock_quantity * sale_price * 100) / 100;
      const status = stock_quantity <= 0 ? 'out' : (stock_quantity <= min_stock_level ? 'low' : 'ok');
      return {
        id: p.id, name: p.name, barcode: p.barcode, category: p.category, unit: p.unit,
        stock_quantity, min_stock_level, purchase_price, sale_price,
        stock_value, potential_sale_value,
        potential_profit: Math.round((potential_sale_value - stock_value) * 100) / 100,
        sold_quantity: soldMap.get(p.id) || 0,
        status,
      };
    });

    // Kategori kırılımı
    const catMap = new Map<string, any>();
    for (const p of products) {
      const key = p.category || '—';
      const c = catMap.get(key) || { category: key, product_count: 0, stock_quantity: 0, stock_value: 0 };
      c.product_count += 1;
      c.stock_quantity += p.stock_quantity;
      c.stock_value += p.stock_value;
      catMap.set(key, c);
    }
    const byCategory = Array.from(catMap.values())
      .map((c) => ({
        ...c,
        stock_quantity: Math.round(c.stock_quantity * 1000) / 1000,
        stock_value: Math.round(c.stock_value * 100) / 100,
      }))
      .sort((a, b) => b.stock_value - a.stock_value);

    const totalStockValue = Math.round(products.reduce((s, p) => s + p.stock_value, 0) * 100) / 100;
    const totalSaleValue = Math.round(products.reduce((s, p) => s + p.potential_sale_value, 0) * 100) / 100;
    const summary = {
      totalProducts: products.length,
      totalStockValue,
      totalSaleValue,
      potentialProfit: Math.round((totalSaleValue - totalStockValue) * 100) / 100,
      lowStockCount: products.filter((p) => p.status === 'low').length,
      outOfStockCount: products.filter((p) => p.status === 'out').length,
      totalSoldQuantity: Math.round(products.reduce((s, p) => s + p.sold_quantity, 0) * 1000) / 1000,
    };

    return { products, summary, byCategory };
  }
}
