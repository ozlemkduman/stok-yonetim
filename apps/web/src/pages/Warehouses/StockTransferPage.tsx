import { useState, useEffect } from 'react';
import { Button, Card, Input, Select, Table, Badge, type Column } from '@stok/ui';
import {
  Warehouse,
  StockTransfer,
  TransferItemData,
  warehousesApi
} from '../../api/warehouses.api';
import { Product, productsApi } from '../../api/products.api';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';
import styles from './StockTransferPage.module.css';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Beklemede',
  in_transit: 'Transfer Ediliyor',
  completed: 'Tamamlandi',
  cancelled: 'Iptal',
};

export function StockTransferPage() {
  const { showToast } = useToast();

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
      showToast('error', 'Veriler yuklenirken hata olustu');
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
      showToast('error', 'Kaynak ve hedef depo secin');
      return;
    }

    if (fromWarehouseId === toWarehouseId) {
      showToast('error', 'Kaynak ve hedef depo ayni olamaz');
      return;
    }

    if (items.length === 0 || items.some(item => !item.product_id || item.quantity < 1)) {
      showToast('error', 'Gecerli urun ve miktar girin');
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
      showToast('success', 'Transfer olusturuldu');
      setShowForm(false);
      resetForm();
      loadData();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Transfer olusturulamadi');
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
    if (!confirm('Transferi tamamlamak istediginize emin misiniz?')) return;
    try {
      await warehousesApi.completeTransfer(transfer.id);
      showToast('success', 'Transfer tamamlandi');
      loadData();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Islem basarisiz');
    }
  };

  const handleCancel = async (transfer: StockTransfer) => {
    if (!confirm('Transferi iptal etmek istediginize emin misiniz?')) return;
    try {
      await warehousesApi.cancelTransfer(transfer.id);
      showToast('success', 'Transfer iptal edildi');
      loadData();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Islem basarisiz');
    }
  };

  const columns: Column<StockTransfer>[] = [
    {
      key: 'transfer_number',
      header: 'Transfer No',
      render: (t) => <strong>{t.transfer_number}</strong>,
    },
    {
      key: 'from_warehouse',
      header: 'Kaynak Depo',
      render: (t) => t.from_warehouse_name || '-',
    },
    {
      key: 'to_warehouse',
      header: 'Hedef Depo',
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
          t.status === 'in_transit' ? 'info' : 'warning'
        }>
          {STATUS_LABELS[t.status]}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (t) => (
        <div className={styles.actions}>
          {t.status === 'pending' && (
            <>
              <Button size="sm" variant="primary" onClick={() => handleComplete(t)}>
                Tamamla
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleCancel(t)}>
                Iptal
              </Button>
            </>
          )}
          {t.status === 'in_transit' && (
            <Button size="sm" variant="primary" onClick={() => handleComplete(t)}>
              Tamamla
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
          <h1 className={styles.title}>Stok Transferleri</h1>
          <p className={styles.subtitle}>Depolar arasi stok transfer islemleri</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Formu Kapat' : '+ Yeni Transfer'}
        </Button>
      </div>

      {showForm && (
        <Card className={styles.formCard}>
          <h3>Yeni Transfer</h3>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Kaynak Depo *</label>
                <Select
                  value={fromWarehouseId}
                  onChange={(e) => setFromWarehouseId(e.target.value)}
                  options={[
                    { value: '', label: 'Depo Secin' },
                    ...warehouses.map(w => ({ value: w.id, label: w.name })),
                  ]}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Hedef Depo *</label>
                <Select
                  value={toWarehouseId}
                  onChange={(e) => setToWarehouseId(e.target.value)}
                  options={[
                    { value: '', label: 'Depo Secin' },
                    ...warehouses.filter(w => w.id !== fromWarehouseId).map(w => ({ value: w.id, label: w.name })),
                  ]}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Transfer Tarihi</label>
                <Input
                  type="date"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.itemsSection}>
              <div className={styles.itemsHeader}>
                <h4>Urunler</h4>
                <Button type="button" size="sm" onClick={addItem}>+ Urun Ekle</Button>
              </div>

              {items.length === 0 ? (
                <p className={styles.emptyItems}>Henuz urun eklenmedi</p>
              ) : (
                <table className={styles.itemsTable}>
                  <thead>
                    <tr>
                      <th>Urun</th>
                      <th>Miktar</th>
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
                              { value: '', label: 'Urun Secin' },
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
                            Sil
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Notlar</label>
              <textarea
                className={styles.textarea}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div className={styles.formActions}>
              <Button type="button" variant="ghost" onClick={() => { setShowForm(false); resetForm(); }}>
                Iptal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Kaydediliyor...' : 'Transfer Olustur'}
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
              { value: '', label: 'Tum Durumlar' },
              { value: 'pending', label: 'Beklemede' },
              { value: 'in_transit', label: 'Transfer Ediliyor' },
              { value: 'completed', label: 'Tamamlandi' },
              { value: 'cancelled', label: 'Iptal' },
            ]}
          />
        </div>

        <Table
          columns={columns}
          data={transfers}
          keyExtractor={(t) => t.id}
          loading={loading}
          emptyMessage="Transfer bulunamadi"
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
