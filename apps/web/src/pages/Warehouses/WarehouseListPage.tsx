import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Badge, Pagination, type Column } from '@stok/ui';
import { Warehouse, StockTransfer, StockMovement, CreateWarehouseData, warehousesApi } from '../../api/warehouses.api';
import { WarehouseFormModal } from './WarehouseFormModal';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
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

const TRANSFER_STATUS_LABELS: Record<string, string> = {
  pending: 'Bekliyor',
  in_transit: 'Yolda',
  completed: 'Tamamlandi',
  cancelled: 'Iptal',
};

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  sale: 'Satis',
  return: 'Iade',
  transfer_in: 'Transfer Giris',
  transfer_out: 'Transfer Cikis',
  adjustment: 'Duzeltme',
  purchase: 'Alis',
};

export function WarehouseListPage() {
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

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();

  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await warehousesApi.getAll({ page, limit: 20, isActive: true });
      setWarehouses(response.data);
      setTotal(response.meta?.total || 0);
      setTotalPages(response.meta?.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Depolar yuklenirken hata olustu');
    } finally {
      setLoading(false);
    }
  }, [page]);

  const fetchTransfers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await warehousesApi.getTransfers({ page, limit: 20 });
      setTransfers(response.data);
      setTotal(response.meta?.total || 0);
      setTotalPages(response.meta?.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transferler yuklenirken hata olustu');
    } finally {
      setLoading(false);
    }
  }, [page]);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await warehousesApi.getMovements({ page, limit: 20 });
      setMovements(response.data);
      setTotal(response.meta?.total || 0);
      setTotalPages(response.meta?.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hareketler yuklenirken hata olustu');
    } finally {
      setLoading(false);
    }
  }, [page]);

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
    const confirmed = await confirm({ message: `"${warehouse.name}" deposunu silmek istediginizden emin misiniz?`, variant: 'danger' });
    if (!confirmed) return;
    try {
      await warehousesApi.delete(warehouse.id);
      showToast('success', 'Depo basariyla silindi');
      fetchWarehouses();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Silme islemi basarisiz');
    }
  };

  const handleFormSubmit = async (data: CreateWarehouseData) => {
    if (editingWarehouse) {
      await warehousesApi.update(editingWarehouse.id, data);
      showToast('success', 'Depo basariyla guncellendi');
    } else {
      await warehousesApi.create(data);
      showToast('success', 'Depo basariyla eklendi');
    }
    fetchWarehouses();
  };

  const handleCompleteTransfer = async (transfer: StockTransfer) => {
    const confirmed = await confirm({ message: 'Transferi tamamlamak istediginizden emin misiniz?', variant: 'warning' });
    if (!confirmed) return;
    try {
      await warehousesApi.completeTransfer(transfer.id);
      showToast('success', 'Transfer tamamlandi');
      fetchTransfers();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Islem basarisiz');
    }
  };

  const handleCancelTransfer = async (transfer: StockTransfer) => {
    const confirmed = await confirm({ message: 'Transferi iptal etmek istediginizden emin misiniz?', variant: 'danger' });
    if (!confirmed) return;
    try {
      await warehousesApi.cancelTransfer(transfer.id);
      showToast('success', 'Transfer iptal edildi');
      fetchTransfers();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Islem basarisiz');
    }
  };

  const warehouseColumns: Column<Warehouse>[] = [
    {
      key: 'name',
      header: 'Depo',
      render: (wh) => (
        <div className={styles.warehouseInfo}>
          <span className={styles.warehouseName}>{wh.name}</span>
          <span className={styles.warehouseCode}>{wh.code}</span>
        </div>
      ),
    },
    {
      key: 'address',
      header: 'Adres',
      render: (wh) => wh.address || '-',
    },
    {
      key: 'manager_name',
      header: 'Sorumlu',
      render: (wh) => wh.manager_name || '-',
    },
    {
      key: 'is_default',
      header: 'Durum',
      render: (wh) => (
        wh.is_default ? <Badge variant="success">Varsayilan</Badge> : null
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '150px',
      render: (wh) => (
        <div className={styles.actions}>
          <Button size="sm" variant="ghost" onClick={() => handleView(wh)}>Detay</Button>
          <Button size="sm" variant="ghost" onClick={(e) => handleEdit(wh, e)}>Duzenle</Button>
          <Button size="sm" variant="ghost" onClick={(e) => handleDelete(wh, e)}>Sil</Button>
        </div>
      ),
    },
  ];

  const transferColumns: Column<StockTransfer>[] = [
    {
      key: 'transfer_number',
      header: 'Transfer No',
      render: (t) => t.transfer_number,
    },
    {
      key: 'from_warehouse',
      header: 'Kaynak',
      render: (t) => t.from_warehouse_name || '-',
    },
    {
      key: 'to_warehouse',
      header: 'Hedef',
      render: (t) => t.to_warehouse_name || '-',
    },
    {
      key: 'transfer_date',
      header: 'Tarih',
      render: (t) => formatDate(t.transfer_date),
    },
    {
      key: 'status',
      header: 'Durum',
      render: (t) => (
        <Badge variant={
          t.status === 'completed' ? 'success' :
          t.status === 'cancelled' ? 'danger' :
          t.status === 'in_transit' ? 'warning' : 'default'
        }>
          {TRANSFER_STATUS_LABELS[t.status] || t.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '150px',
      render: (t) => (
        <div className={styles.actions}>
          {t.status === 'pending' && (
            <>
              <Button size="sm" variant="ghost" onClick={() => handleCompleteTransfer(t)}>Tamamla</Button>
              <Button size="sm" variant="ghost" onClick={() => handleCancelTransfer(t)}>Iptal</Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const movementColumns: Column<StockMovement>[] = [
    {
      key: 'movement_date',
      header: 'Tarih',
      render: (m) => formatDateTime(m.movement_date),
    },
    {
      key: 'warehouse_name',
      header: 'Depo',
      render: (m) => m.warehouse_name || '-',
    },
    {
      key: 'product_name',
      header: 'Urun',
      render: (m) => m.product_name || '-',
    },
    {
      key: 'movement_type',
      header: 'Islem',
      render: (m) => MOVEMENT_TYPE_LABELS[m.movement_type] || m.movement_type,
    },
    {
      key: 'quantity',
      header: 'Miktar',
      align: 'right',
      render: (m) => (
        <span className={`${styles.movementQuantity} ${m.quantity > 0 ? styles.positive : styles.negative}`}>
          {m.quantity > 0 ? '+' : ''}{m.quantity}
        </span>
      ),
    },
    {
      key: 'stock_after',
      header: 'Sonraki Stok',
      align: 'right',
      render: (m) => m.stock_after,
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>{icons.warehouse}</span>
            Depo Yonetimi
          </h1>
          <p className={styles.subtitle}>
            {activeTab === 'warehouses' && `${total} depo`}
            {activeTab === 'transfers' && `${total} transfer`}
            {activeTab === 'movements' && `${total} hareket`}
          </p>
        </div>
        {activeTab === 'warehouses' && (
          <Button onClick={handleCreate}>+ Yeni Depo</Button>
        )}
      </div>

      <div className={styles.card}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'warehouses' ? styles.active : ''}`}
            onClick={() => handleTabChange('warehouses')}
          >
            Depolar
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'transfers' ? styles.active : ''}`}
            onClick={() => handleTabChange('transfers')}
          >
            Transferler
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'movements' ? styles.active : ''}`}
            onClick={() => handleTabChange('movements')}
          >
            Stok Hareketleri
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {activeTab === 'warehouses' && (
          <Table
            columns={warehouseColumns}
            data={warehouses}
            keyExtractor={(wh) => wh.id}
            loading={loading}
            emptyMessage="Depo bulunamadi"
            onRowClick={handleView}
          />
        )}

        {activeTab === 'transfers' && (
          <Table
            columns={transferColumns}
            data={transfers}
            keyExtractor={(t) => t.id}
            loading={loading}
            emptyMessage="Transfer bulunamadi"
          />
        )}

        {activeTab === 'movements' && (
          <Table
            columns={movementColumns}
            data={movements}
            keyExtractor={(m) => m.id}
            loading={loading}
            emptyMessage="Hareket bulunamadi"
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
