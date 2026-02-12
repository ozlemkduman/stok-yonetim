import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Badge, Pagination, type Column } from '@stok/ui';
import { salesApi, Sale } from '../../api/sales.api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { PAYMENT_METHODS, SALE_STATUSES } from '../../utils/constants';
import styles from './SaleListPage.module.css';

const icons = {
  sales: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
  total: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  count: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  completed: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  cancelled: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
};

export function SaleListPage() {
  const navigate = useNavigate();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ total: 0, count: 0, completed: 0, cancelled: 0 });
  const { showToast } = useToast();

  const fetchSales = async () => {
    setLoading(true);
    try {
      const response = await salesApi.getAll({ page, limit: 20 });
      setSales(response.data);
      setTotalPages(response.meta?.totalPages || 1);

      // Calculate stats
      const allSales = response.data;
      setStats({
        total: allSales.reduce((sum, s) => sum + s.grand_total, 0),
        count: response.meta?.total || allSales.length,
        completed: allSales.filter(s => s.status === 'completed').length,
        cancelled: allSales.filter(s => s.status === 'cancelled').length,
      });
    } catch (err) {
      showToast('error', 'Satislar yuklenemedi');
    }
    setLoading(false);
  };

  useEffect(() => { fetchSales(); }, [page]);

  const handleCancel = async (sale: Sale) => {
    if (!confirm(`${sale.invoice_number} numarali satisi iptal etmek istediginizden emin misiniz?`)) return;
    try {
      await salesApi.cancel(sale.id);
      showToast('success', 'Satis iptal edildi');
      fetchSales();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Iptal basarisiz');
    }
  };

  const columns: Column<Sale>[] = [
    {
      key: 'invoice_number',
      header: 'Fatura No',
      render: (s) => (
        <button className={styles.invoiceLink} onClick={() => navigate(`/sales/${s.id}`)}>
          {s.invoice_number}
        </button>
      )
    },
    { key: 'customer_name', header: 'Musteri', render: (s) => s.customer_name || 'Perakende' },
    { key: 'sale_date', header: 'Tarih', render: (s) => formatDateTime(s.sale_date) },
    {
      key: 'grand_total',
      header: 'Toplam',
      align: 'right',
      render: (s) => <span className={styles.total}>{formatCurrency(s.grand_total)}</span>
    },
    {
      key: 'payment_method',
      header: 'Odeme',
      render: (s) => PAYMENT_METHODS[s.payment_method as keyof typeof PAYMENT_METHODS] || s.payment_method
    },
    {
      key: 'status',
      header: 'Durum',
      render: (s) => (
        <Badge variant={s.status === 'completed' ? 'success' : s.status === 'cancelled' ? 'danger' : 'warning'}>
          {SALE_STATUSES[s.status as keyof typeof SALE_STATUSES] || s.status}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      render: (s) => s.status === 'completed' && (
        <Button size="sm" variant="ghost" onClick={() => handleCancel(s)}>Iptal</Button>
      )
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>{icons.sales}</span>
            Satislar
          </h1>
          <p className={styles.subtitle}>Satis islemleri ve fatura yonetimi</p>
        </div>
        <Button onClick={() => showToast('info', 'Yeni satis sayfasi yakin zamanda eklenecek')}>
          + Yeni Satis
        </Button>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.primary}`}>{icons.total}</div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{formatCurrency(stats.total)}</span>
            <span className={styles.statLabel}>Toplam Ciro</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.success}`}>{icons.count}</div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.count}</span>
            <span className={styles.statLabel}>Toplam Satis</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.success}`}>{icons.completed}</div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.completed}</span>
            <span className={styles.statLabel}>Tamamlanan</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.danger}`}>{icons.cancelled}</div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.cancelled}</span>
            <span className={styles.statLabel}>Iptal Edilen</span>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <Table
          columns={columns}
          data={sales}
          keyExtractor={(s) => s.id}
          loading={loading}
          emptyMessage="Satis bulunamadi"
        />
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
