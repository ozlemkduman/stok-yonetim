import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Table, Button, Input, Badge, Pagination, type Column } from '@stok/ui';
import { openingStockApi, OpeningStockEntry } from '../../api/opening-stock.api';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';
import styles from './OpeningStockListPage.module.css';

type StatusFilter = 'active' | 'cancelled' | 'all';

export function OpeningStockListPage() {
  const { t } = useTranslation(['openingStock', 'common']);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [entries, setEntries] = useState<OpeningStockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter === 'active') params.status = 'completed';
      else if (statusFilter === 'cancelled') params.status = 'cancelled';

      const res = await openingStockApi.getAll(params);
      setEntries(res.data);
      setTotalPages(res.meta?.totalPages || 1);
    } catch (err) {
      showToast('error', t('openingStock:toast.loadError'));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEntries();
  }, [page, search, statusFilter]);

  const columns: Column<OpeningStockEntry>[] = [
    { key: 'entry_number', header: t('openingStock:columns.number'), render: (e) => <strong>{e.entry_number}</strong> },
    { key: 'entry_date', header: t('openingStock:columns.date'), render: (e) => formatDate(e.entry_date) },
    { key: 'warehouse_name', header: t('openingStock:columns.warehouse'), render: (e: any) => e.warehouse_name || '-' },
    { key: 'created_by_name', header: t('openingStock:columns.createdBy'), render: (e: any) => e.created_by_name || '-' },
    {
      key: 'status',
      header: t('openingStock:columns.status'),
      render: (e) => (
        <Badge variant={e.status === 'completed' ? 'success' : 'danger'}>
          {t(`openingStock:statuses.${e.status}`, { defaultValue: e.status })}
        </Badge>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('openingStock:pageTitle')}</h1>
          <p className={styles.subtitle}>{t('openingStock:subtitle')}</p>
        </div>
        <Button onClick={() => navigate('/opening-stock/new')}>{t('openingStock:newEntry')}</Button>
      </div>

      <div className={styles.infoBox}>
        {t('openingStock:info')}
      </div>

      <div className={styles.filters}>
        <Input
          placeholder={t('openingStock:searchPlaceholder')}
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
              {t(`openingStock:filters.${f}`)}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.card}>
        <Table
          columns={columns}
          data={entries}
          keyExtractor={(e) => e.id}
          loading={loading}
          emptyMessage={t('openingStock:empty')}
          onRowClick={(e) => navigate(`/opening-stock/${e.id}`)}
        />
        {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
      </div>
    </div>
  );
}
