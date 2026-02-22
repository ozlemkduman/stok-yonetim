import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Input, Select, Table, Badge, type Column } from '@stok/ui';
import {
  Warehouse,
  StockTransfer,
  TransferItemData,
  warehousesApi
} from '../../api/warehouses.api';
import { Product, productsApi } from '../../api/products.api';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { formatDate } from '../../utils/formatters';
import styles from './StockTransferPage.module.css';

export function StockTransferPage() {
  const { t } = useTranslation(['warehouses', 'common']);
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();

  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  // New transfer form
  const [showForm, setShowForm] = useState(false);
  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<(TransferItemData & { product_name?: string })[]>([]);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [transfersRes, warehousesRes, productsRes] = await Promise.all([
        warehousesApi.getTransfers({ page, limit: 20, status: statusFilter || undefined }),
        warehousesApi.getAll({ isActive: true }),
        productsApi.getAll({ limit: 1000, isActive: 'true' }),
      ]);
      setTransfers(transfersRes.data);
      setWarehouses(warehousesRes.data);
      setProducts(productsRes.data);
      if (transfersRes.meta) {
        setTotalPages(transfersRes.meta.totalPages);
      }
    } catch (err) {
      showToast('error', t('warehouses:toast.dataLoadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, statusFilter]);

  const addItem = () => {
    setItems([...items, { product_id: '', quantity: 1 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof TransferItemData, value: string | number) => {
    const newItems = [...items];
    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      newItems[index] = {
        ...newItems[index],
        product_id: value as string,
        product_name: product?.name,
      };
    } else if (field === 'quantity') {
      newItems[index] = { ...newItems[index], quantity: value as number };
    }
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fromWarehouseId || !toWarehouseId) {
      showToast('error', t('warehouses:toast.selectWarehousesError'));
      return;
    }

    if (fromWarehouseId === toWarehouseId) {
      showToast('error', t('warehouses:toast.sameWarehouseError'));
      return;
    }

    if (items.length === 0 || items.some(item => !item.product_id || item.quantity < 1)) {
      showToast('error', t('warehouses:toast.invalidItemsError'));
      return;
    }

    setSaving(true);
    try {
      await warehousesApi.createTransfer({
        from_warehouse_id: fromWarehouseId,
        to_warehouse_id: toWarehouseId,
        transfer_date: transferDate,
        items: items.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
        notes: notes || undefined,
      });
      showToast('success', t('warehouses:toast.transferCreateSuccess'));
      setShowForm(false);
      resetForm();
      loadData();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('warehouses:toast.transferCreateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFromWarehouseId('');
    setToWarehouseId('');
    setTransferDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setItems([]);
  };

  const handleComplete = async (transfer: StockTransfer) => {
    const confirmed = await confirm({ message: t('warehouses:confirm.completeTransferAlt'), variant: 'warning' });
    if (!confirmed) return;
    try {
      await warehousesApi.completeTransfer(transfer.id);
      showToast('success', t('warehouses:toast.completeSuccess'));
      loadData();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('warehouses:toast.operationFailed'));
    }
  };

  const handleCancel = async (transfer: StockTransfer) => {
    const confirmed = await confirm({ message: t('warehouses:confirm.cancelTransferAlt'), variant: 'danger' });
    if (!confirmed) return;
    try {
      await warehousesApi.cancelTransfer(transfer.id);
      showToast('success', t('warehouses:toast.cancelSuccess'));
      loadData();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('warehouses:toast.operationFailed'));
    }
  };

  const columns: Column<StockTransfer>[] = [
    {
      key: 'transfer_number',
      header: t('warehouses:columns.transferNo'),
      render: (tr) => <strong>{tr.transfer_number}</strong>,
    },
    {
      key: 'from_warehouse',
      header: t('warehouses:columns.sourceWarehouse'),
      render: (tr) => tr.from_warehouse_name || '-',
    },
    {
      key: 'to_warehouse',
      header: t('warehouses:columns.targetWarehouse'),
      render: (tr) => tr.to_warehouse_name || '-',
    },
    {
      key: 'transfer_date',
      header: t('warehouses:columns.date'),
      render: (tr) => formatDate(tr.transfer_date),
    },
    {
      key: 'status',
      header: t('warehouses:columns.status'),
      render: (tr) => (
        <Badge variant={
          tr.status === 'completed' ? 'success' :
          tr.status === 'cancelled' ? 'danger' :
          tr.status === 'in_transit' ? 'info' : 'warning'
        }>
          {t(`warehouses:transferStatusAlt.${tr.status}`)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (tr) => (
        <div className={styles.actions}>
          {tr.status === 'pending' && (
            <>
              <Button size="sm" variant="primary" onClick={() => handleComplete(tr)}>
                {t('warehouses:buttons.complete')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleCancel(tr)}>
                {t('warehouses:buttons.cancel')}
              </Button>
            </>
          )}
          {tr.status === 'in_transit' && (
            <Button size="sm" variant="primary" onClick={() => handleComplete(tr)}>
              {t('warehouses:buttons.complete')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('warehouses:stockTransferPage.title')}</h1>
          <p className={styles.subtitle}>{t('warehouses:stockTransferPage.subtitle')}</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? t('warehouses:buttons.closeForm') : t('warehouses:buttons.newTransfer')}
        </Button>
      </div>

      {showForm && (
        <Card className={styles.formCard}>
          <h3>{t('warehouses:stockTransferPage.newTransferTitle')}</h3>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>{t('warehouses:stockTransferPage.sourceWarehouse')}</label>
                <Select
                  value={fromWarehouseId}
                  onChange={(e) => setFromWarehouseId(e.target.value)}
                  options={[
                    { value: '', label: t('warehouses:stockTransferPage.selectWarehouse') },
                    ...warehouses.map(w => ({ value: w.id, label: w.name })),
                  ]}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>{t('warehouses:stockTransferPage.targetWarehouse')}</label>
                <Select
                  value={toWarehouseId}
                  onChange={(e) => setToWarehouseId(e.target.value)}
                  options={[
                    { value: '', label: t('warehouses:stockTransferPage.selectWarehouse') },
                    ...warehouses.filter(w => w.id !== fromWarehouseId).map(w => ({ value: w.id, label: w.name })),
                  ]}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>{t('warehouses:stockTransferPage.transferDate')}</label>
                <Input
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.itemsSection}>
              <div className={styles.itemsHeader}>
                <h4>{t('warehouses:stockTransferPage.products')}</h4>
                <Button type="button" size="sm" onClick={addItem}>{t('warehouses:buttons.addProduct')}</Button>
              </div>

              {items.length === 0 ? (
                <p className={styles.emptyItems}>{t('warehouses:empty.noProducts')}</p>
              ) : (
                <table className={styles.itemsTable}>
                  <thead>
                    <tr>
                      <th>{t('warehouses:columns.product')}</th>
                      <th>{t('warehouses:columns.quantity')}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <Select
                            value={item.product_id}
                            onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                            options={[
                              { value: '', label: t('warehouses:stockTransferPage.selectProduct') },
                              ...products.map(p => ({ value: p.id, label: p.name })),
                            ]}
                          />
                        </td>
                        <td>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                          />
                        </td>
                        <td>
                          <Button type="button" size="sm" variant="ghost" onClick={() => removeItem(index)}>
                            {t('warehouses:buttons.delete')}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>{t('warehouses:stockTransferPage.notes')}</label>
              <textarea
                className={styles.textarea}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div className={styles.formActions}>
              <Button type="button" variant="ghost" onClick={() => { setShowForm(false); resetForm(); }}>
                {t('warehouses:buttons.cancel')}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? t('warehouses:buttons.saving') : t('warehouses:buttons.createTransfer')}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className={styles.filters}>
          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            options={[
              { value: '', label: t('warehouses:filters.allStatuses') },
              { value: 'pending', label: t('warehouses:transferStatusAlt.pending') },
              { value: 'in_transit', label: t('warehouses:transferStatusAlt.in_transit') },
              { value: 'completed', label: t('warehouses:transferStatusAlt.completed') },
              { value: 'cancelled', label: t('warehouses:transferStatusAlt.cancelled') },
            ]}
          />
        </div>

        <Table
          columns={columns}
          data={transfers}
          keyExtractor={(tr) => tr.id}
          loading={loading}
          emptyMessage={t('warehouses:empty.transfers')}
        />

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>
              {t('warehouses:buttons.previous')}
            </Button>
            <span>{t('warehouses:stockTransferPage.page', { current: page, total: totalPages })}</span>
            <Button size="sm" variant="secondary" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              {t('warehouses:buttons.next')}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
