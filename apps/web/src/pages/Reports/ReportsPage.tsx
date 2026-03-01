import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Spinner } from '@stok/ui';
import { useToast } from '../../context/ToastContext';
import { reportsApi, TopProduct, TopCustomer, UpcomingPayment, OverduePayment, StockReportProduct, ExpenseByCategory, CustomerProductPurchase, CustomerSale, EmployeePerformanceReport, RenewalsReport, RenewalItem } from '../../api/reports.api';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '../../utils/constants';
import styles from './ReportsPage.module.css';

const icons = {
  reports: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  sales: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
  profit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  debt: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  product: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    </svg>
  ),
  customer: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  alert: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  returns: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 14 4 9 9 4" />
      <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
    </svg>
  ),
  expense: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
};

type TabType = 'genel' | 'satis' | 'musteri' | 'musteriSatis' | 'stok' | 'gider' | 'personel' | 'yenileme';

export function ReportsPage() {
  const { t } = useTranslation(['reports', 'common']);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('genel');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  // Data states
  const [salesSummary, setSalesSummary] = useState<any>(null);
  const [profitLoss, setProfitLoss] = useState<any>(null);
  const [debtOverview, setDebtOverview] = useState<any>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPayment[]>([]);
  const [overduePayments, setOverduePayments] = useState<{ overdueList: OverduePayment[]; totalCount: number; totalAmount: number } | null>(null);
  const [stockReport, setStockReport] = useState<{ products: StockReportProduct[]; summary: any } | null>(null);
  const [returnsReport, setReturnsReport] = useState<any>(null);
  const [expensesReport, setExpensesReport] = useState<{ byCategory: ExpenseByCategory[]; summary: any; monthlyTrend: any[] } | null>(null);
  const [customerProducts, setCustomerProducts] = useState<CustomerProductPurchase[]>([]);
  const [customerSales, setCustomerSales] = useState<CustomerSale[]>([]);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [employeePerformance, setEmployeePerformance] = useState<EmployeePerformanceReport | null>(null);
  const [renewalsReport, setRenewalsReport] = useState<RenewalsReport | null>(null);
  const [renewalFilter, setRenewalFilter] = useState<'all' | 'expired' | 'red' | 'yellow' | 'green'>('all');

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const [sales, profit, debt, products, customers, upcoming, overdue, stock, returns, expenses, custProducts, custSales, empPerf, renewals] = await Promise.all([
        reportsApi.getSalesSummary(startDate, endDate),
        reportsApi.getProfitLoss(startDate, endDate),
        reportsApi.getDebtOverview(),
        reportsApi.getTopProducts(startDate, endDate, 10),
        reportsApi.getTopCustomers(startDate, endDate, 10),
        reportsApi.getUpcomingPayments(30),
        reportsApi.getOverduePayments(),
        reportsApi.getStockReport(),
        reportsApi.getReturnsReport(startDate, endDate),
        reportsApi.getExpensesByCategory(startDate, endDate),
        reportsApi.getCustomerProductPurchases(startDate, endDate),
        reportsApi.getCustomerSales(startDate, endDate),
        reportsApi.getEmployeePerformance(startDate, endDate),
        reportsApi.getRenewals(),
      ]);
      setSalesSummary(sales.data);
      setProfitLoss(profit.data);
      setDebtOverview(debt.data);
      setTopProducts(products.data);
      setTopCustomers(customers.data);
      setUpcomingPayments(upcoming.data);
      setOverduePayments(overdue.data);
      setStockReport(stock.data);
      setReturnsReport(returns.data);
      setExpensesReport(expenses.data);
      setCustomerProducts(custProducts.data);
      setCustomerSales(custSales.data);
      setEmployeePerformance(empPerf.data);
      setRenewalsReport(renewals.data);
    } catch (err) {
      showToast('error', t('reports:loadFailed'));
    }
    setLoading(false);
  }, [startDate, endDate]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const renderGenelTab = () => (
    <div className={styles.grid}>
      {/* Sales Summary */}
      <div className={styles.reportCard}>
        <div className={styles.reportCardHeader}>
          {icons.sales}
          <h3 className={styles.reportCardTitle}>{t('reports:general.salesSummary')}</h3>
        </div>
        <div className={styles.reportCardBody}>
          {salesSummary?.summary && (
            <div className={styles.reportGrid}>
              <div className={styles.reportItem}>
                <span>{t('reports:general.totalSales')}</span>
                <strong>{salesSummary.summary.sale_count} {t('reports:general.pieces')}</strong>
              </div>
              <div className={styles.reportItem}>
                <span>{t('reports:general.subtotal')}</span>
                <strong>{formatCurrency(parseFloat(salesSummary.summary.subtotal))}</strong>
              </div>
              <div className={styles.reportItem}>
                <span>{t('reports:general.totalDiscount')}</span>
                <strong>{formatCurrency(parseFloat(salesSummary.summary.discount_total))}</strong>
              </div>
              <div className={styles.reportItem}>
                <span>{t('reports:general.totalVat')}</span>
                <strong>{formatCurrency(parseFloat(salesSummary.summary.vat_total))}</strong>
              </div>
              <div className={styles.reportItem}>
                <span>{t('reports:general.grandTotal')}</span>
                <strong className={styles.success}>{formatCurrency(parseFloat(salesSummary.summary.grand_total))}</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profit/Loss */}
      <div className={styles.reportCard}>
        <div className={styles.reportCardHeader}>
          {icons.profit}
          <h3 className={styles.reportCardTitle}>{t('reports:general.profitLoss')}</h3>
        </div>
        <div className={styles.reportCardBody}>
          {profitLoss && (
            <div className={styles.reportGrid}>
              <div className={styles.reportItem}>
                <span>{t('reports:general.totalRevenue')}</span>
                <strong className={styles.success}>{formatCurrency(profitLoss.revenue)}</strong>
              </div>
              <div className={styles.reportItem}>
                <span>{t('reports:general.costOfGoods')}</span>
                <strong>{formatCurrency(profitLoss.costOfGoods)}</strong>
              </div>
              <div className={styles.reportItem}>
                <span>{t('reports:general.returnAmount')}</span>
                <strong>{formatCurrency(profitLoss.returns)}</strong>
              </div>
              <div className={styles.reportItem}>
                <span>{t('reports:general.grossProfit')}</span>
                <strong>{formatCurrency(profitLoss.grossProfit)}</strong>
              </div>
              <div className={styles.reportItem}>
                <span>{t('reports:general.totalExpenses')}</span>
                <strong className={styles.danger}>{formatCurrency(profitLoss.expenses)}</strong>
              </div>
              <div className={styles.reportItem}>
                <span>{t('reports:general.netProfit')}</span>
                <strong className={profitLoss.netProfit >= 0 ? styles.success : styles.danger}>
                  {formatCurrency(profitLoss.netProfit)}
                </strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Debt Overview */}
      <div className={styles.reportCard}>
        <div className={styles.reportCardHeader}>
          {icons.debt}
          <h3 className={styles.reportCardTitle}>{t('reports:general.debtOverview')}</h3>
        </div>
        <div className={styles.reportCardBody}>
          {debtOverview && (
            <div className={styles.reportGrid}>
              <div className={styles.reportItem}>
                <span>{t('reports:general.totalDebt')}</span>
                <strong className={styles.danger}>{formatCurrency(debtOverview.totalDebt)}</strong>
              </div>
              <div className={styles.reportItem}>
                <span>{t('reports:general.totalCredit')}</span>
                <strong className={styles.success}>{formatCurrency(debtOverview.totalCredit)}</strong>
              </div>
              <div className={styles.reportItem}>
                <span>{t('reports:general.netStatus')}</span>
                <strong className={debtOverview.totalCredit - debtOverview.totalDebt >= 0 ? styles.success : styles.danger}>
                  {formatCurrency(debtOverview.totalCredit - debtOverview.totalDebt)}
                </strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overdue Payments */}
      <div className={`${styles.reportCard} ${styles.fullWidthCard}`}>
        <div className={styles.reportCardHeader}>
          {icons.alert}
          <h3 className={styles.reportCardTitle}>{t('reports:general.overduePayments')}</h3>
        </div>
        <div className={styles.reportCardBody}>
          {overduePayments && overduePayments.totalCount > 0 ? (
            <>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                  <div className={`${styles.summaryValue} ${styles.danger}`}>{overduePayments.totalCount}</div>
                  <div className={styles.summaryLabel}>{t('reports:general.overdueInvoice')}</div>
                </div>
                <div className={styles.summaryCard}>
                  <div className={`${styles.summaryValue} ${styles.danger}`}>{formatCurrency(overduePayments.totalAmount)}</div>
                  <div className={styles.summaryLabel}>{t('reports:general.totalAmount')}</div>
                </div>
              </div>
              <table className={styles.reportTable}>
                <thead>
                  <tr>
                    <th>{t('reports:general.invoice')}</th>
                    <th>{t('reports:general.customer')}</th>
                    <th>{t('reports:general.dueDate')}</th>
                    <th>{t('reports:general.delay')}</th>
                    <th className={styles.alignRight}>{t('reports:general.amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {overduePayments.overdueList.slice(0, 5).map((p) => (
                    <tr key={p.id}>
                      <td>{p.invoice_number}</td>
                      <td>{p.customer_name || '-'}</td>
                      <td>{formatDate(p.due_date)}</td>
                      <td><span className={`${styles.badge} ${styles.badgeDanger}`}>{p.days_overdue} {t('reports:general.days')}</span></td>
                      <td className={styles.alignRight}><strong>{formatCurrency(p.grand_total)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <div className={styles.emptyState}>{t('reports:general.noOverduePayments')}</div>
          )}
        </div>
      </div>

      {/* Upcoming Payments */}
      <div className={`${styles.reportCard} ${styles.fullWidthCard}`}>
        <div className={styles.reportCardHeader}>
          {icons.calendar}
          <h3 className={styles.reportCardTitle}>{t('reports:general.upcomingPayments')}</h3>
        </div>
        <div className={styles.reportCardBody}>
          {upcomingPayments.length > 0 ? (
            <table className={styles.reportTable}>
              <thead>
                <tr>
                  <th>{t('reports:general.invoice')}</th>
                  <th>{t('reports:general.customer')}</th>
                  <th>{t('reports:general.dueDate')}</th>
                  <th className={styles.alignRight}>{t('reports:general.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {upcomingPayments.slice(0, 10).map((p) => (
                  <tr key={p.id}>
                    <td>{p.invoice_number}</td>
                    <td>{p.customer_name || '-'}</td>
                    <td>{formatDate(p.due_date)}</td>
                    <td className={styles.alignRight}><strong>{formatCurrency(p.grand_total)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyState}>{t('reports:general.noUpcomingPayments')}</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSatisTab = () => (
    <div className={`${styles.grid} ${styles.twoColGrid}`}>
      {/* Top Products */}
      <div className={styles.reportCard}>
        <div className={styles.reportCardHeader}>
          {icons.product}
          <h3 className={styles.reportCardTitle}>{t('reports:sales.topProducts')}</h3>
        </div>
        <div className={styles.reportCardBody}>
          {topProducts.length > 0 ? (
            <table className={styles.reportTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('reports:sales.product')}</th>
                  <th className={styles.alignRight}>{t('reports:sales.quantity')}</th>
                  <th className={styles.alignRight}>{t('reports:sales.revenue')}</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={p.id}>
                    <td>{i + 1}</td>
                    <td>{p.name}</td>
                    <td className={styles.alignRight}>{p.total_quantity}</td>
                    <td className={styles.alignRight}><strong>{formatCurrency(parseFloat(String(p.total_revenue)))}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyState}>{t('reports:noData')}</div>
          )}
        </div>
      </div>

      {/* Returns Report */}
      <div className={styles.reportCard}>
        <div className={styles.reportCardHeader}>
          {icons.returns}
          <h3 className={styles.reportCardTitle}>{t('reports:sales.returnsReport')}</h3>
        </div>
        <div className={styles.reportCardBody}>
          {returnsReport ? (
            <>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryValue}>{returnsReport.summary.count}</div>
                  <div className={styles.summaryLabel}>{t('reports:sales.totalReturns')}</div>
                </div>
                <div className={styles.summaryCard}>
                  <div className={`${styles.summaryValue} ${styles.danger}`}>{formatCurrency(returnsReport.summary.total)}</div>
                  <div className={styles.summaryLabel}>{t('reports:sales.returnAmount')}</div>
                </div>
              </div>
              {returnsReport.topReturnedProducts?.length > 0 && (
                <>
                  <h4 style={{ margin: 'var(--space-3) 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>{t('reports:sales.topReturnedProducts')}</h4>
                  <table className={styles.reportTable}>
                    <thead>
                      <tr>
                        <th>{t('reports:sales.product')}</th>
                        <th className={styles.alignRight}>{t('reports:sales.returnQuantity')}</th>
                        <th className={styles.alignRight}>{t('reports:sales.returnTotal')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {returnsReport.topReturnedProducts.slice(0, 5).map((p: any) => (
                        <tr key={p.id}>
                          <td>{p.name}</td>
                          <td className={styles.alignRight}>{p.total_quantity}</td>
                          <td className={styles.alignRight}>{formatCurrency(parseFloat(p.total_amount))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </>
          ) : (
            <div className={styles.emptyState}>{t('reports:noData')}</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderMusteriTab = () => {
    const groupedByCustomer = customerProducts.reduce<Record<string, { name: string; products: { product_name: string; total_quantity: number; total_amount: number }[] }>>((acc, item) => {
      if (!acc[item.customer_id]) {
        acc[item.customer_id] = { name: item.customer_name, products: [] };
      }
      acc[item.customer_id].products.push({
        product_name: item.product_name,
        total_quantity: Number(item.total_quantity),
        total_amount: parseFloat(String(item.total_amount)),
      });
      return acc;
    }, {});

    const debtCustomers = debtOverview?.customers?.filter((c: any) => c.balance < 0) || [];

    return (
      <div className={`${styles.grid} ${styles.twoColGrid}`}>
        {/* Top Customers */}
        <div className={styles.reportCard}>
          <div className={styles.reportCardHeader}>
            {icons.customer}
            <h3 className={styles.reportCardTitle}>{t('reports:customers.topCustomers')}</h3>
          </div>
          <div className={styles.reportCardBody}>
            {topCustomers.length > 0 ? (
              <table className={styles.reportTable}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t('reports:customers.customer')}</th>
                    <th className={styles.alignRight}>{t('reports:customers.salesCount')}</th>
                    <th className={styles.alignRight}>{t('reports:customers.total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.map((c, i) => (
                    <tr key={c.id}>
                      <td>{i + 1}</td>
                      <td>
                        <div>{c.name}</div>
                        {c.phone && <small className={styles.accordionPhone}>{c.phone}</small>}
                      </td>
                      <td className={styles.alignRight}>{c.sale_count}</td>
                      <td className={styles.alignRight}><strong className={styles.success}>{formatCurrency(parseFloat(String(c.total_amount)))}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className={styles.emptyState}>{t('reports:noData')}</div>
            )}
          </div>
        </div>

        {/* Customers with Debt */}
        <div className={styles.reportCard}>
          <div className={styles.reportCardHeader}>
            {icons.debt}
            <h3 className={styles.reportCardTitle}>{t('reports:customers.debtCustomers')}</h3>
          </div>
          <div className={styles.reportCardBody}>
            {debtCustomers.length > 0 ? (
              <table className={styles.reportTable}>
                <thead>
                  <tr>
                    <th>{t('reports:customers.customer')}</th>
                    <th>{t('reports:customers.phone')}</th>
                    <th className={styles.alignRight}>{t('reports:customers.balance')}</th>
                  </tr>
                </thead>
                <tbody>
                  {debtCustomers.slice(0, 10).map((c: any) => (
                    <tr key={c.id}>
                      <td>{c.name}</td>
                      <td>{c.phone || '-'}</td>
                      <td className={styles.alignRight}>
                        <strong className={styles.danger}>{formatCurrency(Math.abs(c.balance))}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className={styles.emptyState}>{t('reports:customers.noDebtCustomers')}</div>
            )}
          </div>
        </div>

        {/* Customer Product Purchases */}
        <div className={`${styles.reportCard} ${styles.fullWidthCard}`}>
          <div className={styles.reportCardHeader}>
            {icons.product}
            <h3 className={styles.reportCardTitle}>{t('reports:customers.productPurchases')}</h3>
          </div>
          <div className={styles.reportCardBody}>
            {Object.keys(groupedByCustomer).length > 0 ? (
              Object.entries(groupedByCustomer).map(([customerId, customer]) => (
                <div key={customerId} className={styles.customerProductGroup}>
                  <h4 className={styles.customerProductGroupHeader}>
                    {customer.name}
                    <span className={styles.customerProductGroupCount}>
                      ({customer.products.reduce((s, p) => s + p.total_quantity, 0)} {t('reports:customers.totalPieces')})
                    </span>
                  </h4>
                  <table className={styles.reportTable}>
                    <thead>
                      <tr>
                        <th>{t('reports:sales.product')}</th>
                        <th className={styles.alignRight}>{t('reports:sales.quantity')}</th>
                        <th className={styles.alignRight}>{t('reports:general.amount')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customer.products.map((p) => (
                        <tr key={p.product_name}>
                          <td>{p.product_name}</td>
                          <td className={styles.alignRight}><strong>{p.total_quantity}</strong></td>
                          <td className={styles.alignRight}>{formatCurrency(p.total_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>{t('reports:customers.noProductData')}</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStokTab = () => (
    <div className={styles.grid}>
      {/* Stock Summary */}
      <div className={`${styles.reportCard} ${styles.fullWidthCard}`}>
        <div className={styles.reportCardHeader}>
          {icons.product}
          <h3 className={styles.reportCardTitle}>{t('reports:stock.summary')}</h3>
        </div>
        <div className={styles.reportCardBody}>
          {stockReport?.summary && (
            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryValue}>{stockReport.summary.totalProducts}</div>
                <div className={styles.summaryLabel}>{t('reports:stock.totalProducts')}</div>
              </div>
              <div className={styles.summaryCard}>
                <div className={`${styles.summaryValue} ${styles.warning}`}>{stockReport.summary.lowStockCount}</div>
                <div className={styles.summaryLabel}>{t('reports:stock.lowStock')}</div>
              </div>
              <div className={styles.summaryCard}>
                <div className={`${styles.summaryValue} ${styles.danger}`}>{stockReport.summary.outOfStockCount}</div>
                <div className={styles.summaryLabel}>{t('reports:stock.outOfStock')}</div>
              </div>
              <div className={styles.summaryCard}>
                <div className={styles.summaryValue}>{formatCurrency(stockReport.summary.totalStockValue)}</div>
                <div className={styles.summaryLabel}>{t('reports:stock.stockValueCost')}</div>
              </div>
              <div className={styles.summaryCard}>
                <div className={styles.summaryValue}>{formatCurrency(stockReport.summary.totalSaleValue)}</div>
                <div className={styles.summaryLabel}>{t('reports:stock.stockValueSale')}</div>
              </div>
              <div className={styles.summaryCard}>
                <div className={`${styles.summaryValue} ${styles.success}`}>{formatCurrency(stockReport.summary.potentialProfit)}</div>
                <div className={styles.summaryLabel}>{t('reports:stock.potentialProfit')}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Low Stock Products */}
      <div className={`${styles.reportCard} ${styles.fullWidthCard}`}>
        <div className={styles.reportCardHeader}>
          {icons.alert}
          <h3 className={styles.reportCardTitle}>{t('reports:stock.lowStockProducts')}</h3>
        </div>
        <div className={styles.reportCardBody}>
          {stockReport?.products && stockReport.products.filter(p => p.stock_quantity <= p.min_stock_level).length > 0 ? (
            <table className={styles.reportTable}>
              <thead>
                <tr>
                  <th>{t('reports:stock.product')}</th>
                  <th>{t('reports:stock.barcode')}</th>
                  <th className={styles.alignRight}>{t('reports:stock.current')}</th>
                  <th className={styles.alignRight}>{t('reports:stock.minimum')}</th>
                  <th className={styles.alignRight}>{t('reports:stock.status')}</th>
                </tr>
              </thead>
              <tbody>
                {stockReport.products
                  .filter(p => p.stock_quantity <= p.min_stock_level)
                  .slice(0, 15)
                  .map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{p.barcode || '-'}</td>
                      <td className={styles.alignRight}>{p.stock_quantity}</td>
                      <td className={styles.alignRight}>{p.min_stock_level}</td>
                      <td className={styles.alignRight}>
                        <span className={`${styles.badge} ${p.stock_quantity === 0 ? styles.badgeDanger : styles.badgeWarning}`}>
                          {p.stock_quantity === 0 ? t('reports:stock.depleted') : t('reports:stock.low')}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyState}>{t('reports:stock.noLowStock')}</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderMusteriSatisTab = () => {
    const grouped = customerSales.reduce<Record<string, { name: string; phone: string | null; sales: CustomerSale[] }>>((acc, sale) => {
      if (!acc[sale.customer_id]) {
        acc[sale.customer_id] = { name: sale.customer_name, phone: sale.customer_phone, sales: [] };
      }
      acc[sale.customer_id].sales.push(sale);
      return acc;
    }, {});

    const entries = Object.entries(grouped);
    const totalCustomerCount = entries.length;
    const totalSaleCount = customerSales.length;
    const totalAmount = customerSales.reduce((s, sale) => s + parseFloat(String(sale.grand_total)), 0);

    const toggleCustomer = (id: string) => {
      setExpandedCustomer(expandedCustomer === id ? null : id);
    };

    return (
      <div className={styles.grid}>
        {/* Summary */}
        <div className={`${styles.reportCard} ${styles.fullWidthCard}`}>
          <div className={styles.reportCardHeader}>
            {icons.customer}
            <h3 className={styles.reportCardTitle}>{t('reports:customerSales.summary')}</h3>
          </div>
          <div className={styles.reportCardBody}>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryValue}>{totalCustomerCount}</div>
                <div className={styles.summaryLabel}>{t('reports:customerSales.customer')}</div>
              </div>
              <div className={styles.summaryCard}>
                <div className={styles.summaryValue}>{totalSaleCount}</div>
                <div className={styles.summaryLabel}>{t('reports:customerSales.totalSales')}</div>
              </div>
              <div className={styles.summaryCard}>
                <div className={`${styles.summaryValue} ${styles.success}`}>{formatCurrency(totalAmount)}</div>
                <div className={styles.summaryLabel}>{t('reports:customerSales.totalRevenue')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Accordion */}
        <div className={`${styles.reportCard} ${styles.fullWidthCard}`}>
          <div className={styles.reportCardHeader}>
            {icons.sales}
            <h3 className={styles.reportCardTitle}>{t('reports:customerSales.byCustomer')}</h3>
          </div>
          <div className={styles.reportCardBody}>
            {entries.length > 0 ? (
              <div className={styles.accordion}>
                {entries.map(([customerId, customer]) => {
                  const custTotal = customer.sales.reduce((s, sale) => s + parseFloat(String(sale.grand_total)), 0);
                  const isExpanded = expandedCustomer === customerId;

                  return (
                    <div key={customerId} className={styles.accordionItem}>
                      <div
                        onClick={() => toggleCustomer(customerId)}
                        className={`${styles.accordionHeader} ${isExpanded ? styles.accordionHeaderActive : ''}`}
                      >
                        <div className={styles.accordionCustomer}>
                          <strong>{customer.name}</strong>
                          {customer.phone && <span className={styles.accordionPhone}>{customer.phone}</span>}
                        </div>
                        <div className={styles.accordionMeta}>
                          <span className={styles.accordionCount}>{customer.sales.length} {t('reports:customerSales.saleCount')}</span>
                          <strong className={styles.success}>{formatCurrency(custTotal)}</strong>
                          <span className={`${styles.accordionArrow} ${isExpanded ? styles.accordionArrowOpen : ''}`}>&#9660;</span>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className={styles.accordionBody}>
                          {customer.sales.map((sale) => (
                            <div key={sale.id} className={styles.accordionSaleItem}>
                              <div className={styles.accordionSaleHeader}>
                                <span>
                                  <strong>{sale.invoice_number}</strong>
                                  <span className={styles.accordionSaleMeta}>{formatDate(sale.sale_date)}</span>
                                  <span className={styles.accordionSaleMeta}>
                                    ({PAYMENT_METHODS[sale.payment_method as keyof typeof PAYMENT_METHODS] || sale.payment_method})
                                  </span>
                                </span>
                                <strong>{formatCurrency(parseFloat(String(sale.grand_total)))}</strong>
                              </div>
                              {sale.items.length > 0 && (
                                <table className={styles.reportTable}>
                                  <thead>
                                    <tr>
                                      <th>{t('reports:customerSales.product')}</th>
                                      <th className={styles.alignRight}>{t('reports:customerSales.quantity')}</th>
                                      <th className={styles.alignRight}>{t('reports:customerSales.unitPrice')}</th>
                                      <th className={styles.alignRight}>{t('reports:customerSales.total')}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {sale.items.map((item, idx) => (
                                      <tr key={idx}>
                                        <td>{item.product_name}</td>
                                        <td className={styles.alignRight}>{item.quantity}</td>
                                        <td className={styles.alignRight}>{formatCurrency(parseFloat(String(item.unit_price)))}</td>
                                        <td className={styles.alignRight}>{formatCurrency(parseFloat(String(item.line_total)))}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={styles.emptyState}>{t('reports:customerSales.noCustomerSales')}</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderGiderTab = () => (
    <div className={`${styles.grid} ${styles.twoColGrid}`}>
      {/* Expenses by Category */}
      <div className={styles.reportCard}>
        <div className={styles.reportCardHeader}>
          {icons.expense}
          <h3 className={styles.reportCardTitle}>{t('reports:expenses.byCategory')}</h3>
        </div>
        <div className={styles.reportCardBody}>
          {expensesReport?.byCategory && expensesReport.byCategory.length > 0 ? (
            <>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryValue}>{expensesReport.summary.count}</div>
                  <div className={styles.summaryLabel}>{t('reports:expenses.totalRecords')}</div>
                </div>
                <div className={styles.summaryCard}>
                  <div className={`${styles.summaryValue} ${styles.danger}`}>{formatCurrency(expensesReport.summary.total)}</div>
                  <div className={styles.summaryLabel}>{t('reports:expenses.totalExpenses')}</div>
                </div>
              </div>
              <table className={styles.reportTable}>
                <thead>
                  <tr>
                    <th>{t('reports:expenses.category')}</th>
                    <th className={styles.alignRight}>{t('reports:expenses.records')}</th>
                    <th className={styles.alignRight}>{t('reports:expenses.amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {expensesReport.byCategory.map((c) => (
                    <tr key={c.category}>
                      <td>{EXPENSE_CATEGORIES[c.category as keyof typeof EXPENSE_CATEGORIES] || c.category}</td>
                      <td className={styles.alignRight}>{c.count}</td>
                      <td className={styles.alignRight}><strong>{formatCurrency(parseFloat(String(c.total)))}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <div className={styles.emptyState}>{t('reports:expenses.noExpenseData')}</div>
          )}
        </div>
      </div>

      {/* Monthly Trend */}
      <div className={styles.reportCard}>
        <div className={styles.reportCardHeader}>
          {icons.calendar}
          <h3 className={styles.reportCardTitle}>{t('reports:expenses.monthlyTrend')}</h3>
        </div>
        <div className={styles.reportCardBody}>
          {expensesReport?.monthlyTrend && expensesReport.monthlyTrend.length > 0 ? (
            <table className={styles.reportTable}>
              <thead>
                <tr>
                  <th>{t('reports:expenses.month')}</th>
                  <th className={styles.alignRight}>{t('reports:expenses.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {expensesReport.monthlyTrend.map((m: any) => (
                  <tr key={m.month}>
                    <td>{m.month}</td>
                    <td className={styles.alignRight}><strong>{formatCurrency(parseFloat(m.total))}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyState}>{t('reports:noData')}</div>
          )}
        </div>
      </div>
    </div>
  );

  const isAdmin = user?.role === 'super_admin' || user?.role === 'tenant_admin';

  const renderPersonelTab = () => {
    if (!employeePerformance) return <div className={styles.emptyState}>{t('reports:noData')}</div>;

    const { employees, summary } = employeePerformance;
    const topEmployee = employees.length > 0 ? employees[0] : null;

    return (
      <div className={styles.grid}>
        {/* Summary Cards */}
        <div className={`${styles.reportCard} ${styles.fullWidthCard}`}>
          <div className={styles.reportCardHeader}>
            {icons.customer}
            <h3 className={styles.reportCardTitle}>{t('reports:staff.performanceSummary')}</h3>
          </div>
          <div className={styles.reportCardBody}>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryValue}>{summary.totalSales}</div>
                <div className={styles.summaryLabel}>{t('reports:staff.totalSales')}</div>
              </div>
              <div className={styles.summaryCard}>
                <div className={`${styles.summaryValue} ${styles.success}`}>{formatCurrency(summary.totalRevenue)}</div>
                <div className={styles.summaryLabel}>{t('reports:staff.totalRevenue')}</div>
              </div>
              {isAdmin && topEmployee && (
                <div className={styles.summaryCard}>
                  <div className={styles.summaryValue} style={{ fontSize: 'var(--font-size-base)' }}>{topEmployee.name}</div>
                  <div className={styles.summaryLabel}>{t('reports:staff.topEmployee')}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Leaderboard - only for admin */}
        {isAdmin && employees.length > 0 && (
          <div className={`${styles.reportCard} ${styles.fullWidthCard}`}>
            <div className={styles.reportCardHeader}>
              {icons.reports}
              <h3 className={styles.reportCardTitle}>{t('reports:staff.leaderboard')}</h3>
            </div>
            <div className={styles.reportCardBody}>
              <table className={styles.reportTable}>
                <thead>
                  <tr>
                    <th>{t('reports:staff.rank')}</th>
                    <th>{t('reports:staff.employee')}</th>
                    <th className={styles.alignRight}>{t('reports:staff.sales')}</th>
                    <th className={styles.alignRight}>{t('reports:staff.revenue')}</th>
                    <th className={styles.alignRight}>{t('reports:staff.invoiced')}</th>
                    <th className={styles.alignRight}>{t('reports:staff.cancelled')}</th>
                    <th className={styles.alignRight}>{t('reports:staff.avgSale')}</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp, i) => (
                    <tr key={emp.id} className={i < 3 ? styles.leaderboardTop : undefined}>
                      <td>
                        <span className={i < 3 ? styles.leaderboardRank : undefined}>
                          {i + 1}
                        </span>
                      </td>
                      <td>
                        <div>{emp.name}</div>
                        <small style={{ color: 'var(--color-text-muted)' }}>{emp.email}</small>
                      </td>
                      <td className={styles.alignRight}>{emp.saleCount}</td>
                      <td className={styles.alignRight}><strong className={styles.success}>{formatCurrency(emp.totalRevenue)}</strong></td>
                      <td className={styles.alignRight}>{emp.invoiceCount}</td>
                      <td className={styles.alignRight}>
                        {emp.cancelledCount > 0 ? (
                          <span className={styles.danger}>{emp.cancelledCount}</span>
                        ) : (
                          <span>0</span>
                        )}
                      </td>
                      <td className={styles.alignRight}>{formatCurrency(emp.avgSale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const computeRenewalStatus = (item: RenewalItem): 'expired' | 'red' | 'yellow' | 'green' => {
    const days = item.days_remaining;
    const redDays = item.renewal_red_days || 30;
    const yellowDays = item.renewal_yellow_days || 60;
    if (days < 0) return 'expired';
    if (days <= redDays) return 'red';
    if (days <= yellowDays) return 'yellow';
    return 'green';
  };

  const renderYenilemeTab = () => {
    if (!renewalsReport) return <div className={styles.emptyState}>{t('reports:noData')}</div>;

    const { renewals } = renewalsReport;

    // Client-side status hesaplama (backend'e bagimli olmadan)
    const renewalsWithStatus = renewals.map((item) => ({
      ...item,
      computed_status: computeRenewalStatus(item),
    }));

    const expiredCount = renewalsWithStatus.filter((r) => r.computed_status === 'expired').length;
    const criticalCount = renewalsWithStatus.filter((r) => r.computed_status === 'red').length;
    const upcomingCount = renewalsWithStatus.filter((r) => r.computed_status === 'yellow').length;
    const normalCount = renewalsWithStatus.filter((r) => r.computed_status === 'green').length;

    const filteredRenewals = renewalFilter === 'all'
      ? renewalsWithStatus
      : renewalsWithStatus.filter((item) => item.computed_status === renewalFilter);

    const getStatusBadge = (status: string) => {
      if (status === 'expired') return <span className={`${styles.badge} ${styles.badgeDanger}`}>{t('reports:renewals.expired')}</span>;
      if (status === 'red') return <span className={`${styles.badge} ${styles.badgeDanger}`}>{t('reports:renewals.urgent')}</span>;
      if (status === 'yellow') return <span className={`${styles.badge} ${styles.badgeWarning}`}>{t('reports:renewals.upcoming')}</span>;
      return <span className={`${styles.badge} ${styles.badgeSuccess}`}>{t('reports:renewals.future')}</span>;
    };

    return (
      <div className={styles.grid}>
        <div className={`${styles.reportCard} ${styles.fullWidthCard}`}>
          <div className={styles.reportCardHeader}>
            {icons.calendar}
            <h3 className={styles.reportCardTitle}>{t('reports:renewals.title')}</h3>
          </div>
          <div className={styles.reportCardBody}>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryValue}>{renewals.length}</div>
                <div className={styles.summaryLabel}>{t('reports:renewals.total')}</div>
              </div>
              <div className={styles.summaryCard}>
                <div className={`${styles.summaryValue} ${styles.danger}`}>{expiredCount}</div>
                <div className={styles.summaryLabel}>{t('reports:renewals.expiredLabel')}</div>
              </div>
              <div className={styles.summaryCard}>
                <div className={`${styles.summaryValue} ${styles.danger}`}>{criticalCount}</div>
                <div className={styles.summaryLabel}>{t('reports:renewals.urgentLabel')}</div>
              </div>
              <div className={styles.summaryCard}>
                <div className={`${styles.summaryValue} ${styles.warning}`}>{upcomingCount}</div>
                <div className={styles.summaryLabel}>{t('reports:renewals.upcomingLabel')}</div>
              </div>
              <div className={styles.summaryCard}>
                <div className={`${styles.summaryValue} ${styles.success}`}>{normalCount}</div>
                <div className={styles.summaryLabel}>{t('reports:renewals.futureLabel')}</div>
              </div>
            </div>

            <div className={styles.renewalFilters}>
              <button
                className={`${styles.renewalFilterBtn} ${renewalFilter === 'all' ? styles.renewalFilterBtnActive : ''}`}
                onClick={() => setRenewalFilter('all')}
              >
                {t('reports:renewals.filterAll')} ({renewals.length})
              </button>
              {expiredCount > 0 && (
                <button
                  className={`${styles.renewalFilterBtn} ${styles.renewalFilterBtnRed} ${renewalFilter === 'expired' ? styles.renewalFilterBtnActive : ''}`}
                  onClick={() => setRenewalFilter('expired')}
                >
                  {t('reports:renewals.filterExpired')} ({expiredCount})
                </button>
              )}
              <button
                className={`${styles.renewalFilterBtn} ${styles.renewalFilterBtnRed} ${renewalFilter === 'red' ? styles.renewalFilterBtnActive : ''}`}
                onClick={() => setRenewalFilter('red')}
              >
                {t('reports:renewals.filterCritical')} ({criticalCount})
              </button>
              <button
                className={`${styles.renewalFilterBtn} ${styles.renewalFilterBtnYellow} ${renewalFilter === 'yellow' ? styles.renewalFilterBtnActive : ''}`}
                onClick={() => setRenewalFilter('yellow')}
              >
                {t('reports:renewals.filterUpcoming')} ({upcomingCount})
              </button>
              <button
                className={`${styles.renewalFilterBtn} ${styles.renewalFilterBtnGreen} ${renewalFilter === 'green' ? styles.renewalFilterBtnActive : ''}`}
                onClick={() => setRenewalFilter('green')}
              >
                {t('reports:renewals.filterOk')} ({normalCount})
              </button>
            </div>
          </div>
        </div>

        {filteredRenewals.length > 0 ? (
          <div className={`${styles.reportCard} ${styles.fullWidthCard}`}>
            <div className={styles.reportCardBody}>
              <table className={styles.reportTable}>
                <thead>
                  <tr>
                    <th>{t('reports:renewals.customer')}</th>
                    <th>{t('reports:renewals.products')}</th>
                    <th>{t('reports:renewals.saleDate')}</th>
                    <th>{t('reports:renewals.renewalDate')}</th>
                    <th className={styles.alignRight}>{t('reports:renewals.daysLeft')}</th>
                    <th>{t('reports:renewals.status')}</th>
                    <th>{t('reports:renewals.note')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRenewals.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {item.customer_id ? (
                          <button className={styles.customerLink} onClick={() => navigate(`/customers/${item.customer_id}`)}>
                            {item.customer_name}
                          </button>
                        ) : (item.customer_name || '-')}
                      </td>
                      <td>{item.product_names?.join(', ') || '-'}</td>
                      <td>{formatDate(item.sale_date)}</td>
                      <td>{formatDate(item.renewal_date)}</td>
                      <td className={styles.alignRight}>
                        <strong className={
                          item.computed_status === 'expired' || item.computed_status === 'red' ? styles.danger
                          : item.computed_status === 'yellow' ? styles.warning
                          : styles.success
                        }>
                          {item.days_remaining}
                        </strong>
                      </td>
                      <td>{getStatusBadge(item.computed_status)}</td>
                      <td>{item.reminder_note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className={`${styles.reportCard} ${styles.fullWidthCard}`}>
            <div className={styles.emptyState}>{t('reports:renewals.noData')}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>{icons.reports}</span>
            {t('reports:title')}
          </h1>
          <p className={styles.subtitle}>{t('reports:subtitle')}</p>
        </div>
        <div className={styles.filters}>
          <input
            type="date"
            className={styles.dateInput}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input
            type="date"
            className={styles.dateInput}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <Button onClick={fetchReports}>{t('reports:filter')}</Button>
        </div>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === 'genel' ? styles.tabActive : ''}`} onClick={() => setActiveTab('genel')}>
          {t('reports:tabs.general')}
        </button>
        <button className={`${styles.tab} ${activeTab === 'satis' ? styles.tabActive : ''}`} onClick={() => setActiveTab('satis')}>
          {t('reports:tabs.sales')}
        </button>
        <button className={`${styles.tab} ${activeTab === 'musteri' ? styles.tabActive : ''}`} onClick={() => setActiveTab('musteri')}>
          {t('reports:tabs.customers')}
        </button>
        <button className={`${styles.tab} ${activeTab === 'musteriSatis' ? styles.tabActive : ''}`} onClick={() => setActiveTab('musteriSatis')}>
          {t('reports:tabs.customerSales')}
        </button>
        <button className={`${styles.tab} ${activeTab === 'stok' ? styles.tabActive : ''}`} onClick={() => setActiveTab('stok')}>
          {t('reports:tabs.stock')}
        </button>
        <button className={`${styles.tab} ${activeTab === 'gider' ? styles.tabActive : ''}`} onClick={() => setActiveTab('gider')}>
          {t('reports:tabs.expenses')}
        </button>
        <button className={`${styles.tab} ${activeTab === 'personel' ? styles.tabActive : ''}`} onClick={() => setActiveTab('personel')}>
          {t('reports:tabs.staff')}
        </button>
        <button className={`${styles.tab} ${activeTab === 'yenileme' ? styles.tabActive : ''}`} onClick={() => setActiveTab('yenileme')}>
          {t('reports:tabs.renewals')}
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}><Spinner size="lg" /></div>
      ) : (
        <>
          {activeTab === 'genel' && renderGenelTab()}
          {activeTab === 'satis' && renderSatisTab()}
          {activeTab === 'musteri' && renderMusteriTab()}
          {activeTab === 'musteriSatis' && renderMusteriSatisTab()}
          {activeTab === 'stok' && renderStokTab()}
          {activeTab === 'gider' && renderGiderTab()}
          {activeTab === 'personel' && renderPersonelTab()}
          {activeTab === 'yenileme' && renderYenilemeTab()}
        </>
      )}
    </div>
  );
}
