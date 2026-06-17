import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Spinner } from '@stok/ui';
import { useToast } from '../../context/ToastContext';
import { reportsApi, TopProduct, TopCustomer, UpcomingPayment, OverduePayment, StockReportProduct, ExpenseByCategory, CustomerProductPurchase, CustomerSale, EmployeePerformanceReport, RenewalsReport, RenewalItem, SalesReturnsDetailReport, StockDetailReport } from '../../api/reports.api';
import { useAuth } from '../../hooks/useAuth';
import { useTenant } from '../../context/TenantContext';
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

type TabType = 'genel' | 'satis' | 'alis' | 'musteri' | 'musteriSatis' | 'stok' | 'gider' | 'personel' | 'yenileme' | 'gunSonu' | 'yaslandirma' | 'karlilik' | 'kasa';

const VALID_TABS: TabType[] = ['genel', 'gunSonu', 'satis', 'alis', 'karlilik', 'musteri', 'musteriSatis', 'yaslandirma', 'stok', 'gider', 'kasa', 'personel', 'yenileme'];
const ADVANCED_TABS: TabType[] = ['musteriSatis', 'gider', 'personel', 'yenileme', 'yaslandirma', 'karlilik'];

const PERIOD_PRESETS = ['buAy', '1ay', '3ay', '6ay', '1yil'] as const;
type PeriodPreset = (typeof PERIOD_PRESETS)[number] | 'ozel';

// Hazır periyot seçimleri için [başlangıç, bitiş] tarih aralığı (YYYY-MM-DD) hesaplar.
function computePresetRange(key: (typeof PERIOD_PRESETS)[number]): [string, string] {
  const start = new Date();
  const end = new Date();
  switch (key) {
    case 'buAy': start.setDate(1); break;
    case '1ay': start.setMonth(start.getMonth() - 1); break;
    case '3ay': start.setMonth(start.getMonth() - 3); break;
    case '6ay': start.setMonth(start.getMonth() - 6); break;
    case '1yil': start.setFullYear(start.getFullYear() - 1); break;
  }
  return [start.toISOString().split('T')[0], end.toISOString().split('T')[0]];
}

