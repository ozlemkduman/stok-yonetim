import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Table, Badge, type Column } from '@stok/ui';
import { autoServiceApi, ServiceOrder, Vehicle } from '../../api/autoService.api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { orderStatusVariant } from './statusVariant';

interface ServiceHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  onNewOrder: (vehicleId: string) => void;
  onSelectOrder: (order: ServiceOrder) => void;
}

export function ServiceHistoryModal({ isOpen, onClose, vehicle, onNewOrder, onSelectOrder }: ServiceHistoryModalProps) {
  const { t } = useTranslation('autoService');
  const { showToast } = useToast();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!vehicle) return;
    setLoading(true);
    try {
      const res = await autoServiceApi.serviceOrders.getAll({ vehicleId: vehicle.id, limit: 100 });
      setOrders(res.data);
    } catch {
      showToast('error', t('orders.toast.loadError'));
    }
    setLoading(false);
  }, [vehicle, showToast, t]);

  useEffect(() => {
    if (isOpen && vehicle) fetchOrders();
  }, [isOpen, vehicle, fetchOrders]);

  const columns: Column<ServiceOrder>[] = [
    { key: 'order_number', header: t('orders.columns.orderNumber'), render: (o) => <strong>{o.order_number}</strong> },
    { key: 'opened_at', header: t('orders.columns.openedAt'), render: (o) => formatDate(o.opened_at) },
    {
      key: 'status', header: t('orders.columns.status'),
      render: (o) => <Badge variant={orderStatusVariant(o.status)}>{t(`orders.status.${o.status}`)}</Badge>,
    },
    { key: 'total_amount', header: t('orders.columns.total'), align: 'right', render: (o) => formatCurrency(Number(o.total_amount)) },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vehicle ? t('history.title', { plate: vehicle.plate }) : ''}
      size="lg"
    >
      <Table
        columns={columns}
        data={orders}
        keyExtractor={(o) => o.id}
        loading={loading}
        emptyMessage={t('history.empty')}
        onRowClick={(o) => onSelectOrder(o)}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
        <Button variant="ghost" onClick={onClose}>{t('history.close')}</Button>
        {vehicle && <Button onClick={() => onNewOrder(vehicle.id)}>{t('history.newOrder')}</Button>}
      </div>
    </Modal>
  );
}
