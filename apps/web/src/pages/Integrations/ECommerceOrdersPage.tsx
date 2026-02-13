import { useState, useEffect } from 'react';
import { Button, Card, Input, Select, Table, Badge, type Column } from '@stok/ui';
import { ECommerceOrder, integrationsApi, Integration } from '../../api/integrations.api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './ECommerceOrdersPage.module.css';

const SYNC_STATUS_LABELS: Record<string, string> = {
  pending: 'Bekliyor',
  synced: 'Senkronize',
  error: 'Hata',
  ignored: 'Yoksayildi',
};

export function ECommerceOrdersPage() {
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
      showToast('error', 'Siparisler yuklenirken hata olustu');
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
      header: 'Siparis No',
      width: '12%',
      render: (o) => <strong>{o.external_order_number || o.external_order_id}</strong>,
    },
    {
      key: 'integration_name',
      header: 'Platform',
      width: '10%',
      render: (o) => o.integration_name || '-',
    },
    {
      key: 'order_date',
      header: 'Tarih',
      width: '10%',
      render: (o) => formatDate(o.order_date),
    },
    {
      key: 'customer_name',
      header: 'Musteri',
      width: '15%',
      render: (o) => o.customer_name || '-',
    },
    {
      key: 'total',
      header: 'Tutar',
      align: 'right',
      width: '10%',
      render: (o) => formatCurrency(o.total),
    },
    {
      key: 'status',
      header: 'Durum',
      width: '10%',
      render: (o) => <Badge variant="default">{o.status}</Badge>,
    },
    {
      key: 'sync_status',
      header: 'Senkron',
      width: '10%',
      render: (o) => (
        <Badge variant={
          o.sync_status === 'synced' ? 'success' :
          o.sync_status === 'error' ? 'danger' :
          o.sync_status === 'ignored' ? 'default' : 'warning'
        }>
          {SYNC_STATUS_LABELS[o.sync_status] || o.sync_status}
        </Badge>
      ),
    },
    {
      key: 'commission',
      header: 'Komisyon',
      align: 'right',
      width: '8%',
      render: (o) => formatCurrency(o.commission),
    },
    {
      key: 'shipping_cost',
      header: 'Kargo',
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
          <h1 className={styles.title}>e-Ticaret Siparisleri</h1>
          <p className={styles.subtitle}>Pazaryeri ve e-ticaret entegrasyonlarindan gelen siparisler</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <span className={styles.statValue}>{totalOrders}</span>
          <span className={styles.statLabel}>Toplam Siparis</span>
        </Card>
        <Card className={`${styles.statCard} ${styles.success}`}>
          <span className={styles.statValue}>{syncedCount}</span>
          <span className={styles.statLabel}>Senkronize</span>
        </Card>
        <Card className={`${styles.statCard} ${styles.warning}`}>
          <span className={styles.statValue}>{pendingCount}</span>
          <span className={styles.statLabel}>Bekleyen</span>
        </Card>
        <Card className={`${styles.statCard} ${styles.danger}`}>
          <span className={styles.statValue}>{errorCount}</span>
          <span className={styles.statLabel}>Hatali</span>
        </Card>
      </div>

      <Card className={styles.filtersCard}>
        <div className={styles.filtersGrid}>
          <div className={styles.filterGroup}>
            <label className={styles.label}>Platform</label>
            <Select
              value={integrationId}
              onChange={(e) => setIntegrationId(e.target.value)}
              options={[
                { value: '', label: 'Tum Platformlar' },
                ...integrations.map(i => ({ value: i.id, label: i.name })),
              ]}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.label}>Senkron Durumu</label>
            <Select
              value={syncStatus}
              onChange={(e) => setSyncStatus(e.target.value)}
              options={[
                { value: '', label: 'Tum Durumlar' },
                { value: 'pending', label: 'Bekliyor' },
                { value: 'synced', label: 'Senkronize' },
                { value: 'error', label: 'Hata' },
                { value: 'ignored', label: 'Yoksayildi' },
              ]}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.label}>Baslangic</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.label}>Bitis</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className={styles.filterActions}>
            <Button onClick={handleFilter}>Filtrele</Button>
            <Button variant="ghost" onClick={handleReset}>Sifirla</Button>
          </div>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          data={orders}
          keyExtractor={(o) => o.id}
          loading={loading}
          emptyMessage="Siparis bulunamadi"
        />

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>
              Onceki
            </Button>
            <span>Sayfa {page} / {totalPages}</span>
            <Button size="sm" variant="secondary" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              Sonraki
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
