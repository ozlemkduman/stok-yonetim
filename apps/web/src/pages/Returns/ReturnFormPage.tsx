import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input, Select } from '@stok/ui';
import { returnsApi, CreateReturnData } from '../../api/returns.api';
import { Sale, salesApi } from '../../api/sales.api';
import { Customer, customersApi } from '../../api/customers.api';
import { Product, productsApi } from '../../api/products.api';
import { Warehouse, warehousesApi } from '../../api/warehouses.api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import styles from './ReturnFormPage.module.css';

interface ReturnFormItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  line_total: number;
  vat_amount: number;
  sale_item_id?: string;
}

const RETURN_REASONS = [
  { value: '', label: 'Neden Secin' },
  { value: 'kusurlu', label: 'Kusurlu Urun' },
  { value: 'yanlis_urun', label: 'Yanlis Urun' },
  { value: 'hasarli', label: 'Hasarli' },
  { value: 'memnuniyetsizlik', label: 'Musteri Memnuniyetsizligi' },
  { value: 'diger', label: 'Diger' },
];

export function ReturnFormPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  // Form state
  const [saleId, setSaleId] = useState<string>('');
  const [customerId, setCustomerId] = useState<string>('');
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ReturnFormItem[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [customersRes, productsRes, warehousesRes, salesRes] = await Promise.all([
          customersApi.getAll({ limit: 1000, isActive: true }),
          productsApi.getAll({ limit: 1000, isActive: 'true' }),
          warehousesApi.getAll({ isActive: true }),
          salesApi.getAll({ limit: 100 }),
        ]);
        setCustomers(customersRes.data);
        setProducts(productsRes.data);
        setWarehouses(warehousesRes.data);
        setSales(salesRes.data.filter(s => s.status === 'completed'));

        // Set default warehouse
        const defaultWarehouse = warehousesRes.data.find(w => w.is_default);
        if (defaultWarehouse) {
          setWarehouseId(defaultWarehouse.id);
        }
      } catch (err) {
        showToast('error', 'Veriler yuklenirken hata olustu');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSaleSelect = async (selectedSaleId: string) => {
    setSaleId(selectedSaleId);
    if (!selectedSaleId) {
      setCustomerId('');
      setItems([]);
      return;
    }

    try {
      const response = await salesApi.getDetail(selectedSaleId);
      const sale = response.data;
      setCustomerId(sale.customer_id || '');

      // Populate items from sale
      if (sale.items) {
        setItems(sale.items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name || '',
          quantity: item.quantity,
          unit_price: item.unit_price,
          vat_rate: item.vat_rate,
          line_total: item.line_total,
          vat_amount: item.vat_amount,
          sale_item_id: item.id,
        })));
      }
    } catch (err) {
      showToast('error', 'Satis detaylari yuklenemedi');
    }
  };

  const addItem = () => {
    setItems([...items, {
      product_id: '',
      product_name: '',
      quantity: 1,
      unit_price: 0,
      vat_rate: 18,
      line_total: 0,
      vat_amount: 0,
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ReturnFormItem, value: string | number) => {
    const newItems = [...items];
    const item = { ...newItems[index] };

    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        item.product_id = product.id;
        item.product_name = product.name;
        item.unit_price = product.sale_price;
        item.vat_rate = product.vat_rate;
      }
    } else {
      (item as Record<string, unknown>)[field] = value;
    }

    // Calculate line total
    const subtotal = item.quantity * item.unit_price;
    item.vat_amount = subtotal * ((item.vat_rate || 0) / 100);
    item.line_total = subtotal + item.vat_amount;

    newItems[index] = item;
    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const vatTotal = items.reduce((sum, item) => sum + item.vat_amount, 0);
    const grandTotal = subtotal + vatTotal;

    return { subtotal, vatTotal, grandTotal };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      showToast('error', 'En az bir urun ekleyin');
      return;
    }

    if (!reason) {
      showToast('error', 'Iade nedeni secin');
      return;
    }

    setSaving(true);
    try {
      const data: CreateReturnData = {
        sale_id: saleId || undefined,
        customer_id: customerId || undefined,
        warehouse_id: warehouseId || undefined,
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          vat_rate: item.vat_rate,
          sale_item_id: item.sale_item_id,
        })),
        reason: `${reason}${notes ? ': ' + notes : ''}`,
      };

      await returnsApi.create(data);
      showToast('success', 'Iade olusturuldu');
      navigate('/returns');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Iade olusturulamadi');
    } finally {
      setSaving(false);
    }
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Yukleniyor...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Button variant="ghost" onClick={() => navigate('/returns')}>
          ← Iadeler
        </Button>
        <h1 className={styles.title}>Yeni Iade</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <Card className={styles.formCard}>
            <h3>Iade Bilgileri</h3>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Satistan Iade (Opsiyonel)</label>
                <Select
                  value={saleId}
                  onChange={(e) => handleSaleSelect(e.target.value)}
                  options={[
                    { value: '', label: 'Satisiz Iade' },
                    ...sales.map(s => ({
                      value: s.id,
                      label: `${s.invoice_number} - ${s.customer_name || 'Perakende'} - ${formatCurrency(s.grand_total)}`
                    })),
                  ]}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Musteri</label>
                <Select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  options={[
                    { value: '', label: 'Musteri Secin' },
                    ...customers.map(c => ({ value: c.id, label: c.name })),
                  ]}
                  disabled={!!saleId}
                />
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Depo</label>
                <Select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  options={warehouses.map(w => ({ value: w.id, label: w.name }))}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Iade Nedeni *</label>
                <Select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  options={RETURN_REASONS}
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Ek Aciklama</label>
              <textarea
                className={styles.textarea}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Iade ile ilgili ek aciklamalar..."
              />
            </div>
          </Card>
        </div>

        <Card className={styles.itemsCard}>
          <div className={styles.itemsHeader}>
            <h3>Iade Urunleri</h3>
            {!saleId && (
              <Button type="button" size="sm" onClick={addItem}>
                + Urun Ekle
              </Button>
            )}
          </div>

          {items.length === 0 ? (
            <div className={styles.emptyItems}>
              {saleId
                ? 'Secilen satista urun bulunamadi'
                : 'Henuz urun eklenmedi. "Urun Ekle" butonuna tiklayin veya bir satis secin.'}
            </div>
          ) : (
            <div className={styles.itemsTableContainer}>
              <table className={styles.itemsTable}>
                <thead>
                  <tr>
                    <th>Urun</th>
                    <th className={styles.alignRight}>Miktar</th>
                    <th className={styles.alignRight}>Birim Fiyat</th>
                    <th className={styles.alignRight}>KDV</th>
                    <th className={styles.alignRight}>Toplam</th>
                    {!saleId && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td>
                        {saleId ? (
                          <span>{item.product_name}</span>
                        ) : (
                          <Select
                            value={item.product_id}
                            onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                            options={[
                              { value: '', label: 'Urun Secin' },
                              ...products.map(p => ({ value: p.id, label: p.name })),
                            ]}
                          />
                        )}
                      </td>
                      <td>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                          className={styles.numberInput}
                        />
                      </td>
                      <td className={styles.alignRight}>
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className={styles.alignRight}>
                        %{item.vat_rate}
                      </td>
                      <td className={styles.alignRight}>
                        {formatCurrency(item.line_total)}
                      </td>
                      {!saleId && (
                        <td>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => removeItem(index)}
                            className={styles.deleteButton}
                          >
                            Sil
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className={styles.totalsSection}>
            <div className={styles.totalsGrid}>
              <div className={styles.totalRow}>
                <span>Ara Toplam:</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className={styles.totalRow}>
                <span>KDV Toplam:</span>
                <span>{formatCurrency(totals.vatTotal)}</span>
              </div>
              <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                <span>Iade Tutari:</span>
                <span>{formatCurrency(totals.grandTotal)}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className={styles.formActions}>
          <Button type="button" variant="ghost" onClick={() => navigate('/returns')}>
            Iptal
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Kaydediliyor...' : 'Iadeyi Tamamla'}
          </Button>
        </div>
      </form>
    </div>
  );
}