export function ReportsPage() {
  const { t } = useTranslation(['reports', 'common']);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { hasFeature } = useTenant();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (VALID_TABS.includes(searchParams.get('tab') as TabType) ? searchParams.get('tab') : 'genel') as TabType;
  const [activeTab, setActiveTabState] = useState<TabType>(initialTab);
  const focusRef = useRef<string | null>(searchParams.get('focus'));

  const setActiveTab = (tab: TabType) => {
    setActiveTabState(tab);
    const params = new URLSearchParams(searchParams);
    if (tab === 'genel') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    params.delete('focus');
    setSearchParams(params, { replace: true });
  };
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  // Varsayılan aralık "son 1 ay" olduğundan başlangıç preset'i '1ay'.
  const [activePreset, setActivePreset] = useState<PeriodPreset>('1ay');
  const applyPreset = (key: (typeof PERIOD_PRESETS)[number]) => {
    const [s, e] = computePresetRange(key);
    setStartDate(s);
    setEndDate(e);
    setActivePreset(key);
    // startDate/endDate değişince fetchReports (useCallback) otomatik yeniden çalışır.
  };
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

  // Yeni raporlar
  const [endOfDayDate, setEndOfDayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endOfDayReport, setEndOfDayReport] = useState<any>(null);
  const [agingReport, setAgingReport] = useState<any>(null);
  const [productProfitability, setProductProfitability] = useState<any>(null);
  const [purchasesSummary, setPurchasesSummary] = useState<any>(null);
  const [accountMovementsReport, setAccountMovementsReport] = useState<any>(null);
  const [accountFilterId, setAccountFilterId] = useState('');
  const [salesReturnsDetail, setSalesReturnsDetail] = useState<SalesReturnsDetailReport | null>(null);
  const [stockDetail, setStockDetail] = useState<StockDetailReport | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    // Bir endpoint başarısız olursa diğerleri etkilenmesin (örn. Basic'te gelişmiş raporlar 403 döner).
    const safe = <T,>(p: Promise<T>): Promise<T | null> => p.catch(() => null);
    const isAdvanced = hasFeature('advancedReports');
    try {
      const [sales, profit, debt, products, customers, upcoming, overdue, stock, returns, expenses, custProducts, custSales, empPerf, renewals, eod, aging, profit2] = await Promise.all([
        safe(reportsApi.getSalesSummary(startDate, endDate)),
        isAdvanced ? safe(reportsApi.getProfitLoss(startDate, endDate)) : Promise.resolve(null),
        safe(reportsApi.getDebtOverview()),
        safe(reportsApi.getTopProducts(startDate, endDate, 10)),
        safe(reportsApi.getTopCustomers(startDate, endDate, 10)),
        safe(reportsApi.getUpcomingPayments(30)),
        safe(reportsApi.getOverduePayments()),
        safe(reportsApi.getStockReport()),
        safe(reportsApi.getReturnsReport(startDate, endDate)),
        isAdvanced ? safe(reportsApi.getExpensesByCategory(startDate, endDate)) : Promise.resolve(null),
        isAdvanced ? safe(reportsApi.getCustomerProductPurchases(startDate, endDate)) : Promise.resolve(null),
        safe(reportsApi.getCustomerSales(startDate, endDate)),
        isAdvanced ? safe(reportsApi.getEmployeePerformance(startDate, endDate)) : Promise.resolve(null),
        isAdvanced ? safe(reportsApi.getRenewals()) : Promise.resolve(null),
        safe(reportsApi.getEndOfDay(endOfDayDate)),
        isAdvanced ? safe(reportsApi.getAging()) : Promise.resolve(null),
        isAdvanced ? safe(reportsApi.getProductProfitability(startDate, endDate)) : Promise.resolve(null),
      ]);
      const [purSum, accMov, srDetail, stkDetail] = await Promise.all([
        safe(reportsApi.getPurchasesSummary(startDate, endDate)),
        safe(reportsApi.getAccountMovements(startDate, endDate, accountFilterId || undefined)),
        safe(reportsApi.getSalesReturnsDetail(startDate, endDate)),
        safe(reportsApi.getStockDetail(startDate, endDate)),
      ]);
      if (sales) setSalesSummary(sales.data);
      if (profit) setProfitLoss(profit.data);
      if (debt) setDebtOverview(debt.data);
      if (products) setTopProducts(products.data);
      if (customers) setTopCustomers(customers.data);
      if (upcoming) setUpcomingPayments(upcoming.data);
      if (overdue) setOverduePayments(overdue.data);
      if (stock) setStockReport(stock.data);
      if (returns) setReturnsReport(returns.data);
      if (expenses) setExpensesReport(expenses.data);
      if (custProducts) setCustomerProducts(custProducts.data);
      if (custSales) setCustomerSales(custSales.data);
      if (empPerf) setEmployeePerformance(empPerf.data);
      if (renewals) setRenewalsReport(renewals.data);
      if (eod) setEndOfDayReport(eod.data);
      if (aging) setAgingReport(aging.data);
      if (profit2) setProductProfitability(profit2.data);
      if (purSum) setPurchasesSummary(purSum.data);
      if (accMov) setAccountMovementsReport(accMov.data);
      if (srDetail) setSalesReturnsDetail(srDetail.data);
      if (stkDetail) setStockDetail(stkDetail.data);
    } catch (err) {
      showToast('error', t('reports:loadFailed'));
    }
    setLoading(false);
  }, [startDate, endDate, endOfDayDate, accountFilterId, hasFeature]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  // Plan'da advancedReports yoksa o sekmelerden ana sekmeye düş
  useEffect(() => {
    if (ADVANCED_TABS.includes(activeTab) && !hasFeature('advancedReports')) {
      setActiveTabState('genel');
    }
  }, [activeTab, hasFeature]);

  // Aynı sayfada URL'deki tab değiştiğinde state'i senkronize et (bildirim tıklamasıyla)
  useEffect(() => {
    const urlTab = searchParams.get('tab');
    if (urlTab && VALID_TABS.includes(urlTab as TabType) && urlTab !== activeTab) {
      setActiveTabState(urlTab as TabType);
    }
    const urlFocus = searchParams.get('focus');
    if (urlFocus) focusRef.current = urlFocus;
  }, [searchParams]);

  // Yüklemeden sonra ?focus=<id> varsa ilgili karta scroll
  useEffect(() => {
    if (loading || !focusRef.current) return;
    const target = focusRef.current;
    // Kısa gecikme: tab değişimi sonrası DOM'un render olmasını bekle
    const timer = setTimeout(() => {
      const el = document.getElementById(target);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        el.classList.add(styles.flashHighlight);
        setTimeout(() => el.classList.remove(styles.flashHighlight), 2000);
      }
    }, 100);
    focusRef.current = null;
    return () => clearTimeout(timer);
  }, [loading, activeTab]);

  // ── Gün Sonu (Z) Raporu ─────────────────────────────────
  const renderGunSonuTab = () => (
    <div className={styles.grid}>
      <div className={styles.reportCard}>
        <div className={styles.reportCardHeader}>
          {icons.sales}
          <h3 className={styles.reportCardTitle}>{t('reports:endOfDay.title')}</h3>
        </div>
        <div className={styles.reportCardBody}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <label>{t('reports:endOfDay.date')}:</label>
            <input
              type="date"
              className={styles.dateInput}
              value={endOfDayDate}
              onChange={(e) => setEndOfDayDate(e.target.value)}
            />
          </div>

          {endOfDayReport ? (
            <>
              {/* Satış özet */}
              <div className={styles.summaryGrid}>
                <div className={styles.summaryItem}>
                  <span>{t('reports:endOfDay.salesCount')}</span>
                  <strong>{endOfDayReport.sales.count}</strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>{t('reports:endOfDay.salesTotal')}</span>
                  <strong className={styles.success}>{formatCurrency(endOfDayReport.sales.total)}</strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>{t('reports:endOfDay.returnsTotal')}</span>
                  <strong className={styles.danger}>−{formatCurrency(endOfDayReport.returns.total)}</strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>{t('reports:endOfDay.netSales')}</span>
                  <strong>{formatCurrency(endOfDayReport.netSales)}</strong>
                </div>
              </div>

              {/* Ödeme tipi kırılımı */}
              {Object.keys(endOfDayReport.sales.byPaymentMethod).length > 0 && (
                <>
                  <h4 style={{ marginTop: 24 }}>{t('reports:endOfDay.byPaymentMethod')}</h4>
                  <div className={styles.tableWrap}>
                    <table className={styles.reportTable}>
                      <thead>
                        <tr>
                          <th>{t('reports:endOfDay.method')}</th>
                          <th className={styles.alignRight}>{t('reports:endOfDay.count')}</th>
                          <th className={styles.alignRight}>{t('reports:endOfDay.amount')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(endOfDayReport.sales.byPaymentMethod).map(([method, v]: any) => (
                          <tr key={method}>
                            <td>{t(`sales:paymentMethods.${method}`, { defaultValue: method })}</td>
                            <td className={styles.alignRight}>{v.count}</td>
                            <td className={styles.alignRight}><strong>{formatCurrency(v.total)}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* Kasa akışı */}
              <h4 style={{ marginTop: 24 }}>{t('reports:endOfDay.cashFlow')}</h4>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryItem}>
                  <span>{t('reports:endOfDay.cashIn')}</span>
                  <strong className={styles.success}>+{formatCurrency(endOfDayReport.cashFlow.in)}</strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>{t('reports:endOfDay.cashOut')}</span>
                  <strong className={styles.danger}>−{formatCurrency(endOfDayReport.cashFlow.out)}</strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>{t('reports:endOfDay.netCash')}</span>
                  <strong>{formatCurrency(endOfDayReport.cashFlow.net)}</strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>{t('reports:endOfDay.expenses')}</span>
                  <strong className={styles.danger}>{formatCurrency(endOfDayReport.expenses.total)}</strong>
                </div>
              </div>

              {/* Tahsilatlar + iptaller (info) */}
              {(endOfDayReport.payments.count > 0 || endOfDayReport.cancelledSales.count > 0) && (
                <div className={styles.summaryGrid} style={{ marginTop: 16 }}>
                  {endOfDayReport.payments.count > 0 && (
                    <div className={styles.summaryItem}>
                      <span>{t('reports:endOfDay.payments')}</span>
                      <strong>{formatCurrency(endOfDayReport.payments.total)} ({endOfDayReport.payments.count})</strong>
                    </div>
                  )}
                  {endOfDayReport.cancelledSales.count > 0 && (
                    <div className={styles.summaryItem}>
                      <span>{t('reports:endOfDay.cancelledSales')}</span>
                      <strong>{endOfDayReport.cancelledSales.count} · {formatCurrency(endOfDayReport.cancelledSales.total)}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Hesap bakiyeleri snapshot */}
              <h4 style={{ marginTop: 24 }}>{t('reports:endOfDay.accountBalances')}</h4>
              <div className={styles.tableWrap}>
                <table className={styles.reportTable}>
                  <thead>
                    <tr>
                      <th>{t('reports:endOfDay.accountName')}</th>
                      <th>{t('reports:endOfDay.accountType')}</th>
                      <th className={styles.alignRight}>{t('reports:endOfDay.balance')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endOfDayReport.accountBalances.map((a: any) => (
                      <tr key={a.id}>
                        <td>{a.name}{a.is_default && ' ★'}</td>
                        <td>{t(`accounts:accountTypes.${a.account_type}`, { defaultValue: a.account_type })}</td>
                        <td className={styles.alignRight}><strong>{formatCurrency(a.current_balance)}</strong></td>
                      </tr>
                    ))}
                    <tr style={{ background: 'rgba(0,0,0,0.04)' }}>
                      <td colSpan={2}><strong>{t('reports:endOfDay.totalBalance')}</strong></td>
                      <td className={styles.alignRight}><strong>{formatCurrency(endOfDayReport.totalAccountBalance)}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>{t('reports:endOfDay.noData')}</div>
          )}
        </div>
      </div>
    </div>
  );

  // ── Ürün Bazlı Kârlılık ─────────────────────────────────
  const renderKarlilikTab = () => (
    <div className={styles.grid}>
      <div className={styles.reportCard}>
        <div className={styles.reportCardHeader}>
          {icons.sales}
          <h3 className={styles.reportCardTitle}>{t('reports:profitability.title')}</h3>
        </div>
        <div className={styles.reportCardBody}>
          {productProfitability && productProfitability.products.length > 0 ? (
            <>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryItem}>
                  <span>{t('reports:profitability.totalRevenue')}</span>
                  <strong>{formatCurrency(productProfitability.summary.total_revenue)}</strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>{t('reports:profitability.totalCogs')}</span>
                  <strong className={styles.danger}>{formatCurrency(productProfitability.summary.total_cogs)}</strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>{t('reports:profitability.grossProfit')}</span>
                  <strong className={styles.success}>{formatCurrency(productProfitability.summary.gross_profit)}</strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>{t('reports:profitability.margin')}</span>
                  <strong>%{productProfitability.summary.margin_percent}</strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>{t('reports:profitability.totalQuantity')}</span>
                  <strong>{productProfitability.summary.total_quantity}</strong>
                </div>
              </div>

              <p className={styles.noteText} style={{ marginTop: 12, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                {t('reports:profitability.cogsNote')}
              </p>

              <div className={styles.tableWrap} style={{ marginTop: 16 }}>
                <table className={styles.reportTable}>
                  <thead>
                    <tr>
                      <th>{t('reports:profitability.product')}</th>
                      <th className={styles.alignRight}>{t('reports:profitability.quantity')}</th>
                      <th className={styles.alignRight}>{t('reports:profitability.revenue')}</th>
                      <th className={styles.alignRight}>{t('reports:profitability.cogs')}</th>
                      <th className={styles.alignRight}>{t('reports:profitability.profit')}</th>
                      <th className={styles.alignRight}>{t('reports:profitability.marginCol')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productProfitability.products.map((p: any) => (
                      <tr key={p.id}>
                        <td>
                          <div>{p.name}</div>
                          {p.barcode && <div className={styles.barcode}>{p.barcode}</div>}
                        </td>
                        <td className={styles.alignRight}>{parseFloat(String(p.total_quantity))} {p.unit || ''}</td>
                        <td className={styles.alignRight}>{formatCurrency(p.total_revenue)}</td>
                        <td className={styles.alignRight}>{formatCurrency(p.total_cogs)}</td>
                        <td className={`${styles.alignRight} ${p.gross_profit < 0 ? styles.danger : styles.success}`}>
                          <strong>{formatCurrency(p.gross_profit)}</strong>
                        </td>
                        <td className={styles.alignRight}>%{p.margin_percent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>{t('reports:profitability.noData')}</div>
          )}
        </div>
      </div>
    </div>
  );

  // ── Cari Yaşlandırma ────────────────────────────────────
  const renderYaslandirmaTab = () => (
    <div className={styles.grid}>
      <div className={styles.reportCard}>
        <div className={styles.reportCardHeader}>
          {icons.debt}
          <h3 className={styles.reportCardTitle}>{t('reports:aging.title')}</h3>
        </div>
        <div className={styles.reportCardBody}>
          {agingReport && agingReport.customers.length > 0 ? (
            <>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryItem}>
                  <span>{t('reports:aging.bucket_0_30')}</span>
                  <strong>{formatCurrency(agingReport.summary['0_30'])}</strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>{t('reports:aging.bucket_30_60')}</span>
                  <strong className={styles.warning}>{formatCurrency(agingReport.summary['30_60'])}</strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>{t('reports:aging.bucket_60_90')}</span>
                  <strong className={styles.warning}>{formatCurrency(agingReport.summary['60_90'])}</strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>{t('reports:aging.bucket_90_plus')}</span>
                  <strong className={styles.danger}>{formatCurrency(agingReport.summary['90_plus'])}</strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>{t('reports:aging.total')}</span>
                  <strong>{formatCurrency(agingReport.summary.total)}</strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>{t('reports:aging.customerCount')}</span>
                  <strong>{agingReport.summary.customer_count}</strong>
                </div>
              </div>

              <p className={styles.noteText} style={{ marginTop: 12, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                {t('reports:aging.note')}
              </p>

              <div className={styles.tableWrap} style={{ marginTop: 16 }}>
                <table className={styles.reportTable}>
                  <thead>
                    <tr>
                      <th>{t('reports:aging.customer')}</th>
                      <th className={styles.alignRight}>0-30</th>
                      <th className={styles.alignRight}>30-60</th>
                      <th className={styles.alignRight}>60-90</th>
                      <th className={styles.alignRight}>90+</th>
                      <th className={styles.alignRight}>{t('reports:aging.total')}</th>
                      <th className={styles.alignRight}>{t('reports:aging.oldest')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agingReport.customers.map((c: any, i: number) => (
                      <tr key={c.customer_id || i}>
                        <td>
                          {c.customer_id ? (
                            <span className={styles.linkLike} onClick={() => navigate(`/customers/${c.customer_id}`)} style={{ cursor: 'pointer', color: 'var(--color-primary, #3b82f6)' }}>
                              {c.customer_name}
                            </span>
                          ) : c.customer_name}
                          <div className={styles.barcode}>{c.sale_count} {t('reports:aging.invoices')}</div>
                        </td>
                        <td className={styles.alignRight}>{c.buckets['0_30'] > 0 ? formatCurrency(c.buckets['0_30']) : '-'}</td>
                        <td className={`${styles.alignRight} ${c.buckets['30_60'] > 0 ? styles.warning : ''}`}>{c.buckets['30_60'] > 0 ? formatCurrency(c.buckets['30_60']) : '-'}</td>
                        <td className={`${styles.alignRight} ${c.buckets['60_90'] > 0 ? styles.warning : ''}`}>{c.buckets['60_90'] > 0 ? formatCurrency(c.buckets['60_90']) : '-'}</td>
                        <td className={`${styles.alignRight} ${c.buckets['90_plus'] > 0 ? styles.danger : ''}`}>{c.buckets['90_plus'] > 0 ? formatCurrency(c.buckets['90_plus']) : '-'}</td>
                        <td className={styles.alignRight}><strong>{formatCurrency(c.total)}</strong></td>
                        <td className={styles.alignRight}>{c.oldest_days_overdue} {t('reports:general.days')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>{t('reports:aging.noData')}</div>
          )}
        </div>
      </div>
    </div>
  );

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
                <strong>{formatCurrency(salesSummary.summary.subtotal)}</strong>
              </div>
              <div className={styles.reportItem}>
                <span>{t('reports:general.totalDiscount')}</span>
                <strong>{formatCurrency(salesSummary.summary.discount_total)}</strong>
              </div>
              <div className={styles.reportItem}>
                <span>{t('reports:general.totalVat')}</span>
                <strong>{formatCurrency(salesSummary.summary.vat_total)}</strong>
              </div>
              <div className={styles.reportItem}>
                <span>{t('reports:general.grandTotal')}</span>
                <strong className={styles.success}>{formatCurrency(salesSummary.summary.grand_total)}</strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Profit/Loss — gelişmiş rapor */}
      {hasFeature('advancedReports') && (
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
      )}

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
      <div id="overdue-payments" className={`${styles.reportCard} ${styles.fullWidthCard}`}>
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
              <div className={styles.tableWrap}>
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
              </div>
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
            <div className={styles.tableWrap}>
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
            </div>
          ) : (
            <div className={styles.emptyState}>{t('reports:general.noUpcomingPayments')}</div>
          )}
        </div>
      </div>

      {/* Ödeme Tipine Göre Satış */}
      <div className={`${styles.reportCard} ${styles.fullWidthCard}`}>
        <div className={styles.reportCardHeader}>
          {icons.sales}
          <h3 className={styles.reportCardTitle}>{t('reports:general.byPaymentMethod')}</h3>
        </div>
        <div className={styles.reportCardBody}>
          {salesSummary?.byPaymentMethod?.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.reportTable}>
                <thead>
                  <tr>
                    <th>{t('reports:general.method')}</th>
                    <th className={styles.alignRight}>{t('reports:general.count')}</th>
                    <th className={styles.alignRight}>{t('reports:general.amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {salesSummary.byPaymentMethod.map((m: any) => (
                    <tr key={m.payment_method}>
                      <td>{t(`sales:paymentMethods.${m.payment_method}`, { defaultValue: m.payment_method })}</td>
                      <td className={styles.alignRight}>{m.count}</td>
                      <td className={styles.alignRight}><strong>{formatCurrency(m.total)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyState}>{t('reports:noData')}</div>
          )}
        </div>
      </div>

      {/* Günlük Satış Trendi */}
      <div className={`${styles.reportCard} ${styles.fullWidthCard}`}>
        <div className={styles.reportCardHeader}>
          {icons.calendar}
          <h3 className={styles.reportCardTitle}>{t('reports:general.dailyTrend')}</h3>
        </div>
        <div className={styles.reportCardBody}>
          {salesSummary?.dailySales?.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.reportTable}>
                <thead>
                  <tr>
                    <th>{t('reports:general.date')}</th>
                    <th className={styles.alignRight}>{t('reports:general.count')}</th>
                    <th className={styles.alignRight}>{t('reports:general.amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {salesSummary.dailySales.map((d: any) => (
                    <tr key={d.date}>
                      <td>{formatDate(d.date)}</td>
                      <td className={styles.alignRight}>{d.count}</td>
                      <td className={styles.alignRight}><strong>{formatCurrency(d.total)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyState}>{t('reports:noData')}</div>
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
            <div className={styles.tableWrap}>
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
                      <td className={styles.alignRight}><strong>{formatCurrency(p.total_revenue)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                  <div className={styles.tableWrap}>
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
                            <td className={styles.alignRight}>{formatCurrency(p.total_amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              {returnsReport.byReason?.length > 0 && (
                <>
                  <h4 style={{ margin: 'var(--space-3) 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>{t('reports:sales.byReason')}</h4>
                  <div className={styles.tableWrap}>
                    <table className={styles.reportTable}>
                      <thead>
                        <tr>
                          <th>{t('reports:sales.reason')}</th>
                          <th className={styles.alignRight}>{t('reports:sales.returnQuantity')}</th>
                          <th className={styles.alignRight}>{t('reports:sales.returnTotal')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {returnsReport.byReason.map((r: any, i: number) => (
                          <tr key={r.reason || i}>
                            <td>{r.reason || '-'}</td>
                            <td className={styles.alignRight}>{Number(r.count)}</td>
                            <td className={styles.alignRight}>{formatCurrency(Number(r.total))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className={styles.emptyState}>{t('reports:noData')}</div>
          )}
        </div>
      </div>

      {/* Ürün Bazında Satış & İade Detayı */}
      <div className={`${styles.reportCard} ${styles.fullWidthCard}`}>
        <div className={styles.reportCardHeader}>
          {icons.sales}
          <h3 className={styles.reportCardTitle}>{t('reports:salesDetail.title')}</h3>
        </div>
        <div className={styles.reportCardBody}>
          {salesReturnsDetail && salesReturnsDetail.products.length > 0 ? (
            <>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryValue}>{salesReturnsDetail.summary.sold_quantity}</div>
                  <div className={styles.summaryLabel}>{t('reports:salesDetail.totalSoldQty')}</div>
                </div>
                <div className={styles.summaryCard}>
                  <div className={`${styles.summaryValue} ${styles.success}`}>{formatCurrency(salesReturnsDetail.summary.sold_revenue)}</div>
                  <div className={styles.summaryLabel}>{t('reports:salesDetail.totalSoldRevenue')}</div>
                </div>
                <div className={styles.summaryCard}>
                  <div className={`${styles.summaryValue} ${styles.danger}`}>{salesReturnsDetail.summary.returned_quantity}</div>
                  <div className={styles.summaryLabel}>{t('reports:salesDetail.totalReturnedQty')}</div>
                </div>
                <div className={styles.summaryCard}>
                  <div className={`${styles.summaryValue} ${styles.danger}`}>{formatCurrency(salesReturnsDetail.summary.returned_amount)}</div>
                  <div className={styles.summaryLabel}>{t('reports:salesDetail.totalReturnedAmount')}</div>
                </div>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryValue}>{formatCurrency(salesReturnsDetail.summary.net_revenue)}</div>
                  <div className={styles.summaryLabel}>{t('reports:salesDetail.netRevenue')}</div>
                </div>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryValue}>%{salesReturnsDetail.summary.return_rate_percent}</div>
                  <div className={styles.summaryLabel}>{t('reports:salesDetail.returnRate')}</div>
                </div>
              </div>
              <div className={styles.tableWrap}>
                <table className={styles.reportTable}>
                  <thead>
                    <tr>
                      <th>{t('reports:salesDetail.product')}</th>
                      <th className={styles.alignRight}>{t('reports:salesDetail.soldQty')}</th>
                      <th className={styles.alignRight}>{t('reports:salesDetail.soldRevenue')}</th>
                      <th className={styles.alignRight}>{t('reports:salesDetail.returnedQty')}</th>
                      <th className={styles.alignRight}>{t('reports:salesDetail.returnedAmount')}</th>
                      <th className={styles.alignRight}>{t('reports:salesDetail.netQty')}</th>
                      <th className={styles.alignRight}>{t('reports:salesDetail.netRevenue')}</th>
                      <th className={styles.alignRight}>{t('reports:salesDetail.returnRate')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesReturnsDetail.products.map((p) => (
                      <tr key={p.id}>
                        <td>
                          {p.name}
                          {p.barcode && <span className={styles.barcode} style={{ display: 'block' }}>{p.barcode}</span>}
                        </td>
                        <td className={styles.alignRight}>{p.sold_quantity}</td>
                        <td className={styles.alignRight}>{formatCurrency(p.sold_revenue)}</td>
                        <td className={styles.alignRight}>{p.returned_quantity || '-'}</td>
                        <td className={styles.alignRight}>{p.returned_amount ? formatCurrency(p.returned_amount) : '-'}</td>
                        <td className={styles.alignRight}>{p.net_quantity}</td>
                        <td className={styles.alignRight}><strong>{formatCurrency(p.net_revenue)}</strong></td>
                        <td className={styles.alignRight}>{p.return_rate_percent ? `%${p.return_rate_percent}` : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>{t('reports:noData')}</div>
          )}
        </div>
      </div>

      {/* Aylık Satış Trendi */}
      <div className={`${styles.reportCard} ${styles.fullWidthCard}`}>
        <div className={styles.reportCardHeader}>
          {icons.calendar}
          <h3 className={styles.reportCardTitle}>{t('reports:salesDetail.monthlyTitle')}</h3>
        </div>
        <div className={styles.reportCardBody}>
          {salesReturnsDetail && salesReturnsDetail.monthlyTrend.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.reportTable}>
                <thead>
                  <tr>
                    <th>{t('reports:salesDetail.month')}</th>
                    <th className={styles.alignRight}>{t('reports:salesDetail.saleCount')}</th>
                    <th className={styles.alignRight}>{t('reports:salesDetail.soldRevenue')}</th>
                    <th className={styles.alignRight}>{t('reports:salesDetail.returnedAmount')}</th>
                    <th className={styles.alignRight}>{t('reports:salesDetail.netRevenue')}</th>
                  </tr>
                </thead>
                <tbody>
                  {salesReturnsDetail.monthlyTrend.map((m) => (
                    <tr key={m.month}>
                      <td>{m.month}</td>
                      <td className={styles.alignRight}>{m.sale_count}</td>
                      <td className={styles.alignRight}>{formatCurrency(m.sold_revenue)}</td>
                      <td className={styles.alignRight}>{m.returned_amount ? formatCurrency(m.returned_amount) : '-'}</td>
                      <td className={styles.alignRight}><strong>{formatCurrency(m.net_revenue)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyState}>{t('reports:noData')}</div>
          )}
        </div>
      </div>
    </div>
  );

  // ── Alış Raporu ─────────────────────────────────────────
  const renderAlisTab = () => (
    <div className={`${styles.grid} ${styles.twoColGrid}`}>
      {/* Alış özeti */}
      <div className={styles.reportCard}>
        <div className={styles.reportCardHeader}>
          {icons.product}
          <h3 className={styles.reportCardTitle}>{t('reports:purchases.summaryTitle')}</h3>
        </div>
        <div className={styles.reportCardBody}>
          {purchasesSummary ? (
            <>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryValue}>{purchasesSummary.summary.purchase_count}</div>
                  <div className={styles.summaryLabel}>{t('reports:purchases.count')}</div>
                </div>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryValue}>{formatCurrency(purchasesSummary.summary.grand_total)}</div>
                  <div className={styles.summaryLabel}>{t('reports:purchases.grandTotal')}</div>
                </div>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryValue}>{formatCurrency(purchasesSummary.summary.subtotal)}</div>
                  <div className={styles.summaryLabel}>{t('reports:purchases.subtotal')}</div>
                </div>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryValue}>{formatCurrency(purchasesSummary.summary.vat_total)}</div>
                  <div className={styles.summaryLabel}>{t('reports:purchases.vatTotal')}</div>
                </div>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryValue}>{formatCurrency(purchasesSummary.summary.discount_total)}</div>
                  <div className={styles.summaryLabel}>{t('reports:purchases.discountTotal')}</div>
                </div>
              </div>

              {purchasesSummary.byPaymentMethod?.length > 0 && (
                <>
                  <h4 style={{ marginTop: 24 }}>{t('reports:purchases.byPaymentMethod')}</h4>
                  <div className={styles.tableWrap}>
                    <table className={styles.reportTable}>
                      <thead>
                        <tr>
                          <th>{t('reports:purchases.method')}</th>
                          <th className={styles.alignRight}>{t('reports:purchases.count')}</th>
                          <th className={styles.alignRight}>{t('reports:purchases.amount')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchasesSummary.byPaymentMethod.map((p: any) => (
                          <tr key={p.payment_method}>
                            <td>{t(`sales:paymentMethods.${p.payment_method}`, { defaultValue: p.payment_method || '-' })}</td>
                            <td className={styles.alignRight}>{p.count}</td>
                            <td className={styles.alignRight}><strong>{formatCurrency(p.total)}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {purchasesSummary.cancelled?.count > 0 && (
                <div className={styles.summaryGrid} style={{ marginTop: 16 }}>
                  <div className={styles.summaryItem}>
                    <span>{t('reports:purchases.cancelled')}</span>
                    <strong className={styles.danger}>{purchasesSummary.cancelled.count} · {formatCurrency(purchasesSummary.cancelled.total)}</strong>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className={styles.emptyState}>{t('reports:noData')}</div>
          )}
        </div>
      </div>

      {/* Top tedarikçiler */}
      <div className={styles.reportCard}>
        <div className={styles.reportCardHeader}>
          {icons.customer}
          <h3 className={styles.reportCardTitle}>{t('reports:purchases.topSuppliers')}</h3>
        </div>
        <div className={styles.reportCardBody}>
          {purchasesSummary?.topSuppliers?.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.reportTable}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>{t('reports:purchases.supplier')}</th>
                    <th className={styles.alignRight}>{t('reports:purchases.count')}</th>
                    <th className={styles.alignRight}>{t('reports:purchases.total')}</th>
                  </tr>
                </thead>
                <tbody>
                  {purchasesSummary.topSuppliers.map((s: any, i: number) => (
                    <tr key={s.supplier_id || i}>
                      <td>{i + 1}</td>
                      <td>{s.supplier_name}</td>
                      <td className={styles.alignRight}>{s.purchase_count}</td>
                      <td className={styles.alignRight}><strong>{formatCurrency(s.total)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyState}>{t('reports:noData')}</div>
          )}
        </div>
      </div>

      {/* Günlük Alış Trendi */}
      <div className={`${styles.reportCard} ${styles.fullWidthCard}`}>
        <div className={styles.reportCardHeader}>
          {icons.calendar}
          <h3 className={styles.reportCardTitle}>{t('reports:purchases.dailyTrend')}</h3>
        </div>
        <div className={styles.reportCardBody}>
          {purchasesSummary?.dailyPurchases?.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.reportTable}>
                <thead>
                  <tr>
                    <th>{t('reports:purchases.date')}</th>
                    <th className={styles.alignRight}>{t('reports:purchases.count')}</th>
                    <th className={styles.alignRight}>{t('reports:purchases.amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {purchasesSummary.dailyPurchases.map((d: any) => (
                    <tr key={d.date}>
                      <td>{formatDate(d.date)}</td>
                      <td className={styles.alignRight}>{d.count}</td>
                      <td className={styles.alignRight}><strong>{formatCurrency(d.total)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyState}>{t('reports:noData')}</div>
          )}
        </div>
      </div>
    </div>
  );

  // ── Kasa Hareketleri Raporu ─────────────────────────────
  const renderKasaTab = () => (
    <div className={styles.grid}>
      <div className={styles.reportCard}>
        <div className={styles.reportCardHeader}>
          {icons.debt}
          <h3 className={styles.reportCardTitle}>{t('reports:cash.title')}</h3>
        </div>
        <div className={styles.reportCardBody}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <label>{t('reports:cash.account')}:</label>
            <select
              className={styles.dateInput}
              value={accountFilterId}
              onChange={(e) => setAccountFilterId(e.target.value)}
            >
              <option value="">{t('reports:cash.allAccounts')}</option>
              {accountMovementsReport?.accounts?.map((a: any) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {accountMovementsReport ? (
            <>
              <div className={styles.summaryGrid}>
                <div className={styles.summaryItem}>
                  <span>{t('reports:cash.cashIn')}</span>
                  <strong className={styles.success}>+{formatCurrency(accountMovementsReport.summary.cashIn)}</strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>{t('reports:cash.cashOut')}</span>
                  <strong className={styles.danger}>−{formatCurrency(accountMovementsReport.summary.cashOut)}</strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>{t('reports:cash.net')}</span>
                  <strong>{formatCurrency(accountMovementsReport.summary.net)}</strong>
                </div>
                <div className={styles.summaryItem}>
                  <span>{t('reports:cash.totalMovements')}</span>
                  <strong>{accountMovementsReport.summary.totalMovements}</strong>
                </div>
              </div>

              {accountMovementsReport.byType?.length > 0 && (
                <>
                  <h4 style={{ marginTop: 24 }}>{t('reports:cash.byType')}</h4>
                  <div className={styles.tableWrap}>
                    <table className={styles.reportTable}>
                      <thead>
                        <tr>
                          <th>{t('reports:cash.type')}</th>
                          <th className={styles.alignRight}>{t('reports:cash.count')}</th>
                          <th className={styles.alignRight}>{t('reports:cash.amount')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accountMovementsReport.byType.map((r: any) => (
                          <tr key={r.movement_type}>
                            <td>{t(`reports:cash.movementTypes.${r.movement_type}`, { defaultValue: r.movement_type })}</td>
                            <td className={styles.alignRight}>{r.count}</td>
                            <td className={styles.alignRight}><strong>{formatCurrency(r.total)}</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              <h4 style={{ marginTop: 24 }}>{t('reports:cash.movements')}</h4>
              {accountMovementsReport.movements?.length >= 200 && (
                <p className={styles.subtitle} style={{ marginBottom: 8 }}>{t('reports:cash.truncated')}</p>
              )}
              {accountMovementsReport.movements?.length > 0 ? (
                <div className={styles.tableWrap}>
                  <table className={styles.reportTable}>
                    <thead>
                      <tr>
                        <th>{t('reports:cash.date')}</th>
                        <th>{t('reports:cash.accountCol')}</th>
                        <th>{t('reports:cash.type')}</th>
                        <th>{t('reports:cash.description')}</th>
                        <th className={styles.alignRight}>{t('reports:cash.amount')}</th>
                        <th className={styles.alignRight}>{t('reports:cash.balanceAfter')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accountMovementsReport.movements.map((m: any) => {
                        const isOut = m.movement_type === 'gider' || m.movement_type === 'transfer_out';
                        return (
                          <tr key={m.id}>
                            <td>{formatDate(m.movement_date)}</td>
                            <td>{m.account_name || '-'}</td>
                            <td>{t(`reports:cash.movementTypes.${m.movement_type}`, { defaultValue: m.movement_type })}</td>
                            <td>{m.description || m.category || '-'}</td>
                            <td className={`${styles.alignRight} ${isOut ? styles.danger : styles.success}`}>
                              <strong>{isOut ? '−' : '+'}{formatCurrency(m.amount)}</strong>
                            </td>
                            <td className={styles.alignRight}>{formatCurrency(m.balance_after)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.emptyState}>{t('reports:cash.noMovements')}</div>
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
                      ({customer.products.reduce((s, p) => s + p.total_quantity, 0)} {t('reports:customers.totalPieces')} · {formatCurrency(customer.products.reduce((s, p) => s + Number(p.total_amount), 0))})
                    </span>
                  </h4>
                  <div className={styles.tableWrap}>
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
                      <tfoot>
                        <tr>
                          <td><strong>{t('reports:customers.amountTotal')}</strong></td>
                          <td className={styles.alignRight}><strong>{customer.products.reduce((s, p) => s + p.total_quantity, 0)}</strong></td>
                          <td className={styles.alignRight}><strong>{formatCurrency(customer.products.reduce((s, p) => s + Number(p.total_amount), 0))}</strong></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
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
              {stockDetail?.summary && (
                <div className={styles.summaryCard}>
                  <div className={styles.summaryValue}>{stockDetail.summary.totalSoldQuantity}</div>
                  <div className={styles.summaryLabel}>{t('reports:stock.totalSold')}</div>
                </div>
              )}
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
          {stockReport?.products && stockReport.products.filter(p => Number(p.stock_quantity) <= Number(p.min_stock_level)).length > 0 ? (
            <div className={styles.tableWrap}>
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
                    .filter(p => Number(p.stock_quantity) <= Number(p.min_stock_level))
                    .slice(0, 15)
                    .map((p) => (
                      <tr key={p.id}>
                        <td>{p.name}</td>
                        <td>{p.barcode || '-'}</td>
                        <td className={styles.alignRight}>{Number(p.stock_quantity)}</td>
                        <td className={styles.alignRight}>{Number(p.min_stock_level)}</td>
                        <td className={styles.alignRight}>
                          <span className={`${styles.badge} ${Number(p.stock_quantity) === 0 ? styles.badgeDanger : styles.badgeWarning}`}>
                            {Number(p.stock_quantity) === 0 ? t('reports:stock.depleted') : t('reports:stock.low')}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyState}>{t('reports:stock.noLowStock')}</div>
          )}
        </div>
      </div>

      {/* Kategori Bazlı Stok */}
      <div className={`${styles.reportCard} ${styles.fullWidthCard}`}>
        <div className={styles.reportCardHeader}>
          {icons.product}
          <h3 className={styles.reportCardTitle}>{t('reports:stockDetail.byCategoryTitle')}</h3>
        </div>
        <div className={styles.reportCardBody}>
          {stockDetail && stockDetail.byCategory.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.reportTable}>
                <thead>
                  <tr>
                    <th>{t('reports:stockDetail.category')}</th>
                    <th className={styles.alignRight}>{t('reports:stockDetail.productCount')}</th>
                    <th className={styles.alignRight}>{t('reports:stockDetail.stockQty')}</th>
                    <th className={styles.alignRight}>{t('reports:stockDetail.stockValue')}</th>
                  </tr>
                </thead>
                <tbody>
                  {stockDetail.byCategory.map((c) => (
                    <tr key={c.category}>
                      <td>{c.category}</td>
                      <td className={styles.alignRight}>{c.product_count}</td>
                      <td className={styles.alignRight}>{c.stock_quantity}</td>
                      <td className={styles.alignRight}><strong>{formatCurrency(c.stock_value)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyState}>{t('reports:noData')}</div>
          )}
        </div>
      </div>

      {/* Ürün Bazında Stok Detayı */}
      <div className={`${styles.reportCard} ${styles.fullWidthCard}`}>
        <div className={styles.reportCardHeader}>
          {icons.product}
          <h3 className={styles.reportCardTitle}>{t('reports:stockDetail.title')}</h3>
        </div>
        <div className={styles.reportCardBody}>
          {stockDetail && stockDetail.products.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.reportTable}>
                <thead>
                  <tr>
                    <th>{t('reports:stockDetail.product')}</th>
                    <th className={styles.alignRight}>{t('reports:stockDetail.stockQty')}</th>
                    <th className={styles.alignRight}>{t('reports:stockDetail.soldInPeriod')}</th>
                    <th className={styles.alignRight}>{t('reports:stockDetail.stockValue')}</th>
                    <th className={styles.alignRight}>{t('reports:stockDetail.potentialSale')}</th>
                    <th className={styles.alignRight}>{t('reports:stockDetail.potentialProfit')}</th>
                    <th className={styles.alignRight}>{t('reports:stockDetail.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {stockDetail.products.map((p) => (
                    <tr key={p.id}>
                      <td>
                        {p.name}
                        {p.barcode && <span className={styles.barcode} style={{ display: 'block' }}>{p.barcode}</span>}
                      </td>
                      <td className={styles.alignRight}>{p.stock_quantity} {p.unit || ''}</td>
                      <td className={styles.alignRight}>{p.sold_quantity || '-'}</td>
                      <td className={styles.alignRight}>{formatCurrency(p.stock_value)}</td>
                      <td className={styles.alignRight}>{formatCurrency(p.potential_sale_value)}</td>
                      <td className={styles.alignRight}>{formatCurrency(p.potential_profit)}</td>
                      <td className={styles.alignRight}>
                        <span className={`${styles.badge} ${p.status === 'out' ? styles.badgeDanger : p.status === 'low' ? styles.badgeWarning : styles.badgeSuccess}`}>
                          {p.status === 'out' ? t('reports:stock.depleted') : p.status === 'low' ? t('reports:stock.low') : t('reports:stockDetail.statusOk')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyState}>{t('reports:noData')}</div>
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
                                    ({t(`sales:paymentMethods.${sale.payment_method}`, { defaultValue: PAYMENT_METHODS[sale.payment_method as keyof typeof PAYMENT_METHODS] || sale.payment_method })})
                                  </span>
                                </span>
                                <strong>{formatCurrency(parseFloat(String(sale.grand_total)))}</strong>
                              </div>
                              {sale.items.length > 0 && (
                                <div className={styles.tableWrap}>
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
                                </div>
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
              <div className={styles.tableWrap}>
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
                        <td>{t(`reports:expenseCategories.${c.category}`, { defaultValue: EXPENSE_CATEGORIES[c.category as keyof typeof EXPENSE_CATEGORIES] || c.category })}</td>
                        <td className={styles.alignRight}>{c.count}</td>
                        <td className={styles.alignRight}><strong>{formatCurrency(parseFloat(String(c.total)))}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
            <div className={styles.tableWrap}>
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
                      <td className={styles.alignRight}><strong>{formatCurrency(Number(m.total) || 0)}</strong></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td><strong>{t('reports:expenses.totalExpenses')}</strong></td>
                    <td className={styles.alignRight}><strong>{formatCurrency(expensesReport.summary.total)}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
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
              <div className={styles.tableWrap}>
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
              <div className={styles.tableWrap}>
                <table className={styles.reportTable}>
                  <thead>
                    <tr>
                      <th>{t('reports:renewals.customer')}</th>
                      <th>{t('reports:renewals.contact')}</th>
                      <th>{t('reports:renewals.products')}</th>
                      <th className={styles.alignRight}>{t('reports:renewals.amount')}</th>
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
                        <td>
                          {item.customer_phone || item.customer_email ? (
                            <>
                              {item.customer_phone && <div>{item.customer_phone}</div>}
                              {item.customer_email && <small style={{ color: 'var(--color-text-muted)' }}>{item.customer_email}</small>}
                            </>
                          ) : '-'}
                        </td>
                        <td>{item.product_names?.join(', ') || '-'}</td>
                        <td className={styles.alignRight}>{formatCurrency(item.grand_total)}</td>
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
          <div className={styles.periodBadge}>
            {icons.calendar}
            <span className={styles.periodPreset}>{t(`reports:periods.${activePreset}`)}</span>
            <span className={styles.periodRange}>{formatDate(startDate)} – {formatDate(endDate)}</span>
          </div>
        </div>
        <div className={styles.filters}>
          <div className={styles.presets}>
            {PERIOD_PRESETS.map((key) => (
              <button
                key={key}
                type="button"
                className={`${styles.presetBtn} ${activePreset === key ? styles.presetBtnActive : ''}`}
                onClick={() => applyPreset(key)}
              >
                {t(`reports:periods.${key}`)}
              </button>
            ))}
          </div>
          <input
            type="date"
            className={styles.dateInput}
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setActivePreset('ozel'); }}
          />
          <input
            type="date"
            className={styles.dateInput}
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setActivePreset('ozel'); }}
          />
          <Button onClick={fetchReports}>{t('reports:filter')}</Button>
        </div>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${activeTab === 'genel' ? styles.tabActive : ''}`} onClick={() => setActiveTab('genel')}>
          {t('reports:tabs.general')}
        </button>
        <button className={`${styles.tab} ${activeTab === 'gunSonu' ? styles.tabActive : ''}`} onClick={() => setActiveTab('gunSonu')}>
          {t('reports:tabs.endOfDay')}
        </button>
        <button className={`${styles.tab} ${activeTab === 'satis' ? styles.tabActive : ''}`} onClick={() => setActiveTab('satis')}>
          {t('reports:tabs.sales')}
        </button>
        <button className={`${styles.tab} ${activeTab === 'alis' ? styles.tabActive : ''}`} onClick={() => setActiveTab('alis')}>
          {t('reports:tabs.purchases')}
        </button>
        {hasFeature('advancedReports') && (
          <button className={`${styles.tab} ${activeTab === 'karlilik' ? styles.tabActive : ''}`} onClick={() => setActiveTab('karlilik')}>
            {t('reports:tabs.profitability')}
          </button>
        )}
        <button className={`${styles.tab} ${activeTab === 'musteri' ? styles.tabActive : ''}`} onClick={() => setActiveTab('musteri')}>
          {t('reports:tabs.customers')}
        </button>
        {hasFeature('advancedReports') && (
          <button className={`${styles.tab} ${activeTab === 'musteriSatis' ? styles.tabActive : ''}`} onClick={() => setActiveTab('musteriSatis')}>
            {t('reports:tabs.customerSales')}
          </button>
        )}
        {hasFeature('advancedReports') && (
          <button className={`${styles.tab} ${activeTab === 'yaslandirma' ? styles.tabActive : ''}`} onClick={() => setActiveTab('yaslandirma')}>
            {t('reports:tabs.aging')}
          </button>
        )}
        <button className={`${styles.tab} ${activeTab === 'stok' ? styles.tabActive : ''}`} onClick={() => setActiveTab('stok')}>
          {t('reports:tabs.stock')}
        </button>
        <button className={`${styles.tab} ${activeTab === 'kasa' ? styles.tabActive : ''}`} onClick={() => setActiveTab('kasa')}>
          {t('reports:tabs.cash')}
        </button>
        {hasFeature('advancedReports') && (
          <button className={`${styles.tab} ${activeTab === 'gider' ? styles.tabActive : ''}`} onClick={() => setActiveTab('gider')}>
            {t('reports:tabs.expenses')}
          </button>
        )}
        {hasFeature('advancedReports') && (
          <button className={`${styles.tab} ${activeTab === 'personel' ? styles.tabActive : ''}`} onClick={() => setActiveTab('personel')}>
            {t('reports:tabs.staff')}
          </button>
        )}
        {hasFeature('advancedReports') && (
          <button className={`${styles.tab} ${activeTab === 'yenileme' ? styles.tabActive : ''}`} onClick={() => setActiveTab('yenileme')}>
            {t('reports:tabs.renewals')}
          </button>
        )}
      </div>

      {loading ? (
        <div className={styles.loading}><Spinner size="lg" /></div>
      ) : (
        <>
          {activeTab === 'genel' && renderGenelTab()}
          {activeTab === 'gunSonu' && renderGunSonuTab()}
          {activeTab === 'satis' && renderSatisTab()}
          {activeTab === 'alis' && renderAlisTab()}
          {activeTab === 'karlilik' && renderKarlilikTab()}
          {activeTab === 'musteri' && renderMusteriTab()}
          {activeTab === 'musteriSatis' && renderMusteriSatisTab()}
          {activeTab === 'yaslandirma' && renderYaslandirmaTab()}
          {activeTab === 'stok' && renderStokTab()}
          {activeTab === 'kasa' && renderKasaTab()}
          {activeTab === 'gider' && renderGiderTab()}
          {activeTab === 'personel' && renderPersonelTab()}
          {activeTab === 'yenileme' && renderYenilemeTab()}
        </>
      )}
    </div>
  );
}
