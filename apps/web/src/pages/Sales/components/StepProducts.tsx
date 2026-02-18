import { Button, Input, Select } from '@stok/ui';
import { Product } from '../../../api/products.api';
import { SaleFormItem } from '../wizard.types';
import { formatCurrency } from '../../../utils/formatters';
import styles from '../SaleFormPage.module.css';

interface StepProductsProps {
  saleType: 'retail' | 'wholesale';
  items: SaleFormItem[];
  products: Product[];
  onSaleTypeChange: (type: 'retail' | 'wholesale') => void;
  onItemsChange: (items: SaleFormItem[]) => void;
  onOpenProductModal: () => void;
}

export function StepProducts({
  saleType,
  items,
  products,
  onSaleTypeChange,
  onItemsChange,
  onOpenProductModal,
}: StepProductsProps) {

  const addItem = () => {
    onItemsChange([...items, {
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
    onItemsChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof SaleFormItem, value: string | number) => {
    const newItems = [...items];
    const item = { ...newItems[index] };

    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        item.product_id = product.id;
        item.product_name = product.name;
        item.unit_price = saleType === 'wholesale' ? (product.wholesale_price || product.sale_price) : product.sale_price;
        item.vat_rate = product.vat_rate;
        item.stock_quantity = product.stock_quantity;
        item.unit = product.unit;
      }
    } else {
      (item as Record<string, unknown>)[field] = value;
    }

    const subtotal = item.quantity * item.unit_price;
    const discountedSubtotal = subtotal * (1 - (item.discount_rate || 0) / 100);
    item.vat_amount = discountedSubtotal * ((item.vat_rate || 0) / 100);
    item.line_total = discountedSubtotal + item.vat_amount;

    newItems[index] = item;
    onItemsChange(newItems);
  };

  const handleSaleTypeChange = (newType: 'retail' | 'wholesale') => {
    onSaleTypeChange(newType);
    // Update existing items' unit prices based on new sale type
    const updatedItems = items.map(item => {
      if (!item.product_id) return item;
      const product = products.find(p => p.id === item.product_id);
      if (!product) return item;
      const newPrice = newType === 'wholesale' ? (product.wholesale_price || product.sale_price) : product.sale_price;
      const subtotal = item.quantity * newPrice;
      const discountedSubtotal = subtotal * (1 - (item.discount_rate || 0) / 100);
      const vatAmount = discountedSubtotal * ((item.vat_rate || 0) / 100);
      return { ...item, unit_price: newPrice, vat_amount: vatAmount, line_total: discountedSubtotal + vatAmount };
    });
    onItemsChange(updatedItems);
  };

  const subtotal = items.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unit_price;
    return sum + itemSubtotal * (1 - (item.discount_rate || 0) / 100);
  }, 0);

  return (
    <div className={styles.stepContent}>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Satis Tipi</label>
          <Select
            value={saleType}
            onChange={(e) => handleSaleTypeChange(e.target.value as 'retail' | 'wholesale')}
            options={[
              { value: 'retail', label: 'Perakende' },
              { value: 'wholesale', label: 'Toptan' },
            ]}
          />
        </div>
        <div className={styles.formGroup} />
      </div>

      <div className={styles.itemsHeader}>
        <h3>Urunler</h3>
        <div className={styles.itemsActions}>
          <Button type="button" size="sm" variant="secondary" onClick={onOpenProductModal}>
            + Yeni Urun
          </Button>
          <Button type="button" size="sm" onClick={addItem}>
            + Urun Ekle
          </Button>
        </div>
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
                        ...products.map(p => ({
                          value: p.id,
                          label: `${p.name} (${formatCurrency(saleType === 'wholesale' ? (p.wholesale_price || p.sale_price) : p.sale_price)})`,
                        })),
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
                    <Button type="button" size="sm" variant="ghost" onClick={() => removeItem(index)} className={styles.deleteButton}>
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
            <span>{formatCurrency(subtotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
