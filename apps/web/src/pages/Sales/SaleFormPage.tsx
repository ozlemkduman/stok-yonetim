import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input, Select } from '@stok/ui';
import { salesApi, CreateSaleData } from '../../api/sales.api';
import { Customer, customersApi } from '../../api/customers.api';
import { Product, productsApi } from '../../api/products.api';
import { Warehouse, warehousesApi } from '../../api/warehouses.api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import styles from './SaleFormPage.module.css';

interface SaleFormItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_rate: number;
  vat_rate: number;
  line_total: number;
  vat_amount: number;
  stock_quantity?: number;
}

const PAYMENT_METHODS = [
  { value: 'nakit', label: 'Nakit' },
  { value: 'kredi_karti', label: 'Kredi Karti' },
  { value: 'havale', label: 'Havale/EFT' },
  { value: 'veresiye', label: 'Veresiye' },
];

export function SaleFormPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  // Form state
  const [customerId, setCustomerId] = useState<string>('');
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('nakit');
  const [dueDate, setDueDate] = useState<string>('');
  const [includeVat, setIncludeVat] = useState(true);
  const [discountRate, setDiscountRate] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<SaleFormItem[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [customersRes, productsRes, warehousesRes] = await Promise.all([
          customersApi.getAll({ limit: 1000, isActive: true }),
          productsApi.getAll({ limit: 1000, isActive: 'true' }),
          warehousesApi.getAll({ isActive: true }),
        ]);
        setCustomers(customersRes.data);
        setProducts(productsRes.data);
        setWarehouses(warehousesRes.data);

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

  const addItem = () => {
    setItems([...items, {
      product_id: '',
      product_name: '',
      quantity: 1,
      unit_price: 0,
      discount_rate: 0,
      vat_rate: 18,
      line_total: 0,
      vat_amount: 0,
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof SaleFormItem, value: string | number) => {
    const newItems = [...items];
    const item = { ...newItems[index] };

    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        item.product_id = product.id;
        item.product_name = product.name;
        item.unit_price = product.sale_price;
        item.vat_rate = product.vat_rate;
        item.stock_quantity = product.stock_quantity;
      }
    } else {
      (item as Record<string, unknown>)[field] = value;
    }

    // Calculate line total
    const subtotal = item.quantity * item.unit_price;
    const discountedSubtotal = subtotal * (1 - (item.discount_rate || 0) / 100);
    item.vat_amount = discountedSubtotal * ((item.vat_rate || 0) / 100);
    item.line_total = discountedSubtotal + item.vat_amount;

    newItems[index] = item;
    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unit_price;
      return sum + itemSubtotal * (1 - (item.discount_rate || 0) / 100);
    }, 0);

    const vatTotal = items.reduce((sum, item) => sum + item.vat_amount, 0);

    let discount = discountAmount;
    if (discountRate > 0) {
      discount = subtotal * (discountRate / 100);
    }

    const grandTotal = subtotal + vatTotal - discount;

    return { subtotal, vatTotal, discount, grandTotal };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      showToast('error', 'En az bir urun ekleyin');
      return;
    }

    // Check stock
    for (const item of items) {
      if (item.stock_quantity !== undefined && item.quantity > item.stock_quantity) {
        showToast('error', `${item.product_name} icin yeterli stok yok (Mevcut: ${item.stock_quantity})`);
        return;
      }
    }

    setSaving(true);
    try {
      const data: CreateSaleData = {
        customer_id: customerId || undefined,
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_rate: item.discount_rate,
        })),
        discount_amount: discountAmount,
        discount_rate: discountRate,
        include_vat: includeVat,
        payment_method: paymentMethod,
        due_date: dueDate || undefined,
        notes: notes || undefined,
      };

      await salesApi.create(data);
      showToast('success', 'Satis olusturuldu');
      navigate('/sales');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Satis olusturulamadi');
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
        <Button variant="ghost" onClick={() => navigate('/sales')}>
          ← Satislar
        </Button>
        <h1 className={styles.title}>Yeni Satis</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <Card className={styles.formCard}>
            <h3>Satis Bilgileri</h3>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Musteri</label>
                <Select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  options={[
                    { value: '', label: 'Perakende Satis' },
                    ...customers.map(c => ({ value: c.id, label: c.name })),
                  ]}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Depo</label>
                <Select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  options={warehouses.map(w => ({ value: w.id, label: w.name }))}
                />
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Odeme Yontemi *</label>
                <Select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  options={PAYMENT_METHODS}
                />
              </div>
              {paymentMethod === 'veresiye' && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Vade Tarihi</label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={includeVat}
                    onChange={(e) => setIncludeVat(e.target.checked)}
                  />
                  KDV Dahil
                </label>
              </div>
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
          </Card>

          <Card className={styles.formCard}>
            <h3>Iskonto</h3>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Iskonto Orani (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={discountRate}
                  onChange={(e) => {
                    setDiscountRate(Number(e.target.value));
                    setDiscountAmount(0);
                  }}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>veya Iskonto Tutari</label>
                <Input
                  type="number"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => {
                    setDiscountAmount(Number(e.target.value));
                    setDiscountRate(0);
                  }}
                />
              </div>
            </div>
          </Card>
        </div>

        <Card className={styles.itemsCard}>
          <div className={styles.itemsHeader}>
            <h3>Urunler</h3>
            <Button type="button" size="sm" onClick={addItem}>
              + Urun Ekle
            </Button>
          </div>

          {items.length === 0 ? (
            <div className={styles.emptyItems}>
              Henuz urun eklenmedi. "Urun Ekle" butonuna tiklayin.
            </div>
          ) : (
            <div className={styles.itemsTableContainer}>
              <table className={styles.itemsTable}>
                <thead>
                  <tr>
                    <th>Urun</th>
                    <th className={styles.alignRight}>Stok</th>
                    <th className={styles.alignRight}>Miktar</th>
                    <th className={styles.alignRight}>Birim Fiyat</th>
                    <th className={styles.alignRight}>Iskonto %</th>
                    <th className={styles.alignRight}>Toplam</th>
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
                            ...products.map(p => ({ value: p.id, label: `${p.name} (${formatCurrency(p.sale_price)})` })),
                          ]}
                        />
                      </td>
                      <td className={styles.alignRight}>
                        <span className={item.stock_quantity !== undefined && item.quantity > item.stock_quantity ? styles.lowStock : ''}>
                          {item.stock_quantity ?? '-'}
                        </span>
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
                      <td>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                          className={styles.numberInput}
                        />
                      </td>
                      <td>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discount_rate}
                          onChange={(e) => updateItem(index, 'discount_rate', Number(e.target.value))}
                          className={styles.numberInput}
                        />
                      </td>
                      <td className={styles.alignRight}>
                        {formatCurrency(item.line_total)}
                      </td>
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
              {totals.discount > 0 && (
                <div className={styles.totalRow}>
                  <span>Iskonto:</span>
                  <span>-{formatCurrency(totals.discount)}</span>
                </div>
              )}
              <div className={styles.totalRow}>
                <span>KDV Toplam:</span>
                <span>{formatCurrency(totals.vatTotal)}</span>
              </div>
              <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                <span>Genel Toplam:</span>
                <span>{formatCurrency(totals.grandTotal)}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className={styles.formActions}>
          <Button type="button" variant="ghost" onClick={() => navigate('/sales')}>
            Iptal
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Kaydediliyor...' : 'Satisi Tamamla'}
          </Button>
        </div>
      </form>
    </div>
  );
}
