import { useState, useEffect } from 'react';
import { Button, Spinner } from '@stok/ui';
import { reportsApi } from '../../api/reports.api';
import { formatCurrency } from '../../utils/formatters';
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
};

export function ReportsPage() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [salesSummary, setSalesSummary] = useState<any>(null);
  const [profitLoss, setProfitLoss] = useState<any>(null);
  const [debtOverview, setDebtOverview] = useState<any>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [sales, profit, debt] = await Promise.all([
        reportsApi.getSalesSummary(startDate, endDate),
        reportsApi.getProfitLoss(startDate, endDate),
        reportsApi.getDebtOverview(),
      ]);
      setSalesSummary(sales.data);
      setProfitLoss(profit.data);
      setDebtOverview(debt.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, []);

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

      {loading ? (
        <div className={styles.loading}><Spinner size="lg" /></div>
      ) : (
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
        </div>
      )}
    </div>
  );
}
