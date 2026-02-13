import { useState, useEffect } from 'react';
import { Button, Card, Input, Select, Table, Badge, type Column } from '@stok/ui';
import { Warehouse, StockMovement, warehousesApi } from '../../api/warehouses.api';
import { Product, productsApi } from '../../api/products.api';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';
import styles from './StockMovementsPage.module.css';

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  sale: 'Satis',
  return: 'Iade',
  transfer_in: 'Transfer Giris',
  transfer_out: 'Transfer Cikis',
  adjustment: 'Duzeltme',
  initial: 'Baslangic',
  purchase: 'Satin Alma',
};

export function StockMovementsPage() {
  const { showToast } = useToast();

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [warehouseId, setWarehouseId] = useState('');
  const [productId, setProductId] = useState('');
  const [movementType, setMovementType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [movementsRes, warehousesRes, productsRes] = await Promise.all([
        warehousesApi.getMovements({
          page,
          limit: 50,
          warehouseId: warehouseId || undefined,
          productId: productId || undefined,
          movementType: movementType || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
        warehousesApi.getAll({ isActive: true }),
        productsApi.getAll({ limit: 1000, isActive: 'true' }),
      ]);
      setMovements(movementsRes.data);
      setWarehouses(warehousesRes.data);
      setProducts(productsRes.data);
      if (movementsRes.meta) {
        setTotalPages(movementsRes.meta.totalPages);
      }
    } catch (err) {
      showToast('error', 'Veriler yuklenirken hata olustu');
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
    setWarehouseId('');
    setProductId('');
    setMovementType('');
    setStartDate('');
    setEndDate('');
    setPage(1);
    setTimeout(loadData, 0);
  };

  const columns: Column<StockMovement>[] = [
    {
      key: 'movement_date',
      header: 'Tarih',
      width: '12%',
      render: (m) => formatDate(m.movement_date),
    },
    {
      key: 'warehouse_name',
      header: 'Depo',
      width: '15%',
      render: (m) => m.warehouse_name || '-',
    },
    {
      key: 'product_name',
      header: 'Urun',
      width: '20%',
      render: (m) => m.product_name || '-',
    },
    {
      key: 'movement_type',
      header: 'Hareket Tipi',
      width: '12%',
      render: (m) => (
        <Badge variant={
          ['sale', 'transfer_out'].includes(m.movement_type) ? 'danger' :
          ['return', 'transfer_in', 'purchase'].includes(m.movement_type) ? 'success' :
          'default'
        }>
          {MOVEMENT_TYPE_LABELS[m.movement_type] || m.movement_type}
        </Badge>
      ),
    },
    {
      key: 'quantity',
      header: 'Miktar',
      align: 'right',
      width: '10%',
      render: (m) => (
        <span className={m.quantity > 0 ? styles.positive : styles.negative}>
          {m.quantity > 0 ? '+' : ''}{m.quantity}
        </span>
      ),
    },
    {
      key: 'stock_after',
      header: 'Sonraki Stok',
      align: 'right',
      width: '10%',
      render: (m) => m.stock_after,
    },
    {
      key: 'notes',
      header: 'Notlar',
      width: '21%',
      render: (m) => m.notes || '-',
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Stok Hareketleri</h1>
          <p className={styles.subtitle}>Tum depolardaki stok giri ve cikislari</p>
        </div>
      </div>

      <Card className={styles.filtersCard}>
        <div className={styles.filtersGrid}>
          <div className={styles.filterGroup}>
            <label className={styles.label}>Depo</label>
            <Select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              options={[
                { value: '', label: 'Tum Depolar' },
                ...warehouses.map(w => ({ value: w.id, label: w.name })),
              ]}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.label}>Urun</label>
            <Select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              options={[
                { value: '', label: 'Tum Urunler' },
                ...products.map(p => ({ value: p.id, label: p.name })),
              ]}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.label}>Hareket Tipi</label>
            <Select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value)}
              options={[
                { value: '', label: 'Tum Tipler' },
                { value: 'sale', label: 'Satis' },
                { value: 'return', label: 'Iade' },
                { value: 'transfer_in', label: 'Transfer Giris' },
                { value: 'transfer_out', label: 'Transfer Cikis' },
                { value: 'adjustment', label: 'Duzeltme' },
                { value: 'purchase', label: 'Satin Alma' },
              ]}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.label}>Baslangic Tarihi</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.label}>Bitis Tarihi</label>
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
          data={movements}
          keyExtractor={(m) => m.id}
          loading={loading}
          emptyMessage="Stok hareketi bulunamadi"
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
