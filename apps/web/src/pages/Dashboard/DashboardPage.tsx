import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Table, Badge, Spinner, type Column } from '@stok/ui';
import { dashboardApi, DashboardSummary } from '../../api/dashboard.api';
import { formatCurrency } from '../../utils/formatters';
import styles from './DashboardPage.module.css';

// SVG Icons
const icons = {
  sales: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  products: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  customers: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  debt: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  credit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  expense: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  ),
  lowStock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  debtors: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  ),
  empty: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 15h8" />
      <circle cx="9" cy="9" r="1" />
      <circle cx="15" cy="9" r="1" />
    </svg>
  ),
  newSale: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
  newProduct: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  newCustomer: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
};

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [topDebtors, setTopDebtors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [summaryRes, lowStockRes, debtorsRes] = await Promise.all([
        dashboardApi.getSummary(),
        dashboardApi.getLowStock(),
        dashboardApi.getTopDebtors(),
      ]);
      setSummary(summaryRes.data);
      setLowStock(lowStockRes.data);
      setTopDebtors(debtorsRes.data);
    } catch (err) {
      console.error('Dashboard error:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" />
      </div>
    );
  }

  const today = new Date().toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const lowStockColumns: Column<any>[] = [
    { key: 'name', header: 'Ürün Adı' },
    {
      key: 'stock_quantity',
      header: 'Mevcut Stok',
      align: 'right',
      render: (p) => <Badge variant="danger">{p.stock_quantity}</Badge>,
    },
    { key: 'min_stock_level', header: 'Min. Seviye', align: 'right' },
  ];

  const debtorColumns: Column<any>[] = [
    { key: 'name', header: 'Musteri' },
    {
      key: 'balance',
      header: 'Borc Tutari',
      align: 'right',
      render: (c) => (
        <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>
          {formatCurrency(Math.abs(c.balance))}
        </span>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Özet</h1>
          <p className={styles.subtitle}>{today}</p>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.refreshButton} onClick={loadData}>
            {icons.refresh}
            <span>Yenile</span>
          </button>
        </div>
      </div>

      {/* Primary Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIconWrapper} ${styles.primary}`}>
            {icons.sales}
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>
              {formatCurrency(summary?.todaySales.total || 0)}
            </span>
            <span className={styles.statLabel}>Günlük Satış</span>
            <span className={styles.statSub}>{summary?.todaySales.count || 0} işlem</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIconWrapper} ${styles.info}`}>
            {icons.products}
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{summary?.totalProducts || 0}</span>
            <span className={styles.statLabel}>Toplam Ürün</span>
            <span className={styles.statSub}>Aktif ürünler</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIconWrapper} ${styles.success}`}>
            {icons.customers}
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{summary?.totalCustomers || 0}</span>
            <span className={styles.statLabel}>Toplam Müşteri</span>
            <span className={styles.statSub}>Kayıtlı müşteriler</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIconWrapper} ${styles.warning}`}>
            {icons.warning}
          </div>
          <div className={styles.statContent}>
            <span className={`${styles.statValue} ${styles.danger}`}>
              {summary?.lowStockCount || 0}
            </span>
            <span className={styles.statLabel}>Düşük Stok</span>
            <span className={styles.statSub}>Kritik seviye</span>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className={styles.secondaryStats}>
        <div className={styles.secondaryStatCard}>
          <div className={styles.secondaryStatLeft}>
            <div className={`${styles.secondaryStatIcon} ${styles.danger}`}>
              {icons.debt}
            </div>
            <span className={styles.secondaryStatLabel}>Toplam Borç</span>
          </div>
          <span className={`${styles.secondaryStatValue} ${styles.danger}`}>
            {formatCurrency(summary?.totalDebt || 0)}
          </span>
        </div>

        <div className={styles.secondaryStatCard}>
          <div className={styles.secondaryStatLeft}>
            <div className={`${styles.secondaryStatIcon} ${styles.success}`}>
              {icons.credit}
            </div>
            <span className={styles.secondaryStatLabel}>Toplam Alacak</span>
          </div>
          <span className={`${styles.secondaryStatValue} ${styles.success}`}>
            {formatCurrency(summary?.totalCredit || 0)}
          </span>
        </div>

        <div className={styles.secondaryStatCard}>
          <div className={styles.secondaryStatLeft}>
            <div className={`${styles.secondaryStatIcon} ${styles.warning}`}>
              {icons.expense}
            </div>
            <span className={styles.secondaryStatLabel}>Aylık Gider</span>
          </div>
          <span className={styles.secondaryStatValue}>
            {formatCurrency(summary?.monthlyExpenses || 0)}
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <Link to="/sales/new" className={styles.quickActionButton}>
          {icons.newSale}
          <span>Yeni Satış</span>
        </Link>
        <Link to="/products" className={styles.quickActionButton}>
          {icons.newProduct}
          <span>Ürün Ekle</span>
        </Link>
        <Link to="/customers" className={styles.quickActionButton}>
          {icons.newCustomer}
          <span>Müşteri Ekle</span>
        </Link>
        <Link to="/reports" className={styles.quickActionButton}>
          {icons.reports}
          <span>Raporlar</span>
        </Link>
      </div>

      {/* Tables */}
      <div className={styles.tablesGrid}>
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h3 className={styles.tableTitle}>
              {icons.lowStock}
              Düşük Stok Ürünleri
            </h3>
            {lowStock.length > 0 && (
              <span className={styles.tableBadge}>{lowStock.length} ürün</span>
            )}
          </div>
          <div className={styles.tableBody}>
            {lowStock.length > 0 ? (
              <Table
                columns={lowStockColumns}
                data={lowStock.slice(0, 5)}
                keyExtractor={(p) => p.id}
              />
            ) : (
              <div className={styles.emptyState}>
                {icons.empty}
                <span>Düşük stok ürünü yok</span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <h3 className={styles.tableTitle}>
              {icons.debtors}
              En Borçlu Müşteriler
            </h3>
            {topDebtors.length > 0 && (
              <span className={`${styles.tableBadge} ${styles.warning}`}>
                {topDebtors.length} müşteri
              </span>
            )}
          </div>
          <div className={styles.tableBody}>
            {topDebtors.length > 0 ? (
              <Table
                columns={debtorColumns}
                data={topDebtors.slice(0, 5)}
                keyExtractor={(c) => c.id}
              />
            ) : (
              <div className={styles.emptyState}>
                {icons.empty}
                <span>Borçlu müşteri yok</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
