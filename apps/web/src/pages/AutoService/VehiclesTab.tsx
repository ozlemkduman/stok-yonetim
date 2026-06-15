import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, Button, Input, Badge, Pagination, type Column } from '@stok/ui';
import { autoServiceApi, Vehicle, CreateVehicleData } from '../../api/autoService.api';
import { VehicleFormModal } from './VehicleFormModal';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import styles from './AutoService.module.css';

type StatusFilter = 'active' | 'inactive' | 'all';

interface VehiclesTabProps {
  onOpenHistory: (vehicle: Vehicle) => void;
}

export function VehiclesTab({ onOpenHistory }: VehiclesTabProps) {
  const { t } = useTranslation('autoService');
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();

  const [items, setItems] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('active');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      if (status !== 'all') params.isActive = status === 'active' ? 'true' : 'false';
      const res = await autoServiceApi.vehicles.getAll(params);
      setItems(res.data);
      setTotal(res.meta?.total || 0);
      setTotalPages(res.meta?.totalPages || 1);
    } catch {
      showToast('error', t('vehicles.toast.loadError'));
    }
    setLoading(false);
  }, [page, search, status, showToast, t]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  const handleCreate = () => { setEditing(null); setIsModalOpen(true); };
  const handleEdit = (v: Vehicle) => { setEditing(v); setIsModalOpen(true); };

  const handleDelete = async (v: Vehicle) => {
    const confirmed = await confirm({ message: t('vehicles.confirm.delete', { plate: v.plate }), variant: 'danger' });
    if (!confirmed) return;
    try {
      await autoServiceApi.vehicles.delete(v.id);
      showToast('success', t('vehicles.toast.deleteSuccess'));
      fetchVehicles();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('vehicles.toast.deleteFailed'));
    }
  };

  const handleSubmit = async (data: CreateVehicleData) => {
    if (editing) {
      await autoServiceApi.vehicles.update(editing.id, data);
      showToast('success', t('vehicles.toast.updateSuccess'));
    } else {
      await autoServiceApi.vehicles.create(data);
      showToast('success', t('vehicles.toast.createSuccess'));
    }
    fetchVehicles();
  };

  const columns: Column<Vehicle>[] = [
    { key: 'plate', header: t('vehicles.columns.plate'), render: (v) => <strong>{v.plate}</strong> },
    {
      key: 'brandModel', header: t('vehicles.columns.brandModel'),
      render: (v) => [v.brand, v.model].filter(Boolean).join(' ') || <span className={styles.muted}>-</span>,
    },
    { key: 'customer', header: t('vehicles.columns.customer'), render: (v) => v.customer_name || <span className={styles.muted}>-</span> },
    { key: 'model_year', header: t('vehicles.columns.year'), render: (v) => v.model_year || <span className={styles.muted}>-</span> },
    {
      key: 'mileage', header: t('vehicles.columns.mileage'), align: 'right',
      render: (v) => (v.mileage != null ? `${Number(v.mileage).toLocaleString()} km` : <span className={styles.muted}>-</span>),
    },
    {
      key: 'is_active', header: t('vehicles.columns.status'),
      render: (v) => (
        <Badge variant={v.is_active ? 'success' : 'default'}>
          {t(v.is_active ? 'vehicles.status.active' : 'vehicles.status.inactive')}
        </Badge>
      ),
    },
    {
      key: 'actions', header: '', width: '240px',
      render: (v) => (
        <div className={styles.actions} onClick={(ev) => ev.stopPropagation()}>
          <Button size="sm" variant="secondary" onClick={() => onOpenHistory(v)}>{t('vehicles.buttons.history')}</Button>
          <Button size="sm" variant="primary" onClick={() => handleEdit(v)}>{t('vehicles.buttons.edit')}</Button>
          {v.is_active && (
            <Button size="sm" variant="danger" onClick={() => handleDelete(v)}>{t('vehicles.buttons.delete')}</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className={styles.header} style={{ marginBottom: 'var(--space-3)' }}>
        <p className={styles.subtitle}>{t('vehicles.subtitle', { count: total })}</p>
        <Button onClick={handleCreate}>{t('vehicles.newVehicle')}</Button>
      </div>

      <div className={styles.filters}>
        <Input
          placeholder={t('vehicles.searchPlaceholder')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <div className={styles.tabs}>
          {(['active', 'inactive', 'all'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              className={`${styles.tab} ${status === s ? styles.tabActive : ''}`}
              onClick={() => { setStatus(s); setPage(1); }}
            >
              {t(`vehicles.filters.${s}`)}
            </button>
          ))}
        </div>
      </div>

      <Table
        columns={columns}
        data={items}
        keyExtractor={(v) => v.id}
        loading={loading}
        emptyMessage={t('vehicles.empty')}
        onRowClick={handleEdit}
      />

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <VehicleFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        vehicle={editing}
      />
    </div>
  );
}
