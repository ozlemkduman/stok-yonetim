import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Input } from '@stok/ui';
import { Product, CreateProductData, productsApi } from '../../../api/products.api';
import { useToast } from '../../../context/ToastContext';
import styles from '../SaleFormPage.module.css';

interface InlineProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (product: Product) => void;
}

export function InlineProductForm({ isOpen, onClose, onCreated }: InlineProductFormProps) {
  const { t } = useTranslation(['sales', 'common']);
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [purchaseVatIncluded, setPurchaseVatIncluded] = useState(false);
  const [saleVatIncluded, setSaleVatIncluded] = useState(false);
  const [formData, setFormData] = useState<CreateProductData>({
    name: '',
    barcode: '',
    category: '',
    unit: 'adet',
    purchase_price: 0,
    sale_price: 0,
    wholesale_price: 0,
    vat_rate: 20,
    stock_quantity: 0,
    min_stock_level: 5,
  });
  const [displayPurchasePrice, setDisplayPurchasePrice] = useState('0');
  const [displaySalePrice, setDisplaySalePrice] = useState('0');
  const [displayWholesalePrice, setDisplayWholesalePrice] = useState('0');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const vatRate = formData.vat_rate ?? 20;
  const vatMultiplier = 1 + vatRate / 100;

  const resetForm = () => {
    setFormData({ name: '', barcode: '', category: '', unit: 'adet', purchase_price: 0, sale_price: 0, wholesale_price: 0, vat_rate: 20, stock_quantity: 0, min_stock_level: 5 });
    setDisplayPurchasePrice('0');
    setDisplaySalePrice('0');
    setDisplayWholesalePrice('0');
    setPurchaseVatIncluded(false);
    setSaleVatIncluded(false);
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const isVatIncludedForField = (field: 'purchase_price' | 'sale_price' | 'wholesale_price') => {
    return field === 'purchase_price' ? purchaseVatIncluded : saleVatIncluded;
  };

  const handlePriceChange = (field: 'purchase_price' | 'sale_price' | 'wholesale_price', rawValue: string) => {
    const setDisplay = field === 'purchase_price' ? setDisplayPurchasePrice : field === 'sale_price' ? setDisplaySalePrice : setDisplayWholesalePrice;
    setDisplay(rawValue);
    const parsed = parseFloat(rawValue);
    if (isNaN(parsed)) {
      setFormData(prev => ({ ...prev, [field]: 0 }));
      return;
    }
    const vatInc = isVatIncludedForField(field);
    const basePrice = vatInc ? parsed / vatMultiplier : parsed;
    setFormData(prev => ({ ...prev, [field]: basePrice }));
  };

  const handlePurchaseVatToggle = (included: boolean) => {
    setPurchaseVatIncluded(included);
    if (included) {
      setDisplayPurchasePrice(String(formData.purchase_price * vatMultiplier));
    } else {
      setDisplayPurchasePrice(String(formData.purchase_price));
    }
  };

  const handleSaleVatToggle = (included: boolean) => {
    setSaleVatIncluded(included);
    if (included) {
      setDisplaySalePrice(String(formData.sale_price * vatMultiplier));
      setDisplayWholesalePrice(String((formData.wholesale_price || 0) * vatMultiplier));
    } else {
      setDisplaySalePrice(String(formData.sale_price));
      setDisplayWholesalePrice(String(formData.wholesale_price || 0));
    }
  };

  const getPriceInfo = (field: 'purchase_price' | 'sale_price' | 'wholesale_price') => {
    const basePrice = formData[field] || 0;
    const vatInc = isVatIncludedForField(field);
    if (vatInc) {
      return t('sales:inlineProduct.vatIncludedInfo', { price: basePrice.toFixed(2) });
    } else {
      return t('sales:inlineProduct.vatExcludedInfo', { price: (basePrice * vatMultiplier).toFixed(2) });
    }
  };

  const getVatStatusLabel = (field: 'purchase_price' | 'sale_price' | 'wholesale_price') => {
    const vatInc = isVatIncludedForField(field);
    return vatInc ? t('sales:inlineProduct.vatIncluded') : t('sales:inlineProduct.vatExcluded');
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = t('sales:inlineProduct.errors.nameRequired');
    if (formData.purchase_price <= 0) newErrors.purchase_price = t('sales:inlineProduct.errors.purchasePriceRequired');
    if (formData.sale_price <= 0) newErrors.sale_price = t('sales:inlineProduct.errors.salePriceRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await productsApi.create(formData);
      const product = response.data ?? response as unknown as Product;
      showToast('success', t('sales:toast.productCreated'));
      onCreated(product);
      handleClose();
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : t('sales:toast.errorOccurred') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('sales:inlineProduct.title')}
      size="lg"
      footer={
        <div className={styles.modalFooter}>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>{t('sales:inlineProduct.cancel')}</Button>
          <Button onClick={handleSubmit} loading={loading}>{t('sales:inlineProduct.save')}</Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className={styles.inlineForm}>
        {errors.form && <div className={styles.formError}>{errors.form}</div>}
        <div className={styles.inlineFormGrid}>
          <Input label={t('sales:inlineProduct.productName')} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} error={errors.name} fullWidth />
          <Input label={t('sales:inlineProduct.barcode')} value={formData.barcode || ''} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} fullWidth />
          <Input label={t('sales:inlineProduct.category')} value={formData.category || ''} onChange={(e) => setFormData({ ...formData, category: e.target.value })} fullWidth />
          <Input label={t('sales:inlineProduct.unit')} value={formData.unit || 'adet'} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} fullWidth />
        </div>

        <Input label={t('sales:inlineProduct.vatRate')} type="number" step="any" value={formData.vat_rate ?? 20} onChange={(e) => setFormData({ ...formData, vat_rate: parseFloat(e.target.value) || 0 })} fullWidth />

        <div className={styles.priceSection}>
          <div className={styles.priceSectionHeader}>
            <span className={styles.priceSectionTitle}>{t('sales:inlineProduct.purchasePrice')}</span>
            <div className={styles.vatToggle}>
              <button type="button" className={`${styles.vatToggleBtn} ${!purchaseVatIncluded ? styles.vatToggleActive : ''}`} onClick={() => handlePurchaseVatToggle(false)}>{t('sales:inlineProduct.vatExcluded')}</button>
              <button type="button" className={`${styles.vatToggleBtn} ${purchaseVatIncluded ? styles.vatToggleActive : ''}`} onClick={() => handlePurchaseVatToggle(true)}>{t('sales:inlineProduct.vatIncluded')}</button>
            </div>
          </div>
          <div className={styles.priceField}>
            <Input
              label={t('sales:inlineProduct.purchasePriceLabel', { vatStatus: getVatStatusLabel('purchase_price') })}
              type="number"
              step="any"
              value={displayPurchasePrice}
              onChange={(e) => handlePriceChange('purchase_price', e.target.value)}
              error={errors.purchase_price}
              fullWidth
            />
            <span className={styles.priceHint}>{getPriceInfo('purchase_price')}</span>
          </div>
        </div>

        <div className={styles.priceSection}>
          <div className={styles.priceSectionHeader}>
            <span className={styles.priceSectionTitle}>{t('sales:inlineProduct.salePrices')}</span>
            <div className={styles.vatToggle}>
              <button type="button" className={`${styles.vatToggleBtn} ${!saleVatIncluded ? styles.vatToggleActive : ''}`} onClick={() => handleSaleVatToggle(false)}>{t('sales:inlineProduct.vatExcluded')}</button>
              <button type="button" className={`${styles.vatToggleBtn} ${saleVatIncluded ? styles.vatToggleActive : ''}`} onClick={() => handleSaleVatToggle(true)}>{t('sales:inlineProduct.vatIncluded')}</button>
            </div>
          </div>
          <div className={styles.inlineFormGrid}>
            <div className={styles.priceField}>
              <Input
                label={t('sales:inlineProduct.salePriceLabel', { vatStatus: getVatStatusLabel('sale_price') })}
                type="number"
                step="any"
                value={displaySalePrice}
                onChange={(e) => handlePriceChange('sale_price', e.target.value)}
                error={errors.sale_price}
                fullWidth
              />
              <span className={styles.priceHint}>{getPriceInfo('sale_price')}</span>
            </div>
            <div className={styles.priceField}>
              <Input
                label={t('sales:inlineProduct.wholesalePriceLabel', { vatStatus: getVatStatusLabel('wholesale_price') })}
                type="number"
                step="any"
                value={displayWholesalePrice}
                onChange={(e) => handlePriceChange('wholesale_price', e.target.value)}
                fullWidth
              />
              <span className={styles.priceHint}>{getPriceInfo('wholesale_price')}</span>
            </div>
          </div>
        </div>

        <div className={styles.inlineFormGrid}>
          <Input label={t('sales:inlineProduct.stockQuantity')} type="number" step="any" value={formData.stock_quantity || 0} onChange={(e) => setFormData({ ...formData, stock_quantity: parseFloat(e.target.value) || 0 })} fullWidth />
          <Input label={t('sales:inlineProduct.minStockLevel')} type="number" step="any" value={formData.min_stock_level || 5} onChange={(e) => setFormData({ ...formData, min_stock_level: parseFloat(e.target.value) || 0 })} fullWidth />
        </div>
      </form>
    </Modal>
  );
}
