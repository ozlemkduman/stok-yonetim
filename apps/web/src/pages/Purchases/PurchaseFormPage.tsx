import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input, Select } from '@stok/ui';
import { purchasesApi, CreatePurchaseData } from '../../api/purchases.api';
import { suppliersApi, Supplier } from '../../api/suppliers.api';
import { productsApi, Product } from '../../api/products.api';
import { warehousesApi, Warehouse } from '../../api/warehouses.api';
import { InlineEntityForm, InlineWarehouseForm, SelectWithAdd } from '../../components/inline';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import styles from './PurchaseFormPage.module.css';

interface FormItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  discount_rate: number;
}

export function PurchaseFormPage() {
  const { t } = useTranslation(['purchases', 'common']);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [supplierId, setSupplierId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('nakit');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
  const [includeVat, setIncludeVat] = useState(true);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<FormItem[]>([]);

  useEffect(() => {
    (async () => {
      // Promise.allSettled: bir endpoint 403 olsa bile diğerleri yüklensin
      const [sRes, pRes, wRes] = await Promise.allSettled([
        suppliersApi.getAll({ limit: 1000, isActive: 'true' }),
        productsApi.getAll({ limit: 1000, isActive: 'true' }),
        warehousesApi.getAll({ isActive: true }),
      ]);
      if (sRes.status === 'fulfilled') setSuppliers(sRes.value.data);
      if (pRes.status === 'fulfilled') {
        setProducts(pRes.value.data);
        if (pRes.value.data.length === 0) {
          showToast('error', t('purchases:toast.noProducts'));
        }
      } else {
        showToast('error', t('purchases:toast.dataLoadError'));
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
    setItems([...items, { product_id: '', product_name: '', quantity: 1, unit_price: 0, vat_rate: 20, discount_rate: 0 }]);
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
        unit_price: Number(product.purchase_price) || 0,
        vat_rate: Number(product.vat_rate) || 20,
      });
    } else {
      updateItem(idx, { product_id: productId, product_name: '' });
    }
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let vatTotal = 0;
    for (const it of items) {
      const lineSub = it.quantity * it.unit_price;
      const lineDisc = lineSub * (it.discount_rate / 100);
      const afterDisc = lineSub - lineDisc;
      const vat = includeVat ? afterDisc * (it.vat_rate / 100) : 0;
      subtotal += afterDisc;
      vatTotal += vat;
    }
    return { subtotal, vatTotal, grandTotal: subtotal + vatTotal };
  };

  const totals = calculateTotals();

  const handleSubmit = async () => {
    if (items.length === 0) {
      showToast('error', t('purchases:validation.addItem'));
      return;
    }
    for (const it of items) {
      if (!it.product_id) {
        showToast('error', t('purchases:validation.selectProduct'));
        return;
      }
      if (it.quantity <= 0) {
        showToast('error', t('purchases:validation.invalidQuantity'));
        return;
      }
    }
    if (paymentMethod === 'veresiye' && !supplierId) {
      showToast('error', t('purchases:validation.creditNeedsSupplier'));
      return;
    }

    // Veresiye için vade tarihi default sale_date + 30
    let effectiveDueDate = dueDate;
    if (paymentMethod === 'veresiye' && !effectiveDueDate) {
      const base = new Date(purchaseDate);
      base.setDate(base.getDate() + 30);
      effectiveDueDate = base.toISOString().split('T')[0];
    }

    setSaving(true);
    try {
      const data: CreatePurchaseData = {
        supplier_id: supplierId || undefined,
        warehouse_id: warehouseId || undefined,
        items: items.map((it) => ({
          product_id: it.product_id,
          quantity: it.quantity,
          unit_price: it.unit_price,
          discount_rate: it.discount_rate,
        })),
        include_vat: includeVat,
        payment_method: paymentMethod,
        purchase_date: purchaseDate || undefined,
        due_date: effectiveDueDate || undefined,
        supplier_invoice_no: supplierInvoiceNo || undefined,
        notes: notes || undefined,
      };
      await purchasesApi.create(data);
      showToast('success', t('purchases:toast.created'));
      navigate('/purchases');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('purchases:toast.saveError'));
    }
    setSaving(false);
  };

  if (loading) {
    return <div className={styles.loading}>{t('common:labels.loading')}</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Button variant="ghost" onClick={() => navigate('/purchases')}>&larr; {t('purchases:form.back')}</Button>
        <h1 className={styles.title}>{t('purchases:form.title')}</h1>
      </div>

      <div className={styles.card}>
        <h3>{t('purchases:form.basicInfo')}</h3>
        <div className={styles.row}>
          <div className={styles.field}>
            <label>{t('purchases:form.supplier')}</label>
            <SelectWithAdd
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              options={[{ value: '', label: t('purchases:form.selectSupplier') }, ...suppliers.map((s) => ({ value: s.id, label: s.name }))]}
              onAdd={() => setShowSupplierModal(true)}
              addTitle={t('common:inlineEntity.addSupplier')}
            />
            <InlineEntityForm
              type="supplier"
              isOpen={showSupplierModal}
              onClose={() => setShowSupplierModal(false)}
              onCreated={(s) => { setSuppliers((prev) => [...prev, s as Supplier]); setSupplierId(s.id); }}
            />
          </div>
          <div className={styles.field}>
            <label>{t('purchases:form.warehouse')}</label>
            <SelectWithAdd
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              options={[{ value: '', label: '-' }, ...warehouses.map((w) => ({ value: w.id, label: w.name }))]}
              onAdd={() => setShowWarehouseModal(true)}
              addTitle={t('common:inlineEntity.addWarehouse')}
            />
            <InlineWarehouseForm
              isOpen={showWarehouseModal}
              onClose={() => setShowWarehouseModal(false)}
              onCreated={(w) => { setWarehouses((prev) => [...prev, w]); setWarehouseId(w.id); }}
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label>{t('purchases:form.purchaseDate')}</label>
            <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} fullWidth />
          </div>
          <div className={styles.field}>
            <label>{t('purchases:form.supplierInvoiceNo')}</label>
            <Input value={supplierInvoiceNo} onChange={(e) => setSupplierInvoiceNo(e.target.value)} placeholder={t('purchases:form.supplierInvoiceNoPlaceholder')} fullWidth />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label>{t('purchases:form.paymentMethod')}</label>
            <Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              options={[
                { value: 'nakit', label: t('purchases:paymentMethods.nakit') },
                { value: 'kredi_karti', label: t('purchases:paymentMethods.kredi_karti') },
                { value: 'havale', label: t('purchases:paymentMethods.havale') },
                { value: 'veresiye', label: t('purchases:paymentMethods.veresiye') },
              ]}
              fullWidth
            />
          </div>
          {paymentMethod === 'veresiye' && (
            <div className={styles.field}>
              <label>{t('purchases:form.dueDate')}</label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} fullWidth />
            </div>
          )}
        </div>

        <div style={{ marginTop: 12 }}>
          <label className={styles.checkboxLabel}>
            <input type="checkbox" checked={includeVat} onChange={(e) => setIncludeVat(e.target.checked)} />
            {' '}{t('purchases:form.vatIncluded')}
          </label>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.itemsHeader}>
          <h3>{t('purchases:form.items')}</h3>
          <Button size="sm" onClick={addItem}>+ {t('purchases:form.addItem')}</Button>
        </div>

        {products.length === 0 && (
          <div className={styles.warningBox}>
            {t('purchases:form.noProductsWarning')}
          </div>
        )}

        {items.length === 0 ? (
          <div className={styles.emptyItems}>{t('purchases:form.emptyItems')}</div>
        ) : (
          <div className={styles.itemsList}>
            {items.map((it, idx) => {
              const lineSub = it.quantity * it.unit_price;
              const lineAfterDisc = lineSub * (1 - it.discount_rate / 100);
              const vat = includeVat ? lineAfterDisc * (it.vat_rate / 100) : 0;
              const lineTotal = lineAfterDisc + vat;
              return (
                <div key={idx} className={styles.itemCard}>
                  <div className={styles.itemHeader}>
                    <span className={styles.itemNumber}>#{idx + 1}</span>
                    <strong className={styles.itemTotal}>{formatCurrency(lineTotal)}</strong>
                    <Button size="xs" variant="danger" onClick={() => removeItem(idx)} aria-label={t('common:buttons.delete')}>×</Button>
                  </div>
                  <div className={styles.itemBody}>
                    <div className={styles.itemFieldFull}>
                      <label>{t('purchases:form.product')}</label>
                      <Select
                        value={it.product_id}
                        onChange={(e) => handleProductChange(idx, e.target.value)}
                        options={[{ value: '', label: t('purchases:form.selectProduct') }, ...products.map((p) => ({ value: p.id, label: p.name }))]}
                        fullWidth
                      />
                    </div>
                    <div className={styles.itemFieldGrid}>
                      <div className={styles.itemField}>
                        <label>{t('purchases:form.quantity')}</label>
                        <Input type="number" step="any" min="0" value={it.quantity} onChange={(e) => updateItem(idx, { quantity: parseFloat(e.target.value) || 0 })} fullWidth />
                      </div>
                      <div className={styles.itemField}>
                        <label>{t('purchases:form.unitPrice')}</label>
                        <Input type="number" step="0.01" min="0" value={it.unit_price} onChange={(e) => updateItem(idx, { unit_price: parseFloat(e.target.value) || 0 })} fullWidth />
                      </div>
                      <div className={styles.itemField}>
                        <label>{t('purchases:form.vatRate')} (%)</label>
                        <Input type="number" step="any" min="0" max="100" value={it.vat_rate} onChange={(e) => updateItem(idx, { vat_rate: parseFloat(e.target.value) || 0 })} fullWidth />
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
        <h3>{t('purchases:form.notes')}</h3>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('purchases:form.notesPlaceholder')} fullWidth />
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryRow}>
          <span>{t('purchases:form.subtotal')}</span>
          <strong>{formatCurrency(totals.subtotal)}</strong>
        </div>
        <div className={styles.summaryRow}>
          <span>{t('purchases:form.vatTotal')}</span>
          <strong>{formatCurrency(totals.vatTotal)}</strong>
        </div>
        <div className={`${styles.summaryRow} ${styles.grandTotal}`}>
          <span>{t('purchases:form.grandTotal')}</span>
          <strong>{formatCurrency(totals.grandTotal)}</strong>
        </div>
      </div>

      <div className={styles.actions}>
        <Button variant="ghost" onClick={() => navigate('/purchases')} disabled={saving}>{t('common:buttons.cancel')}</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={saving || items.length === 0}>
          {saving ? t('common:labels.saving') : t('purchases:form.save')}
        </Button>
      </div>
    </div>
  );
}
