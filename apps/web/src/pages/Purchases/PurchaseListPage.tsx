import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Table, Button, Input, Badge, Pagination, type Column } from '@stok/ui';
import { purchasesApi, Purchase, PurchasesStats } from '../../api/purchases.api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './PurchaseListPage.module.css';

type StatusFilter = 'active' | 'cancelled' | 'all';

export function PurchaseListPage() {
  const { t } = useTranslation(['purchases', 'common']);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [stats, setStats] = useState<PurchasesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter === 'active') params.status = 'completed';
      else if (statusFilter === 'cancelled') params.status = 'cancelled';

      const statsParams = { ...params };
      delete statsParams.status;

      const [res, statsRes] = await Promise.all([
        purchasesApi.getAll(params),
        purchasesApi.getStats(statsParams),
      ]);
      setPurchases(res.data);
      setTotalPages(res.meta?.totalPages || 1);
      setStats(statsRes.data);
    } catch (err) {
      showToast('error', t('purchases:toast.loadError'));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPurchases();
  }, [page, search, statusFilter]);

  const columns: Column<Purchase>[] = [
    { key: 'purchase_number', header: t('purchases:columns.number'), render: (p) => <strong>{p.purchase_number}</strong> },
    { key: 'purchase_date', header: t('purchases:columns.date'), render: (p) => formatDate(p.purchase_date) },
    { key: 'supplier_name', header: t('purchases:columns.supplier'), render: (p: any) => p.supplier_name || '-' },
    {
      key: 'payment_method',
      header: t('purchases:columns.paymentMethod'),
      render: (p) => t(`purchases:paymentMethods.${p.payment_method}`, { defaultValue: p.payment_method }),
    },
    {
      key: 'grand_total',
      header: t('purchases:columns.total'),
      align: 'right',
      render: (p) => <strong>{formatCurrency(Number(p.grand_total))}</strong>,
    },
    {
      key: 'status',
      header: t('purchases:columns.status'),
      render: (p) => (
        <Badge variant={p.status === 'completed' ? 'success' : p.status === 'cancelled' ? 'danger' : 'warning'}>
          {t(`purchases:statuses.${p.status}`, { defaultValue: p.status })}
        </Badge>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('purchases:pageTitle')}</h1>
          <p className={styles.subtitle}>{t('purchases:subtitle')}</p>
        </div>
        <Button onClick={() => navigate('/purchases/new')}>{t('purchases:newPurchase')}</Button>
      </div>

      {stats && (
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('purchases:stats.totalPurchases')}</div>
            <div className={styles.statValue}>{stats.count}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('purchases:stats.totalAmount')}</div>
            <div className={styles.statValue}>{formatCurrency(stats.total)}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('purchases:stats.cancelledCount')}</div>
            <div className={styles.statValue}>{stats.cancelledCount}</div>
          </div>
        </div>
      )}

      <div className={styles.filters}>
        <Input
          placeholder={t('purchases:searchPlaceholder')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <div className={styles.tabs}>
          {(['active', 'cancelled', 'all'] as StatusFilter[]).map((f) => (
            <button
              key={f}
              className={`${styles.tab} ${statusFilter === f ? styles.tabActive : ''}`}
              onClick={() => { setStatusFilter(f); setPage(1); }}
            >
              {t(`purchases:filters.${f}`)}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.card}>
        <Table
          columns={columns}
          data={purchases}
          keyExtractor={(p) => p.id}
          loading={loading}
          emptyMessage={t('purchases:empty')}
          onRowClick={(p) => navigate(`/purchases/${p.id}`)}
        />
        {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
      </div>
    </div>
  );
}
