import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Input, Select, Table, Badge, type Column } from '@stok/ui';
import { ECommerceOrder, integrationsApi, Integration } from '../../api/integrations.api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './ECommerceOrdersPage.module.css';

export function ECommerceOrdersPage() {
  const { t } = useTranslation(['integrations', 'common']);
  const { showToast } = useToast();

  const [orders, setOrders] = useState<ECommerceOrder[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [integrationId, setIntegrationId] = useState('');
  const [syncStatus, setSyncStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersRes, integrationsRes] = await Promise.all([
        integrationsApi.getECommerceOrders({
          page,
          limit: 30,
          integrationId: integrationId || undefined,
          syncStatus: syncStatus || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
        integrationsApi.getIntegrations('e_commerce'),
      ]);
      setOrders(ordersRes.data);
      setIntegrations(integrationsRes.data);
      if (ordersRes.meta) {
        setTotalPages(ordersRes.meta.totalPages);
      }
    } catch (err) {
      showToast('error', t('integrations:orders.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page]);

  const handleFilter = () => {
    setPage(1);
    loadData();
  };

  const handleReset = () => {
    setIntegrationId('');
    setSyncStatus('');
    setStartDate('');
    setEndDate('');
    setPage(1);
    setTimeout(loadData, 0);
  };

  const columns: Column<ECommerceOrder>[] = [
    {
      key: 'external_order_number',
      header: t('integrations:orders.columns.orderNo'),
      width: '12%',
      render: (o) => <strong>{o.external_order_number || o.external_order_id}</strong>,
    },
    {
      key: 'integration_name',
      header: t('integrations:orders.columns.platform'),
      width: '10%',
      render: (o) => o.integration_name || '-',
    },
    {
      key: 'order_date',
      header: t('integrations:orders.columns.date'),
      width: '10%',
      render: (o) => formatDate(o.order_date),
    },
    {
      key: 'customer_name',
      header: t('integrations:orders.columns.customer'),
      width: '15%',
      render: (o) => o.customer_name || '-',
    },
    {
      key: 'total',
      header: t('integrations:orders.columns.amount'),
      align: 'right',
      width: '10%',
      render: (o) => formatCurrency(o.total),
    },
    {
      key: 'status',
      header: t('integrations:orders.columns.status'),
      width: '10%',
      render: (o) => <Badge variant="default">{o.status}</Badge>,
    },
    {
      key: 'sync_status',
      header: t('integrations:orders.columns.syncStatus'),
      width: '10%',
      render: (o) => (
        <Badge variant={
          o.sync_status === 'synced' ? 'success' :
          o.sync_status === 'error' ? 'danger' :
          o.sync_status === 'ignored' ? 'default' : 'warning'
        }>
          {t(`integrations:orders.syncStatuses.${o.sync_status}`, { defaultValue: o.sync_status })}
        </Badge>
      ),
    },
    {
      key: 'commission',
      header: t('integrations:orders.columns.commission'),
      align: 'right',
      width: '8%',
      render: (o) => formatCurrency(o.commission),
    },
    {
      key: 'shipping_cost',
      header: t('integrations:orders.columns.shipping'),
      align: 'right',
      width: '8%',
      render: (o) => formatCurrency(o.shipping_cost),
    },
  ];

  const totalOrders = orders.length;
  const syncedCount = orders.filter(o => o.sync_status === 'synced').length;
  const pendingCount = orders.filter(o => o.sync_status === 'pending').length;
  const errorCount = orders.filter(o => o.sync_status === 'error').length;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('integrations:orders.pageTitle')}</h1>
          <p className={styles.subtitle}>{t('integrations:orders.subtitle')}</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <span className={styles.statValue}>{totalOrders}</span>
          <span className={styles.statLabel}>{t('integrations:orders.stats.totalOrders')}</span>
        </Card>
        <Card className={`${styles.statCard} ${styles.success}`}>
          <span className={styles.statValue}>{syncedCount}</span>
          <span className={styles.statLabel}>{t('integrations:orders.stats.synced')}</span>
        </Card>
        <Card className={`${styles.statCard} ${styles.warning}`}>
          <span className={styles.statValue}>{pendingCount}</span>
          <span className={styles.statLabel}>{t('integrations:orders.stats.pending')}</span>
        </Card>
        <Card className={`${styles.statCard} ${styles.danger}`}>
          <span className={styles.statValue}>{errorCount}</span>
          <span className={styles.statLabel}>{t('integrations:orders.stats.withErrors')}</span>
        </Card>
      </div>

      <Card className={styles.filtersCard}>
        <div className={styles.filtersGrid}>
          <div className={styles.filterGroup}>
            <label className={styles.label}>{t('integrations:orders.filters.platform')}</label>
            <Select
              value={integrationId}
              onChange={(e) => setIntegrationId(e.target.value)}
              options={[
                { value: '', label: t('integrations:orders.filters.allPlatforms') },
                ...integrations.map(i => ({ value: i.id, label: i.name })),
              ]}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.label}>{t('integrations:orders.filters.syncStatus')}</label>
            <Select
              value={syncStatus}
              onChange={(e) => setSyncStatus(e.target.value)}
              options={[
                { value: '', label: t('integrations:orders.filters.allStatuses') },
                { value: 'pending', label: t('integrations:orders.syncStatuses.pending') },
                { value: 'synced', label: t('integrations:orders.syncStatuses.synced') },
                { value: 'error', label: t('integrations:orders.syncStatuses.error') },
                { value: 'ignored', label: t('integrations:orders.syncStatuses.ignored') },
              ]}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.label}>{t('integrations:orders.filters.startDate')}</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.label}>{t('integrations:orders.filters.endDate')}</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className={styles.filterActions}>
            <Button onClick={handleFilter}>{t('integrations:orders.filters.filter')}</Button>
            <Button variant="ghost" onClick={handleReset}>{t('integrations:orders.filters.reset')}</Button>
          </div>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          data={orders}
          keyExtractor={(o) => o.id}
          loading={loading}
          emptyMessage={t('integrations:orders.emptyMessage')}
        />

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>
              {t('integrations:orders.pagination.previous')}
            </Button>
            <span>{t('integrations:orders.pagination.pageOf', { page, totalPages })}</span>
            <Button size="sm" variant="secondary" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              {t('integrations:orders.pagination.next')}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
