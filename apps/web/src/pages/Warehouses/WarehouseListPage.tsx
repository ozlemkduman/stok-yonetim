import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Table, Button, Badge, Input, Select, Pagination, type Column } from '@stok/ui';
import { Warehouse, StockTransfer, StockMovement, CreateWarehouseData, warehousesApi } from '../../api/warehouses.api';
import { WarehouseFormModal } from './WarehouseFormModal';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { useTenant } from '../../context/TenantContext';
import { UpgradePrompt } from '../../components/UpgradePrompt';
import { formatDate, formatDateTime } from '../../utils/formatters';
import styles from './WarehouseListPage.module.css';

const icons = {
  warehouse: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
};

type TabType = 'warehouses' | 'transfers' | 'movements';

export function WarehouseListPage() {
  const { t } = useTranslation(['warehouses', 'common']);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('warehouses');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [transferStatusFilter, setTransferStatusFilter] = useState('');
  const [movementStartDate, setMovementStartDate] = useState('');
  const [movementEndDate, setMovementEndDate] = useState('');

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();
  const { isWithinLimit } = useTenant();
  const canAddWarehouse = isWithinLimit('warehouses');

  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await warehousesApi.getAll({ page, limit: 20, isActive: true });
      setWarehouses(response.data);
      setTotal(response.meta?.total || 0);
      setTotalPages(response.meta?.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('warehouses:toast.loadError'));
    } finally {
      setLoading(false);
    }
  }, [page, t]);

  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await warehousesApi.getTransfers({
        page, limit: 20,
        status: transferStatusFilter || undefined,
      });
      setTransfers(response.data);
      setTotal(response.meta?.total || 0);
      setTotalPages(response.meta?.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('warehouses:toast.transfersLoadError'));
    } finally {
      setLoading(false);
    }
  }, [page, transferStatusFilter, t]);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await warehousesApi.getMovements({
        page, limit: 20,
        startDate: movementStartDate || undefined,
        endDate: movementEndDate || undefined,
      });
      setMovements(response.data);
      setTotal(response.meta?.total || 0);
      setTotalPages(response.meta?.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('warehouses:toast.movementsLoadError'));
    } finally {
      setLoading(false);
    }
  }, [page, movementStartDate, movementEndDate, t]);

  useEffect(() => {
    if (activeTab === 'warehouses') {
      fetchWarehouses();
    } else if (activeTab === 'transfers') {
      fetchTransfers();
    } else {
      fetchMovements();
    }
  }, [activeTab, fetchWarehouses, fetchTransfers, fetchMovements]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleTransferStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTransferStatusFilter(e.target.value);
    setPage(1);
  };

  const handleMovementStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMovementStartDate(e.target.value);
    setPage(1);
  };

  const handleMovementEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMovementEndDate(e.target.value);
    setPage(1);
  };

  const handleCreate = () => {
    setEditingWarehouse(null);
    setIsFormModalOpen(true);
  };

  const handleView = (warehouse: Warehouse) => {
    navigate(`/warehouses/${warehouse.id}`);
  };

  const handleEdit = (warehouse: Warehouse, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setEditingWarehouse(warehouse);
    setIsFormModalOpen(true);
  };

  const handleDelete = async (warehouse: Warehouse, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    const confirmed = await confirm({ message: t('warehouses:confirm.deleteWarehouse', { name: warehouse.name }), variant: 'danger' });
    if (!confirmed) return;
    try {
      await warehousesApi.delete(warehouse.id);
      showToast('success', t('warehouses:toast.deleteSuccess'));
      fetchWarehouses();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('warehouses:toast.deleteFailed'));
    }
  };

  const handleFormSubmit = async (data: CreateWarehouseData) => {
    if (editingWarehouse) {
      await warehousesApi.update(editingWarehouse.id, data);
      showToast('success', t('warehouses:toast.updateSuccess'));
    } else {
      await warehousesApi.create(data);
      showToast('success', t('warehouses:toast.createSuccess'));
    }
    fetchWarehouses();
  };

  const handleCompleteTransfer = async (transfer: StockTransfer) => {
    const confirmed = await confirm({ message: t('warehouses:confirm.completeTransfer'), variant: 'warning' });
    if (!confirmed) return;
    try {
      await warehousesApi.completeTransfer(transfer.id);
      showToast('success', t('warehouses:toast.completeSuccess'));
      fetchTransfers();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('warehouses:toast.operationFailed'));
    }
  };

  const handleCancelTransfer = async (transfer: StockTransfer) => {
    const confirmed = await confirm({ message: t('warehouses:confirm.cancelTransfer'), variant: 'danger' });
    if (!confirmed) return;
    try {
      await warehousesApi.cancelTransfer(transfer.id);
      showToast('success', t('warehouses:toast.cancelSuccess'));
      fetchTransfers();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('warehouses:toast.operationFailed'));
    }
  };

  const warehouseColumns: Column<Warehouse>[] = [
    {
      key: 'name',
      header: t('warehouses:columns.warehouse'),
      render: (wh) => (
        <div className={styles.warehouseInfo}>
          <span className={styles.warehouseName}>{wh.name}</span>
          <span className={styles.warehouseCode}>{wh.code}</span>
        </div>
      ),
    },
    {
      key: 'address',
      header: t('warehouses:columns.address'),
      render: (wh) => wh.address || '-',
    },
    {
      key: 'manager_name',
      header: t('warehouses:columns.manager'),
      render: (wh) => wh.manager_name || '-',
    },
    {
      key: 'is_default',
      header: t('warehouses:columns.status'),
      render: (wh) => (
        wh.is_default ? <Badge variant="success">{t('warehouses:badges.default')}</Badge> : null
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '150px',
      render: (wh) => (
        <div className={styles.actions}>
          <Button size="sm" variant="secondary" onClick={() => handleView(wh)}>{t('warehouses:buttons.detail')}</Button>
          <Button size="sm" variant="primary" onClick={(e) => handleEdit(wh, e)}>{t('warehouses:buttons.edit')}</Button>
          <Button size="sm" variant="danger" onClick={(e) => handleDelete(wh, e)}>{t('warehouses:buttons.delete')}</Button>
        </div>
      ),
    },
  ];

  const transferColumns: Column<StockTransfer>[] = [
    {
      key: 'transfer_number',
      header: t('warehouses:columns.transferNo'),
      render: (tr: StockTransfer) => tr.transfer_number,
    },
    {
      key: 'from_warehouse',
      header: t('warehouses:columns.source'),
      render: (tr: StockTransfer) => tr.from_warehouse_name || '-',
    },
    {
      key: 'to_warehouse',
      header: t('warehouses:columns.target'),
      render: (tr: StockTransfer) => tr.to_warehouse_name || '-',
    },
    {
      key: 'transfer_date',
      header: t('warehouses:columns.date'),
      render: (tr: StockTransfer) => formatDate(tr.transfer_date),
    },
    {
      key: 'status',
      header: t('warehouses:columns.status'),
      render: (tr: StockTransfer) => (
        <Badge variant={
          tr.status === 'completed' ? 'success' :
          tr.status === 'cancelled' ? 'danger' :
          tr.status === 'in_transit' ? 'warning' : 'default'
        }>
          {t(`warehouses:transferStatus.${tr.status}`)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '150px',
      render: (tr: StockTransfer) => (
        <div className={styles.actions}>
          {tr.status === 'pending' && (
            <>
              <Button size="sm" variant="ghost" onClick={() => handleCompleteTransfer(tr)}>{t('warehouses:buttons.complete')}</Button>
              <Button size="sm" variant="ghost" onClick={() => handleCancelTransfer(tr)}>{t('warehouses:buttons.cancel')}</Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const movementColumns: Column<StockMovement>[] = [
    {
      key: 'movement_date',
      header: t('warehouses:columns.date'),
      render: (m: StockMovement) => formatDateTime(m.movement_date),
    },
    {
      key: 'warehouse_name',
      header: t('warehouses:columns.warehouse'),
      render: (m: StockMovement) => m.warehouse_name || '-',
    },
    {
      key: 'product_name',
      header: t('warehouses:columns.product'),
      render: (m: StockMovement) => m.product_name || '-',
    },
    {
      key: 'movement_type',
      header: t('warehouses:columns.operation'),
      render: (m: StockMovement) => t(`warehouses:movementTypes.${m.movement_type}`),
    },
    {
      key: 'quantity',
      header: t('warehouses:columns.quantity'),
      align: 'right',
      render: (m: StockMovement) => (
        <span className={`${styles.movementQuantity} ${m.quantity > 0 ? styles.positive : styles.negative}`}>
          {m.quantity > 0 ? '+' : ''}{m.quantity}
        </span>
      ),
    },
    {
      key: 'stock_after',
      header: t('warehouses:columns.stockAfter'),
      align: 'right',
      render: (m: StockMovement) => m.stock_after,
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>{icons.warehouse}</span>
            {t('warehouses:title')}
          </h1>
          <p className={styles.subtitle}>
            {activeTab === 'warehouses' && t('warehouses:subtitle.warehouses', { count: total })}
            {activeTab === 'transfers' && t('warehouses:subtitle.transfers', { count: total })}
            {activeTab === 'movements' && t('warehouses:subtitle.movements', { count: total })}
          </p>
        </div>
        {activeTab === 'warehouses' && canAddWarehouse && (
          <Button onClick={handleCreate}>{t('warehouses:newWarehouse')}</Button>
        )}
      </div>

      {activeTab === 'warehouses' && !canAddWarehouse && (
        <UpgradePrompt variant="inline" message={t('warehouses:upgradePrompt')} />
      )}

      <div className={styles.card}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'warehouses' ? styles.active : ''}`}
            onClick={() => handleTabChange('warehouses')}
          >
            {t('warehouses:tabs.warehouses')}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'transfers' ? styles.active : ''}`}
            onClick={() => handleTabChange('transfers')}
          >
            {t('warehouses:tabs.transfers')}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'movements' ? styles.active : ''}`}
            onClick={() => handleTabChange('movements')}
          >
            {t('warehouses:tabs.stockMovements')}
          </button>
        </div>

        {activeTab === 'transfers' && (
          <div className={styles.tabFilters}>
            <Select
              options={[
                { value: '', label: t('warehouses:filters.allStatuses') },
                { value: 'pending', label: t('warehouses:transferStatus.pending') },
                { value: 'in_transit', label: t('warehouses:transferStatus.in_transit') },
                { value: 'completed', label: t('warehouses:transferStatus.completed') },
                { value: 'cancelled', label: t('warehouses:transferStatus.cancelled') },
              ]}
              value={transferStatusFilter}
              onChange={handleTransferStatusChange}
            />
          </div>
        )}

        {activeTab === 'movements' && (
          <div className={styles.tabFilters}>
            <Input type="date" value={movementStartDate} onChange={handleMovementStartDateChange} />
            <Input type="date" value={movementEndDate} onChange={handleMovementEndDateChange} />
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}

        {activeTab === 'warehouses' && (
          <Table
            columns={warehouseColumns}
            data={warehouses}
            keyExtractor={(wh: Warehouse) => wh.id}
            loading={loading}
            emptyMessage={t('warehouses:empty.warehouses')}
            onRowClick={handleView}
          />
        )}

        {activeTab === 'transfers' && (
          <Table
            columns={transferColumns}
            data={transfers}
            keyExtractor={(tr: StockTransfer) => tr.id}
            loading={loading}
            emptyMessage={t('warehouses:empty.transfers')}
          />
        )}

        {activeTab === 'movements' && (
          <Table
            columns={movementColumns}
            data={movements}
            keyExtractor={(m: StockMovement) => m.id}
            loading={loading}
            emptyMessage={t('warehouses:empty.movements')}
          />
        )}

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <WarehouseFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        warehouse={editingWarehouse}
      />
    </div>
  );
}
