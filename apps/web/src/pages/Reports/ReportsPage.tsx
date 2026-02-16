import { useState, useEffect, useCallback } from 'react';
import { Button, Spinner } from '@stok/ui';
import { useToast } from '../../context/ToastContext';
import { reportsApi, TopProduct, TopCustomer, UpcomingPayment, OverduePayment, StockReportProduct, ExpenseByCategory, CustomerProductPurchase, CustomerSale } from '../../api/reports.api';
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

type TabType = 'genel' | 'satis' | 'musteri' | 'musteriSatis' | 'stok' | 'gider';

export function ReportsPage() {
  const { showToast } = useToast();
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

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const [sales, profit, debt, products, customers, upcoming, overdue, stock, returns, expenses, custProducts, custSales] = await Promise.all([
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
    } catch (err) {
      showToast('error', 'Rapor yuklenemedi');
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
          <h3 className={styles.reportCardTitle}>Satis Ozeti</h3>
        </div>
        <div className={styles.reportCardBody}>
          {salesSummary?.summary && (
            <div className={styles.reportGrid}>
              <div className={styles.reportItem}>
                <span>Toplam Satis</span>
                <strong>{salesSummary.summary.sale_count} adet</strong>
              </div>
              <div className={styles.reportItem}>
                <span>Ara Toplam</span>
                <strong>{formatCurrency(parseFloat(salesSummary.summary.subtotal))}</strong>
              </div>
              <div className={styles.reportItem}>
                <span>Toplam Iskonto</span>
                <strong>{formatCurrency(parseFloat(salesSummary.summary.discount_total))}</strong>
              </div>
              <div className={styles.reportItem}>
                <span>Toplam KDV</span>
                <strong>{formatCurrency(parseFloat(salesSummary.summary.vat_total))}</strong>
              </div>
              <div className={styles.reportItem}>
                <span>Genel Toplam</span>
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
          <h3 className={styles.reportCardTitle}>Kar / Zarar</h3>
        </div>
        <div className={styles.reportCardBody}>
          {profitLoss && (
            <div className={styles.reportGrid}>
              <div className={styles.reportItem}>
                <span>Toplam Gelir</span>
                <strong className={styles.success}>{formatCurrency(profitLoss.revenue)}</strong>
              </div>
              <div className={styles.reportItem}>
                <span>Satis Maliyeti</span>
                <strong>{formatCurrency(profitLoss.costOfGoods)}</strong>
              </div>
              <div className={styles.reportItem}>
                <span>Iade Tutari</span>
                <strong>{formatCurrency(profitLoss.returns)}</strong>
              </div>
              <div className={styles.reportItem}>
                <span>Brut Kar</span>
                <strong>{formatCurrency(profitLoss.grossProfit)}</strong>
              </div>
              <div className={styles.reportItem}>
                <span>Toplam Giderler</span>
                <strong className={styles.danger}>{formatCurrency(profitLoss.expenses)}</strong>
              </div>
              <div className={styles.reportItem}>
                <span>Net Kar</span>
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
          <h3 className={styles.reportCardTitle}>Borc / Alacak Ozeti</h3>
        </div>
        <div className={styles.reportCardBody}>
          {debtOverview && (
            <div className={styles.reportGrid}>
              <div className={styles.reportItem}>
                <span>Toplam Borc</span>
                <strong className={styles.danger}>{formatCurrency(debtOverview.totalDebt)}</strong>
              </div>
              <div className={styles.reportItem}>
                <span>Toplam Alacak</span>
                <strong className={styles.success}>{formatCurrency(debtOverview.totalCredit)}</strong>
              </div>
              <div className={styles.reportItem}>
                <span>Net Durum</span>
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
          <h3 className={styles.reportCardTitle}>Geciken Odemeler</h3>
        </div>
        <div className={styles.reportCardBody}>
          {overduePayments && overduePayments.totalCount > 0 ? (
            <>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                  <div className={`${styles.summaryValue} ${styles.danger}`}>{overduePayments.totalCount}</div>
                  <div className={styles.summaryLabel}>Geciken Fatura</div>
                </div>
                <div className={styles.summaryCard}>
                  <div className={`${styles.summaryValue} ${styles.danger}`}>{formatCurrency(overduePayments.totalAmount)}</div>
                  <div className={styles.summaryLabel}>Toplam Tutar</div>
                </div>
              </div>
              <table className={styles.reportTable}>
                <thead>
                  <tr>
                    <th>Fatura</th>
                    <th>Musteri</th>
                    <th>Vade Tarihi</th>
                    <th>Gecikme</th>
                    <th className={styles.alignRight}>Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {overduePayments.overdueList.slice(0, 5).map((p) => (
                    <tr key={p.id}>
                      <td>{p.invoice_number}</td>
                      <td>{p.customer_name || '-'}</td>
                      <td>{formatDate(p.due_date)}</td>
                      <td><span className={`${styles.badge} ${styles.badgeDanger}`}>{p.days_overdue} gun</span></td>
                      <td className={styles.alignRight}><strong>{formatCurrency(p.grand_total)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <div className={styles.emptyState}>Geciken odeme bulunmuyor</div>
          )}
        </div>
      </div>

      {/* Upcoming Payments */}
      <div className={`${styles.reportCard} ${styles.fullWidthCard}`}>
        <div className={styles.reportCardHeader}>
          {icons.calendar}
          <h3 className={styles.reportCardTitle}>Yaklasan Odemeler (30 Gun)</h3>
        </div>
        <div className={styles.reportCardBody}>
          {upcomingPayments.length > 0 ? (
            <table className={styles.reportTable}>
              <thead>
                <tr>
                  <th>Fatura</th>
                  <th>Musteri</th>
                  <th>Vade Tarihi</th>
                  <th className={styles.alignRight}>Tutar</th>
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
            <div className={styles.emptyState}>Yaklasan odeme bulunmuyor</div>
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
          <h3 className={styles.reportCardTitle}>En Cok Satan Urunler</h3>
        </div>
        <div className={styles.reportCardBody}>
          {topProducts.length > 0 ? (
            <table className={styles.reportTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Urun</th>
                  <th className={styles.alignRight}>Adet</th>
                  <th className={styles.alignRight}>Ciro</th>
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
            <div className={styles.emptyState}>Veri bulunamadi</div>
          )}
        </div>
      </div>

      {/* Returns Report */}
      <div className={styles.reportCard}>
        <div className={styles.reportCardHeader}>
          {icons.returns}
          <h3 className={styles.reportCardTitle}>Iade Raporu</h3>
        </div>
        <div className={styles.reportCardBody}>
          {returnsReport ? (
            <>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryValue}>{returnsReport.summary.count}</div>
                  <div className={styles.summaryLabel}>Toplam Iade</div>
                </div>
                <div className={styles.summaryCard}>
                  <div className={`${styles.summaryValue} ${styles.danger}`}>{formatCurrency(returnsReport.summary.total)}</div>
                  <div className={styles.summaryLabel}>Iade Tutari</div>
                </div>
              </div>
              {returnsReport.topReturnedProducts?.length > 0 && (
                <>
                  <h4 style={{ margin: 'var(--space-3) 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>En Cok Iade Edilen Urunler</h4>
                  <table className={styles.reportTable}>
                    <thead>
                      <tr>
                        <th>Urun</th>
                        <th className={styles.alignRight}>Adet</th>
                        <th className={styles.alignRight}>Tutar</th>
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
            <div className={styles.emptyState}>Veri bulunamadi</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderMusteriTab = () => {
    // Musteri bazli gruplama
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

    return (
      <div className={styles.grid}>
        <div className={`${styles.grid} ${styles.twoColGrid}`}>
          {/* Top Customers */}
          <div className={styles.reportCard}>
            <div className={styles.reportCardHeader}>
              {icons.customer}
              <h3 className={styles.reportCardTitle}>En Cok Alisveris Yapan Musteriler</h3>
            </div>
            <div className={styles.reportCardBody}>
              {topCustomers.length > 0 ? (
                <table className={styles.reportTable}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Musteri</th>
                      <th className={styles.alignRight}>Satis</th>
                      <th className={styles.alignRight}>Toplam</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCustomers.map((c, i) => (
                      <tr key={c.id}>
                        <td>{i + 1}</td>
                        <td>
                          <div>{c.name}</div>
                          {c.phone && <small style={{ color: 'var(--color-text-muted)' }}>{c.phone}</small>}
                        </td>
                        <td className={styles.alignRight}>{c.sale_count}</td>
                        <td className={styles.alignRight}><strong className={styles.success}>{formatCurrency(parseFloat(String(c.total_amount)))}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className={styles.emptyState}>Veri bulunamadi</div>
              )}
            </div>
          </div>

          {/* Customers with Debt */}
          <div className={styles.reportCard}>
            <div className={styles.reportCardHeader}>
              {icons.debt}
              <h3 className={styles.reportCardTitle}>Borclu Musteriler</h3>
            </div>
            <div className={styles.reportCardBody}>
              {debtOverview?.customers?.length > 0 ? (
                <table className={styles.reportTable}>
                  <thead>
                    <tr>
                      <th>Musteri</th>
                      <th>Telefon</th>
                      <th className={styles.alignRight}>Bakiye</th>
                    </tr>
                  </thead>
                  <tbody>
                    {debtOverview.customers.filter((c: any) => c.balance < 0).slice(0, 10).map((c: any) => (
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
                <div className={styles.emptyState}>Borclu musteri bulunmuyor</div>
              )}
            </div>
          </div>
        </div>

        {/* Customer Product Purchases */}
        <div className={`${styles.reportCard} ${styles.fullWidthCard}`}>
          <div className={styles.reportCardHeader}>
            {icons.product}
            <h3 className={styles.reportCardTitle}>Musteri Bazli Urun Alim Detayi</h3>
          </div>
          <div className={styles.reportCardBody}>
            {Object.keys(groupedByCustomer).length > 0 ? (
              Object.entries(groupedByCustomer).map(([customerId, customer]) => (
                <div key={customerId} style={{ marginBottom: 'var(--space-4)' }}>
                  <h4 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
                    {customer.name}
                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 'normal', marginLeft: 'var(--space-2)' }}>
                      ({customer.products.reduce((s, p) => s + p.total_quantity, 0)} adet toplam)
                    </span>
                  </h4>
                  <table className={styles.reportTable}>
                    <thead>
                      <tr>
                        <th>Urun</th>
                        <th className={styles.alignRight}>Adet</th>
                        <th className={styles.alignRight}>Tutar</th>
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
              <div className={styles.emptyState}>Musteri urun verisi bulunamadi</div>
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
          <h3 className={styles.reportCardTitle}>Stok Durumu Ozeti</h3>
        </div>
        <div className={styles.reportCardBody}>
          {stockReport?.summary && (
            <div className={styles.summaryGrid}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryValue}>{stockReport.summary.totalProducts}</div>
                <div className={styles.summaryLabel}>Toplam Urun</div>
              </div>
              <div className={styles.summaryCard}>
                <div className={`${styles.summaryValue} ${styles.warning}`}>{stockReport.summary.lowStockCount}</div>
                <div className={styles.summaryLabel}>Dusuk Stok</div>
              </div>
              <div className={styles.summaryCard}>
                <div className={`${styles.summaryValue} ${styles.danger}`}>{stockReport.summary.outOfStockCount}</div>
                <div className={styles.summaryLabel}>Stok Bitti</div>
              </div>
              <div className={styles.summaryCard}>
                <div className={styles.summaryValue}>{formatCurrency(stockReport.summary.totalStockValue)}</div>
                <div className={styles.summaryLabel}>Stok Degeri (Maliyet)</div>
              </div>
              <div className={styles.summaryCard}>
                <div className={styles.summaryValue}>{formatCurrency(stockReport.summary.totalSaleValue)}</div>
                <div className={styles.summaryLabel}>Stok Degeri (Satis)</div>
              </div>
              <div className={styles.summaryCard}>
                <div className={`${styles.summaryValue} ${styles.success}`}>{formatCurrency(stockReport.summary.potentialProfit)}</div>
                <div className={styles.summaryLabel}>Potansiyel Kar</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Low Stock Products */}
      <div className={`${styles.reportCard} ${styles.fullWidthCard}`}>
        <div className={styles.reportCardHeader}>
          {icons.alert}
          <h3 className={styles.reportCardTitle}>Dusuk Stoklu Urunler</h3>
        </div>
        <div className={styles.reportCardBody}>
          {stockReport?.products && stockReport.products.filter(p => p.stock_quantity <= p.min_stock_level).length > 0 ? (
            <table className={styles.reportTable}>
              <thead>
                <tr>
                  <th>Urun</th>
                  <th>Barkod</th>
                  <th className={styles.alignRight}>Mevcut</th>
                  <th className={styles.alignRight}>Minimum</th>
                  <th className={styles.alignRight}>Durum</th>
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
                          {p.stock_quantity === 0 ? 'Tukendi' : 'Dusuk'}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyState}>Dusuk stoklu urun bulunmuyor</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderMusteriSatisTab = () => {
    // Musteri bazli gruplama
    const grouped = customerSales.reduce<Record<string, { name: string; phone: string | null; sales: CustomerSale[] }>>((acc, sale) => {
      if (!acc[sale.customer_id]) {
        acc[sale.customer_id] = { name: sale.customer_name, phone: sale.customer_phone, sales: [] };
      }
      acc[sale.customer_id].sales.push(sale);
      return acc;
    }, {});

    const toggleCustomer = (id: string) => {
      setExpandedCustomer(expandedCustomer === id ? null : id);
    };

    return (
      <div className={styles.grid}>
        <div className={`${styles.reportCard} ${styles.fullWidthCard}`}>
          <div className={styles.reportCardHeader}>
            {icons.customer}
            <h3 className={styles.reportCardTitle}>Musteri Bazli Satislar</h3>
          </div>
          <div className={styles.reportCardBody}>
            {Object.keys(grouped).length > 0 ? (
              Object.entries(grouped).map(([customerId, customer]) => {
                const totalAmount = customer.sales.reduce((s, sale) => s + parseFloat(String(sale.grand_total)), 0);
                const isExpanded = expandedCustomer === customerId;

                return (
                  <div key={customerId} style={{ marginBottom: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <div
                      onClick={() => toggleCustomer(customerId)}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: 'var(--space-3) var(--space-4)', cursor: 'pointer',
                        background: isExpanded ? 'var(--color-bg-secondary)' : 'transparent',
                      }}
                    >
                      <div>
                        <strong>{customer.name}</strong>
                        {customer.phone && <span style={{ color: 'var(--color-text-muted)', marginLeft: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}>{customer.phone}</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>{customer.sales.length} satis</span>
                        <strong className={styles.success}>{formatCurrency(totalAmount)}</strong>
                        <span style={{ fontSize: '12px' }}>{isExpanded ? '▲' : '▼'}</span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div style={{ padding: '0 var(--space-4) var(--space-3)' }}>
                        {customer.sales.map((sale) => (
                          <div key={sale.id} style={{ marginBottom: 'var(--space-3)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-1)' }}>
                              <span style={{ fontSize: 'var(--font-size-sm)' }}>
                                <strong>{sale.invoice_number}</strong>
                                <span style={{ color: 'var(--color-text-muted)', marginLeft: 'var(--space-2)' }}>{formatDate(sale.sale_date)}</span>
                                <span style={{ color: 'var(--color-text-muted)', marginLeft: 'var(--space-2)' }}>
                                  ({PAYMENT_METHODS[sale.payment_method as keyof typeof PAYMENT_METHODS] || sale.payment_method})
                                </span>
                              </span>
                              <strong>{formatCurrency(parseFloat(String(sale.grand_total)))}</strong>
                            </div>
                            {sale.items.length > 0 && (
                              <table className={styles.reportTable} style={{ marginTop: 'var(--space-1)' }}>
                                <thead>
                                  <tr>
                                    <th>Urun</th>
                                    <th className={styles.alignRight}>Adet</th>
                                    <th className={styles.alignRight}>Birim Fiyat</th>
                                    <th className={styles.alignRight}>Toplam</th>
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
              })
            ) : (
              <div className={styles.emptyState}>Musteri satisi bulunamadi</div>
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
          <h3 className={styles.reportCardTitle}>Kategori Bazli Giderler</h3>
        </div>
        <div className={styles.reportCardBody}>
          {expensesReport?.byCategory && expensesReport.byCategory.length > 0 ? (
            <>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryValue}>{expensesReport.summary.count}</div>
                  <div className={styles.summaryLabel}>Toplam Kayit</div>
                </div>
                <div className={styles.summaryCard}>
                  <div className={`${styles.summaryValue} ${styles.danger}`}>{formatCurrency(expensesReport.summary.total)}</div>
                  <div className={styles.summaryLabel}>Toplam Gider</div>
                </div>
              </div>
              <table className={styles.reportTable}>
                <thead>
                  <tr>
                    <th>Kategori</th>
                    <th className={styles.alignRight}>Kayit</th>
                    <th className={styles.alignRight}>Tutar</th>
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
            <div className={styles.emptyState}>Gider verisi bulunamadi</div>
          )}
        </div>
      </div>

      {/* Monthly Trend */}
      <div className={styles.reportCard}>
        <div className={styles.reportCardHeader}>
          {icons.calendar}
          <h3 className={styles.reportCardTitle}>Aylik Gider Trendi</h3>
        </div>
        <div className={styles.reportCardBody}>
          {expensesReport?.monthlyTrend && expensesReport.monthlyTrend.length > 0 ? (
            <table className={styles.reportTable}>
              <thead>
                <tr>
                  <th>Ay</th>
                  <th className={styles.alignRight}>Tutar</th>
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
            <div className={styles.emptyState}>Veri bulunamadi</div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>{icons.reports}</span>
            Raporlar
          </h1>
          <p className={styles.subtitle}>Finansal raporlar ve analizler</p>
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
          <Button onClick={fetchReports}>Filtrele</Button>
        </div>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === 'genel' ? styles.tabActive : ''}`} onClick={() => setActiveTab('genel')}>
          Genel Ozet
        </button>
        <button className={`${styles.tab} ${activeTab === 'satis' ? styles.tabActive : ''}`} onClick={() => setActiveTab('satis')}>
          Satis & Iade
        </button>
        <button className={`${styles.tab} ${activeTab === 'musteri' ? styles.tabActive : ''}`} onClick={() => setActiveTab('musteri')}>
          Musteriler
        </button>
        <button className={`${styles.tab} ${activeTab === 'musteriSatis' ? styles.tabActive : ''}`} onClick={() => setActiveTab('musteriSatis')}>
          Musteri Satislari
        </button>
        <button className={`${styles.tab} ${activeTab === 'stok' ? styles.tabActive : ''}`} onClick={() => setActiveTab('stok')}>
          Stok Durumu
        </button>
        <button className={`${styles.tab} ${activeTab === 'gider' ? styles.tabActive : ''}`} onClick={() => setActiveTab('gider')}>
          Giderler
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
        </>
      )}
    </div>
  );
}
