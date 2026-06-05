import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Table, Button, Input, Badge, Pagination, type Column } from '@stok/ui';
import { stockCountApi, StockCountSession, CreateStockCountData } from '../../api/stock-count.api';
import { warehousesApi, Warehouse } from '../../api/warehouses.api';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';
import styles from './StockCountListPage.module.css';

type StatusFilter = 'in_progress' | 'completed' | 'cancelled' | 'all';

export function StockCountListPage() {
  const { t } = useTranslation(['stockCount', 'common']);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState<StockCountSession[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [creating, setCreating] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await stockCountApi.getAll(params);
      setSessions(res.data);
      setTotalPages(res.meta?.totalPages || 1);
    } catch {
      showToast('error', t('stockCount:toast.loadError'));
    }
    setLoading(false);
  };

  useEffect(() => { fetchSessions(); }, [page, search, statusFilter]);

  useEffect(() => {
    warehousesApi.getAll({ isActive: true }).then((res) => {
      setWarehouses(res.data);
      const def = res.data.find((w) => w.is_default);
      if (def) setSelectedWarehouse(def.id);
    }).catch(() => {});
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const data: CreateStockCountData = { warehouse_id: selectedWarehouse || undefined };
      const res = await stockCountApi.create(data);
      showToast('success', t('stockCount:toast.created'));
      navigate(`/stock-count/${res.data.id}`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('stockCount:toast.createError'));
    }
    setCreating(false);
  };

  const columns: Column<StockCountSession>[] = [
    { key: 'count_number', header: t('stockCount:columns.number'), render: (s) => <strong>{s.count_number}</strong> },
    { key: 'started_at', header: t('stockCount:columns.startedAt'), render: (s) => formatDate(s.started_at) },
    { key: 'warehouse_name', header: t('stockCount:columns.warehouse'), render: (s: any) => s.warehouse_name || '-' },
    { key: 'completed_at', header: t('stockCount:columns.completedAt'), render: (s) => s.completed_at ? formatDate(s.completed_at) : '-' },
    {
      key: 'status',
      header: t('stockCount:columns.status'),
      render: (s) => {
        const variant = s.status === 'completed' ? 'success' : s.status === 'cancelled' ? 'danger' : 'warning';
        return <Badge variant={variant}>{t(`stockCount:statuses.${s.status}`, { defaultValue: s.status })}</Badge>;
      },
    },
    { key: 'created_by_name', header: t('stockCount:columns.createdBy'), render: (s: any) => s.created_by_name || '-' },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('stockCount:pageTitle')}</h1>
          <p className={styles.subtitle}>{t('stockCount:subtitle')}</p>
        </div>
      </div>

      <div className={styles.infoBox}>{t('stockCount:info')}</div>

      <div className={styles.startCard}>
        <h3>{t('stockCount:newCount')}</h3>
        <div className={styles.startRow}>
          <select
            className={styles.warehouseSelect}
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
          >
            <option value="">{t('stockCount:selectWarehouse')}</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}{w.is_default ? ` (${t('stockCount:default')})` : ''}</option>
            ))}
          </select>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? t('stockCount:starting') : t('stockCount:startCount')}
          </Button>
        </div>
      </div>

      <div className={styles.filters}>
        <Input
          placeholder={t('stockCount:searchPlaceholder')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <div className={styles.tabs}>
          {(['all', 'in_progress', 'completed', 'cancelled'] as StatusFilter[]).map((f) => (
            <button
              key={f}
              className={`${styles.tab} ${statusFilter === f ? styles.tabActive : ''}`}
              onClick={() => { setStatusFilter(f); setPage(1); }}
            >
              {t(`stockCount:filters.${f}`)}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.card}>
        <Table
          columns={columns}
          data={sessions}
          keyExtractor={(s) => s.id}
          loading={loading}
          emptyMessage={t('stockCount:empty')}
          onRowClick={(s) => navigate(`/stock-count/${s.id}`)}
        />
        {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
      </div>
    </div>
  );
}
