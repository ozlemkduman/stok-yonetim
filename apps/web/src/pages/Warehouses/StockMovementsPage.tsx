import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Input, Select, Table, Badge, type Column } from '@stok/ui';
import { Warehouse, StockMovement, warehousesApi } from '../../api/warehouses.api';
import { Product, productsApi } from '../../api/products.api';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';
import styles from './StockMovementsPage.module.css';

export function StockMovementsPage() {
  const { t } = useTranslation(['warehouses', 'common']);
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
      showToast('error', t('warehouses:toast.dataLoadError'));
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
      header: t('warehouses:columns.date'),
      width: '12%',
      render: (m) => formatDate(m.movement_date),
    },
    {
      key: 'warehouse_name',
      header: t('warehouses:columns.warehouse'),
      width: '15%',
      render: (m) => m.warehouse_name || '-',
    },
    {
      key: 'product_name',
      header: t('warehouses:columns.product'),
      width: '20%',
      render: (m) => m.product_name || '-',
    },
    {
      key: 'movement_type',
      header: t('warehouses:columns.movementType'),
      width: '12%',
      render: (m) => (
        <Badge variant={
          ['sale', 'transfer_out'].includes(m.movement_type) ? 'danger' :
          ['return', 'transfer_in', 'purchase'].includes(m.movement_type) ? 'success' :
          'default'
        }>
          {t(`warehouses:movementTypes.${m.movement_type}`)}
        </Badge>
      ),
    },
    {
      key: 'quantity',
      header: t('warehouses:columns.quantity'),
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
      header: t('warehouses:columns.stockAfter'),
      align: 'right',
      width: '10%',
      render: (m) => m.stock_after,
    },
    {
      key: 'notes',
      header: t('warehouses:columns.notes'),
      width: '21%',
      render: (m) => m.notes || '-',
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('warehouses:stockMovementsPage.title')}</h1>
          <p className={styles.subtitle}>{t('warehouses:stockMovementsPage.subtitle')}</p>
        </div>
      </div>

      <Card className={styles.filtersCard}>
        <div className={styles.filtersGrid}>
          <div className={styles.filterGroup}>
            <label className={styles.label}>{t('warehouses:filters.warehouse')}</label>
            <Select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              options={[
                { value: '', label: t('warehouses:filters.allWarehouses') },
                ...warehouses.map(w => ({ value: w.id, label: w.name })),
              ]}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.label}>{t('warehouses:filters.product')}</label>
            <Select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              options={[
                { value: '', label: t('warehouses:filters.allProducts') },
                ...products.map(p => ({ value: p.id, label: p.name })),
              ]}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.label}>{t('warehouses:filters.movementType')}</label>
            <Select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value)}
              options={[
                { value: '', label: t('warehouses:filters.allTypes') },
                { value: 'sale', label: t('warehouses:movementTypes.sale') },
                { value: 'return', label: t('warehouses:movementTypes.return') },
                { value: 'transfer_in', label: t('warehouses:movementTypes.transfer_in') },
                { value: 'transfer_out', label: t('warehouses:movementTypes.transfer_out') },
                { value: 'adjustment', label: t('warehouses:movementTypes.adjustment') },
                { value: 'purchase', label: t('warehouses:movementTypes.purchaseFull') },
              ]}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.label}>{t('warehouses:filters.startDate')}</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.label}>{t('warehouses:filters.endDate')}</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className={styles.filterActions}>
            <Button onClick={handleFilter}>{t('warehouses:buttons.filter')}</Button>
            <Button variant="ghost" onClick={handleReset}>{t('warehouses:buttons.reset')}</Button>
          </div>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          data={movements}
          keyExtractor={(m) => m.id}
          loading={loading}
          emptyMessage={t('warehouses:empty.stockMovements')}
        />

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>
              {t('warehouses:buttons.previous')}
            </Button>
            <span>{t('warehouses:stockMovementsPage.page', { current: page, total: totalPages })}</span>
            <Button size="sm" variant="secondary" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              {t('warehouses:buttons.next')}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
