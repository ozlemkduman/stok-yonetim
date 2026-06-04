import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input, Select } from '@stok/ui';
import { openingStockApi, CreateOpeningStockData } from '../../api/opening-stock.api';
import { productsApi, Product } from '../../api/products.api';
import { warehousesApi, Warehouse } from '../../api/warehouses.api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import styles from './OpeningStockFormPage.module.css';

interface FormItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_cost: number;
}

export function OpeningStockFormPage() {
  const { t } = useTranslation(['openingStock', 'common']);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [warehouseId, setWarehouseId] = useState('');
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<FormItem[]>([]);

  useEffect(() => {
    (async () => {
      const [pRes, wRes] = await Promise.allSettled([
        productsApi.getAll({ limit: 1000, isActive: 'true' }),
        warehousesApi.getAll({ isActive: true }),
      ]);
      if (pRes.status === 'fulfilled') {
        setProducts(pRes.value.data);
        if (pRes.value.data.length === 0) {
          showToast('error', t('openingStock:toast.noProducts'));
        }
      } else {
        showToast('error', t('openingStock:toast.dataLoadError'));
      }
      if (wRes.status === 'fulfilled') {
        setWarehouses(wRes.value.data);
        const def = wRes.value.data.find((wh) => wh.is_default);
        if (def) setWarehouseId(def.id);
      }
      setLoading(false);
    })();
  }, []);

  const addItem = () => {
    setItems([...items, { product_id: '', product_name: '', quantity: 1, unit_cost: 0 }]);
  };

  const updateItem = (idx: number, changes: Partial<FormItem>) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...changes };
    setItems(next);
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleProductChange = (idx: number, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      updateItem(idx, {
        product_id: productId,
        product_name: product.name,
        unit_cost: Number(product.purchase_price) || 0,
      });
    } else {
      updateItem(idx, { product_id: productId, product_name: '' });
    }
  };

  const totalValue = items.reduce((acc, it) => acc + it.quantity * it.unit_cost, 0);

  const handleSubmit = async () => {
    if (items.length === 0) {
      showToast('error', t('openingStock:validation.addItem'));
      return;
    }
    for (const it of items) {
      if (!it.product_id) {
        showToast('error', t('openingStock:validation.selectProduct'));
        return;
      }
      if (it.quantity <= 0) {
        showToast('error', t('openingStock:validation.invalidQuantity'));
        return;
      }
    }

    setSaving(true);
    try {
      const data: CreateOpeningStockData = {
        warehouse_id: warehouseId || undefined,
        items: items.map((it) => ({
          product_id: it.product_id,
          quantity: it.quantity,
          unit_cost: it.unit_cost,
        })),
        entry_date: entryDate || undefined,
        notes: notes || undefined,
      };
      await openingStockApi.create(data);
      showToast('success', t('openingStock:toast.created'));
      navigate('/opening-stock');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('openingStock:toast.saveError'));
    }
    setSaving(false);
  };

  if (loading) {
    return <div className={styles.loading}>{t('common:labels.loading')}</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Button variant="ghost" onClick={() => navigate('/opening-stock')}>&larr; {t('openingStock:form.back')}</Button>
        <h1 className={styles.title}>{t('openingStock:form.title')}</h1>
      </div>

      <div className={styles.warningBox}>
        {t('openingStock:form.warning')}
      </div>

      <div className={styles.card}>
        <h3>{t('openingStock:form.basicInfo')}</h3>
        <div className={styles.row}>
          <div className={styles.field}>
            <label>{t('openingStock:form.entryDate')}</label>
            <Input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} fullWidth />
          </div>
          <div className={styles.field}>
            <label>{t('openingStock:form.warehouse')}</label>
            <Select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              options={[{ value: '', label: '-' }, ...warehouses.map((w) => ({ value: w.id, label: w.name }))]}
              fullWidth
            />
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.itemsHeader}>
          <h3>{t('openingStock:form.items')}</h3>
          <Button size="sm" onClick={addItem}>+ {t('openingStock:form.addItem')}</Button>
        </div>

        {products.length === 0 && (
          <div className={styles.warningBox}>
            {t('openingStock:form.noProductsWarning')}
          </div>
        )}

        {items.length === 0 ? (
          <div className={styles.emptyItems}>{t('openingStock:form.emptyItems')}</div>
        ) : (
          <div className={styles.itemsList}>
            {items.map((it, idx) => {
              const lineTotal = it.quantity * it.unit_cost;
              return (
                <div key={idx} className={styles.itemCard}>
                  <div className={styles.itemHeader}>
                    <span className={styles.itemNumber}>#{idx + 1}</span>
                    <strong className={styles.itemTotal}>{formatCurrency(lineTotal)}</strong>
                    <Button size="xs" variant="danger" onClick={() => removeItem(idx)} aria-label={t('common:buttons.delete')}>×</Button>
                  </div>
                  <div className={styles.itemBody}>
                    <div className={styles.itemFieldFull}>
                      <label>{t('openingStock:form.product')}</label>
                      <Select
                        value={it.product_id}
                        onChange={(e) => handleProductChange(idx, e.target.value)}
                        options={[{ value: '', label: t('openingStock:form.selectProduct') }, ...products.map((p) => ({ value: p.id, label: p.name }))]}
                        fullWidth
                      />
                    </div>
                    <div className={styles.itemFieldGrid}>
                      <div className={styles.itemField}>
                        <label>{t('openingStock:form.quantity')}</label>
                        <Input type="number" step="any" min="0" value={it.quantity} onChange={(e) => updateItem(idx, { quantity: parseFloat(e.target.value) || 0 })} fullWidth />
                      </div>
                      <div className={styles.itemField}>
                        <label>{t('openingStock:form.unitCost')}</label>
                        <Input type="number" step="0.01" min="0" value={it.unit_cost} onChange={(e) => updateItem(idx, { unit_cost: parseFloat(e.target.value) || 0 })} fullWidth />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.card}>
        <h3>{t('openingStock:form.notes')}</h3>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('openingStock:form.notesPlaceholder')} fullWidth />
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryRow}>
          <span>{t('openingStock:form.totalValue')}</span>
          <strong>{formatCurrency(totalValue)}</strong>
        </div>
      </div>

      <div className={styles.actions}>
        <Button variant="ghost" onClick={() => navigate('/opening-stock')} disabled={saving}>{t('common:buttons.cancel')}</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={saving || items.length === 0}>
          {saving ? t('common:labels.saving') : t('openingStock:form.save')}
        </Button>
      </div>
    </div>
  );
}
