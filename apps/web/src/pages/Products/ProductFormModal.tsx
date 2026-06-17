import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Input, Button, Select } from '@stok/ui';
import { Product, CreateProductData } from '../../api/products.api';
import { PRODUCT_CATEGORIES } from '../../utils/constants';
import styles from './ProductFormModal.module.css';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductData) => Promise<void>;
  product: Product | null;
}

const roundMoney = (v: number) => Math.round(v * 100) / 100;

/**
 * Ürün oluştur/düzenle modal'ı. KDV dahil/hariç fiyat girişi mantığını kapsüller.
 * ProductListPage'ten ayrıştırıldı; Oto Servis "Ürünler" sekmesi de aynı modal'ı kullanır.
 */
export function ProductFormModal({ isOpen, onClose, onSubmit, product }: ProductFormModalProps) {
  const { t } = useTranslation(['products', 'common']);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateProductData>({ name: '', purchase_price: 0, sale_price: 0 });
  const [purchaseVatIncluded, setPurchaseVatIncluded] = useState(false);
  const [saleVatIncluded, setSaleVatIncluded] = useState(false);
  const [displayPurchasePrice, setDisplayPurchasePrice] = useState('0');
  const [displaySalePrice, setDisplaySalePrice] = useState('0');
  const [displayWholesalePrice, setDisplayWholesalePrice] = useState('0');

  useEffect(() => {
    if (!isOpen) return;
    if (product) {
      const pp = Number(product.purchase_price) || 0;
      const sp = Number(product.sale_price) || 0;
      const wp = Number(product.wholesale_price) || 0;
      const vr = Number(product.vat_rate) || 20;
      const mult = 1 + vr / 100;
      setFormData({
        name: product.name,
        barcode: product.barcode || '',
        category: product.category || '',
        type: product.type || 'product',
        unit: product.unit,
        purchase_price: pp,
        sale_price: sp,
        wholesale_price: wp,
        vat_rate: vr,
        stock_quantity: Number(product.stock_quantity) || 0,
        min_stock_level: Number(product.min_stock_level) || 5,
        subscription_duration: product.subscription_duration,
      });
      setPurchaseVatIncluded(true);
      setSaleVatIncluded(true);
      setDisplayPurchasePrice(roundMoney(pp * mult).toString());
      setDisplaySalePrice(roundMoney(sp * mult).toString());
      setDisplayWholesalePrice(roundMoney(wp * mult).toString());
    } else {
      setPurchaseVatIncluded(false);
      setSaleVatIncluded(false);
      setFormData({ name: '', purchase_price: 0, sale_price: 0, wholesale_price: 0 });
      setDisplayPurchasePrice('0');
      setDisplaySalePrice('0');
      setDisplayWholesalePrice('0');
    }
  }, [product, isOpen]);

  const vatRate = formData.vat_rate ?? 20;
  const vatMultiplier = 1 + vatRate / 100;

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
    const basePrice = roundMoney(vatInc ? parsed / vatMultiplier : parsed);
    setFormData(prev => ({ ...prev, [field]: basePrice }));
  };

  const handleVatRateChange = (newRate: number) => {
    const newMultiplier = 1 + newRate / 100;
    setFormData(prev => {
      const updates: Partial<CreateProductData> = { vat_rate: newRate };
      if (purchaseVatIncluded) {
        const purchaseVal = parseFloat(displayPurchasePrice) || 0;
        updates.purchase_price = roundMoney(purchaseVal / newMultiplier);
      }
      if (saleVatIncluded) {
        const saleVal = parseFloat(displaySalePrice) || 0;
        const wholesaleVal = parseFloat(displayWholesalePrice) || 0;
        updates.sale_price = roundMoney(saleVal / newMultiplier);
        updates.wholesale_price = roundMoney(wholesaleVal / newMultiplier);
      }
      return { ...prev, ...updates };
    });
  };

  const handleSaleVatToggle = (included: boolean) => {
    setSaleVatIncluded(included);
    if (included) {
      setDisplaySalePrice(roundMoney(formData.sale_price * vatMultiplier).toString());
      setDisplayWholesalePrice(roundMoney((formData.wholesale_price || 0) * vatMultiplier).toString());
    } else {
      setDisplaySalePrice(roundMoney(formData.sale_price).toString());
      setDisplayWholesalePrice(roundMoney(formData.wholesale_price || 0).toString());
    }
  };

  const getPriceInfo = (field: 'purchase_price' | 'sale_price' | 'wholesale_price') => {
    const basePrice = Number(formData[field]) || 0;
    const vatInc = isVatIncludedForField(field);
    if (vatInc) {
      return t('products:priceInfo.vatExcluded', { price: basePrice.toFixed(2) });
    } else {
      return t('products:priceInfo.vatIncluded', { price: (basePrice * vatMultiplier).toFixed(2) });
    }
  };

  const vatStatusLabel = (included: boolean) => included ? t('products:form.vatIncluded') : t('products:form.vatExcluded');

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? t('products:modal.editTitle') : t('products:modal.createTitle')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>{t('products:modal.cancel')}</Button>
          <Button onClick={handleSubmit} loading={loading}>{product ? t('products:modal.update') : t('products:modal.save')}</Button>
        </>
      }
    >
      <div className={styles.form}>
        <Input label={t('products:form.productName')} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} fullWidth />
        <Input label={t('products:form.barcode')} value={formData.barcode || ''} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} fullWidth />
        <Select
          label={t('products:form.type')}
          options={[
            { value: 'product', label: t('products:form.typeProduct') },
            { value: 'service', label: t('products:form.typeService') },
          ]}
          value={formData.type || 'product'}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as 'product' | 'service' })}
        />
        <Select
          label={t('products:form.category')}
          options={[
            { value: '', label: t('products:form.selectCategory') },
            ...Object.entries(PRODUCT_CATEGORIES).map(([value, label]) => ({ value, label })),
          ]}
          value={formData.category || ''}
          onChange={(e) => setFormData({
            ...formData,
            category: e.target.value || undefined,
            subscription_duration: e.target.value === 'yazilim' ? formData.subscription_duration : undefined,
          })}
        />
        {formData.category === 'yazilim' && (
          <Select
            label={t('products:form.subscriptionDuration')}
            options={[
              { value: '', label: t('products:form.noSubscription') },
              { value: '1_yillik', label: t('products:form.duration1Year') },
              { value: '2_yillik', label: t('products:form.duration2Year') },
              { value: '3_yillik', label: t('products:form.duration3Year') },
            ]}
            value={formData.subscription_duration || ''}
            onChange={(e) => setFormData({ ...formData, subscription_duration: e.target.value })}
          />
        )}
        <Input label={t('products:form.unit')} value={formData.unit || 'adet'} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} fullWidth />
        <div className={styles.vatRateRow}>
          <Input label={t('products:form.vatRate')} type="number" step="any" value={formData.vat_rate ?? 20} onChange={(e) => handleVatRateChange(parseFloat(e.target.value) || 0)} fullWidth />
        </div>

        <div className={styles.priceSection}>
          <div className={styles.priceSectionHeader}>
            <span className={styles.priceSectionTitle}>{t('products:form.salePriceSection')}</span>
            <div className={styles.vatToggle}>
              <button type="button" className={`${styles.vatToggleBtn} ${!saleVatIncluded ? styles.vatToggleActive : ''}`} onClick={() => handleSaleVatToggle(false)}>{t('products:form.vatExcluded')}</button>
              <button type="button" className={`${styles.vatToggleBtn} ${saleVatIncluded ? styles.vatToggleActive : ''}`} onClick={() => handleSaleVatToggle(true)}>{t('products:form.vatIncluded')}</button>
            </div>
          </div>
          <div className={styles.priceField}>
            <Input
              label={t('products:form.salePriceLabel', { vatStatus: vatStatusLabel(saleVatIncluded) })}
              type="number"
              step="any"
              value={displaySalePrice}
              onChange={(e) => handlePriceChange('sale_price', e.target.value)}
              fullWidth
            />
            <span className={styles.priceHint}>{getPriceInfo('sale_price')}</span>
          </div>
          <div className={styles.priceField}>
            <Input
              label={t('products:form.wholesalePriceLabel', { vatStatus: vatStatusLabel(saleVatIncluded) })}
              type="number"
              step="any"
              value={displayWholesalePrice}
              onChange={(e) => handlePriceChange('wholesale_price', e.target.value)}
              fullWidth
            />
            <span className={styles.priceHint}>{getPriceInfo('wholesale_price')}</span>
          </div>
        </div>

        {formData.type !== 'service' && (
          <>
            <Input label={t('products:form.minStockLevel')} type="number" step="any" value={formData.min_stock_level ?? ''} onChange={(e) => setFormData({ ...formData, min_stock_level: e.target.value === '' ? undefined : parseFloat(e.target.value) })} fullWidth />
            <p className={styles.priceHint}>{t('products:form.stockSourceHint')}</p>
          </>
        )}
        {formData.type === 'service' && (
          <p className={styles.priceHint}>{t('products:form.serviceStockHint')}</p>
        )}
      </div>
    </Modal>
  );
}
