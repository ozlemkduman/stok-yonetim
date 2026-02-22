import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  max_quantity?: number;
  unit_price: number;
  vat_rate: number;
  line_total: number;
  vat_amount: number;
  sale_item_id?: string;
}

export function ReturnFormPage() {
  const { t } = useTranslation(['returns', 'common']);
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

  const RETURN_REASONS = [
    { value: '', label: t('returns:reasons.selectReason') },
    { value: 'kusurlu', label: t('returns:reasons.kusurlu') },
    { value: 'yanlis_urun', label: t('returns:reasons.yanlis_urun') },
    { value: 'hasarli', label: t('returns:reasons.hasarli') },
    { value: 'memnuniyetsizlik', label: t('returns:reasons.memnuniyetsizlik') },
    { value: 'diger', label: t('returns:reasons.diger') },
  ];

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
        showToast('error', t('returns:toast.dataLoadError'));
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

      // Populate items from sale with quantity=1 (user selects how many to return)
      if (sale.items) {
        setItems(sale.items.map(item => {
          const qty = 1;
          const subtotal = qty * item.unit_price;
          const vatAmount = subtotal * ((item.vat_rate || 0) / 100);
          return {
            product_id: item.product_id,
            product_name: item.product_name || '',
            quantity: qty,
            max_quantity: item.quantity,
            unit_price: item.unit_price,
            vat_rate: item.vat_rate,
            line_total: subtotal + vatAmount,
            vat_amount: vatAmount,
            sale_item_id: item.id,
          };
        }));
      }
    } catch (err) {
      showToast('error', t('returns:toast.saleLoadError'));
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
      showToast('error', t('returns:form.addItemError'));
      return;
    }

    if (!reason) {
      showToast('error', t('returns:form.reasonError'));
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
      showToast('success', t('returns:toast.createSuccess'));
      navigate('/returns');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('returns:toast.createError'));
    } finally {
      setSaving(false);
    }
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>{t('returns:form.loading')}</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Button variant="ghost" onClick={() => navigate('/returns')}>
          {t('returns:form.backToList')}
        </Button>
        <h1 className={styles.title}>{t('returns:form.title')}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <Card className={styles.formCard}>
            <h3>{t('returns:form.returnInfo')}</h3>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>{t('returns:form.saleReturn')}</label>
                <Select
                  value={saleId}
                  onChange={(e) => handleSaleSelect(e.target.value)}
                  options={[
                    { value: '', label: t('returns:form.withoutSale') },
                    ...sales.map(s => ({
                      value: s.id,
                      label: `${s.invoice_number} - ${s.customer_name || t('returns:form.retail')} - ${formatCurrency(s.grand_total)}`
                    })),
                  ]}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>{t('returns:form.customer')}</label>
                <Select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  options={[
                    { value: '', label: t('returns:form.selectCustomer') },
                    ...customers.map(c => ({ value: c.id, label: c.name })),
                  ]}
                  disabled={!!saleId}
                />
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>{t('returns:form.warehouse')}</label>
                <Select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  options={warehouses.map(w => ({ value: w.id, label: w.name }))}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>{t('returns:form.returnReason')}</label>
                <Select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  options={RETURN_REASONS}
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>{t('returns:form.additionalNotes')}</label>
              <textarea
                className={styles.textarea}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder={t('returns:form.notesPlaceholder')}
              />
            </div>
          </Card>
        </div>

        <Card className={styles.itemsCard}>
          <div className={styles.itemsHeader}>
            <h3>{t('returns:form.returnItems')}</h3>
            {!saleId && (
              <Button type="button" size="sm" onClick={addItem}>
                {t('returns:form.addProduct')}
              </Button>
            )}
          </div>

          {items.length === 0 ? (
            <div className={styles.emptyItems}>
              {saleId
                ? t('returns:form.emptyItemsSale')
                : t('returns:form.emptyItemsManual')}
            </div>
          ) : (
            <div className={styles.itemsTableContainer}>
              <table className={styles.itemsTable}>
                <thead>
                  <tr>
                    <th>{t('returns:form.product')}</th>
                    <th className={styles.alignRight}>{t('returns:form.quantity')}</th>
                    <th className={styles.alignRight}>{t('returns:form.unitPrice')}</th>
                    <th className={styles.alignRight}>{t('returns:form.vat')}</th>
                    <th className={styles.alignRight}>{t('returns:form.total')}</th>
                    <th></th>
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
                              { value: '', label: t('returns:form.selectProduct') },
                              ...products.map(p => ({ value: p.id, label: p.name })),
                            ]}
                          />
                        )}
                      </td>
                      <td>
                        <Input
                          type="number"
                          min="1"
                          max={item.max_quantity || undefined}
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                          className={styles.numberInput}
                        />
                        {item.max_quantity && (
                          <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                            max: {item.max_quantity}
                          </span>
                        )}
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
                      <td>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItem(index)}
                          className={styles.deleteButton}
                        >
                          {t('returns:form.delete')}
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
                <span>{t('returns:form.subtotal')}</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className={styles.totalRow}>
                <span>{t('returns:form.vatTotal')}</span>
                <span>{formatCurrency(totals.vatTotal)}</span>
              </div>
              <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                <span>{t('returns:form.returnAmount')}</span>
                <span>{formatCurrency(totals.grandTotal)}</span>
              </div>
            </div>
          </div>
        </Card>

        <div className={styles.formActions}>
          <Button type="button" variant="ghost" onClick={() => navigate('/returns')}>
            {t('returns:form.cancel')}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? t('returns:form.saving') : t('returns:form.submit')}
          </Button>
        </div>
      </form>
    </div>
  );
}
