import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, Button, Input, Badge, Pagination, type Column } from '@stok/ui';
import { autoServiceApi, ServiceOrder, ServiceOrderStatus } from '../../api/autoService.api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { orderStatusVariant } from './statusVariant';
import styles from './AutoService.module.css';

const STATUS_FILTERS: (ServiceOrderStatus | 'all')[] = ['all', 'open', 'in_progress', 'completed', 'delivered', 'cancelled'];

interface ServiceOrdersTabProps {
  refreshSignal: number;
  onNewOrder: () => void;
  onEditOrder: (order: ServiceOrder) => void;
  onInvoice: (order: ServiceOrder) => void;
}

export function ServiceOrdersTab({ refreshSignal, onNewOrder, onEditOrder, onInvoice }: ServiceOrdersTabProps) {
  const { t } = useTranslation('autoService');
  const { showToast } = useToast();

  const [items, setItems] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ServiceOrderStatus | 'all'>('all');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      if (status !== 'all') params.status = status;
      const res = await autoServiceApi.serviceOrders.getAll(params);
      setItems(res.data);
      setTotal(res.meta?.total || 0);
      setTotalPages(res.meta?.totalPages || 1);
    } catch {
      showToast('error', t('orders.toast.loadError'));
    }
    setLoading(false);
  }, [page, search, status, showToast, t]);

  useEffect(() => { fetchOrders(); }, [fetchOrders, refreshSignal]);

  const columns: Column<ServiceOrder>[] = [
    { key: 'order_number', header: t('orders.columns.orderNumber'), render: (o) => <strong>{o.order_number}</strong> },
    {
      key: 'vehicle', header: t('orders.columns.vehicle'),
      render: (o) => o.vehicle_plate || <span className={styles.muted}>-</span>,
    },
    { key: 'customer', header: t('orders.columns.customer'), render: (o) => o.customer_name || <span className={styles.muted}>-</span> },
    {
      key: 'status', header: t('orders.columns.status'),
      render: (o) => <Badge variant={orderStatusVariant(o.status)}>{t(`orders.status.${o.status}`)}</Badge>,
    },
    { key: 'total_amount', header: t('orders.columns.total'), align: 'right', render: (o) => formatCurrency(Number(o.total_amount)) },
    { key: 'opened_at', header: t('orders.columns.openedAt'), render: (o) => formatDate(o.opened_at) },
    {
      key: 'invoice', header: t('orders.columns.invoice'),
      render: (o) => (
        <div className={styles.invoiceBadges}>
          <Badge variant={o.invoice_number ? 'success' : 'default'}>
            {o.invoice_number ? t('orders.invoiceBadge.invoiced') : t('orders.invoiceBadge.none')}
          </Badge>
          {o.stock_deducted && <Badge variant="info">{t('orders.stockBadge.deducted')}</Badge>}
        </div>
      ),
    },
    {
      key: 'actions', header: '', width: '180px',
      render: (o) => (
        <div className={styles.actions} onClick={(ev) => ev.stopPropagation()}>
          <Button size="sm" variant="primary" onClick={() => onEditOrder(o)}>{t('orders.buttons.edit')}</Button>
          <Button size="sm" variant="secondary" onClick={() => onInvoice(o)}>{t('orders.buttons.invoice')}</Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className={styles.header} style={{ marginBottom: 'var(--space-3)' }}>
        <p className={styles.subtitle}>{t('orders.subtitle', { count: total })}</p>
        <Button onClick={onNewOrder}>{t('orders.newOrder')}</Button>
      </div>

      <div className={styles.filters}>
        <Input
          placeholder={t('orders.searchPlaceholder')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <div className={styles.tabs}>
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              className={`${styles.tab} ${status === s ? styles.tabActive : ''}`}
              onClick={() => { setStatus(s); setPage(1); }}
            >
              {s === 'all' ? t('orders.statusFilter.all') : t(`orders.status.${s}`)}
            </button>
          ))}
        </div>
      </div>

      <Table
        columns={columns}
        data={items}
        keyExtractor={(o) => o.id}
        loading={loading}
        emptyMessage={t('orders.empty')}
        onRowClick={onEditOrder}
      />

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
