import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class ReportsService {
  constructor(private readonly db: DatabaseService) {}

  async getSalesSummary(startDate: string, endDate: string) {
    const [summary] = await this.db.knex('sales')
      .where('status', 'completed')
      .whereBetween('sale_date', [startDate, endDate])
      .select(
        this.db.knex.raw('COUNT(*) as sale_count'),
        this.db.knex.raw('COALESCE(SUM(subtotal), 0) as subtotal'),
        this.db.knex.raw('COALESCE(SUM(discount_amount), 0) as discount_total'),
        this.db.knex.raw('COALESCE(SUM(vat_total), 0) as vat_total'),
        this.db.knex.raw('COALESCE(SUM(grand_total), 0) as grand_total'),
      );

    const byPaymentMethod = await this.db.knex('sales')
      .where('status', 'completed')
      .whereBetween('sale_date', [startDate, endDate])
      .select('payment_method')
      .sum('grand_total as total')
      .count('id as count')
      .groupBy('payment_method');

    const dailySales = await this.db.knex('sales')
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
    const customers = await this.db.knex('customers')
      .where('is_active', true)
      .whereNot('balance', 0)
      .orderBy('balance', 'asc')
      .select('id', 'name', 'phone', 'balance');

    const [totals] = await this.db.knex('customers')
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
    const salesVat = await this.db.knex('sale_items')
      .join('sales', 'sale_items.sale_id', 'sales.id')
      .where('sales.status', 'completed')
      .whereBetween('sales.sale_date', [startDate, endDate])
      .select('sale_items.vat_rate')
      .sum('sale_items.vat_amount as vat_amount')
      .sum('sale_items.line_total as total')
      .groupBy('sale_items.vat_rate');

    const returnsVat = await this.db.knex('return_items')
      .join('returns', 'return_items.return_id', 'returns.id')
      .where('returns.status', 'completed')
      .whereBetween('returns.return_date', [startDate, endDate])
      .select(this.db.knex.raw('0 as vat_rate'))
      .sum('return_items.vat_amount as vat_amount')
      .groupBy(this.db.knex.raw('1'));

    return { salesVat, returnsVat };
  }

  async getProfitLoss(startDate: string, endDate: string) {
    const [salesTotal] = await this.db.knex('sales')
      .where('status', 'completed')
      .whereBetween('sale_date', [startDate, endDate])
      .sum('grand_total as revenue');

    const [costOfGoods] = await this.db.knex('sale_items')
      .join('sales', 'sale_items.sale_id', 'sales.id')
      .join('products', 'sale_items.product_id', 'products.id')
      .where('sales.status', 'completed')
      .whereBetween('sales.sale_date', [startDate, endDate])
      .select(this.db.knex.raw('COALESCE(SUM(sale_items.quantity * products.purchase_price), 0) as cost'));

    const [expensesTotal] = await this.db.knex('expenses')
      .whereBetween('expense_date', [startDate, endDate])
      .sum('amount as total');

    const [returnsTotal] = await this.db.knex('returns')
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
    return this.db.knex('sale_items')
      .join('sales', 'sale_items.sale_id', 'sales.id')
      .join('products', 'sale_items.product_id', 'products.id')
      .where('sales.status', 'completed')
      .whereBetween('sales.sale_date', [startDate, endDate])
      .select('products.id', 'products.name')
      .sum('sale_items.quantity as total_quantity')
      .sum('sale_items.line_total as total_revenue')
      .groupBy('products.id', 'products.name')
      .orderBy('total_quantity', 'desc')
      .limit(limit);
  }
}
