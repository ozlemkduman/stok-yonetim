import { Button, Card } from '@stok/ui';
import { Customer } from '../../../api/customers.api';
import { Warehouse } from '../../../api/warehouses.api';
import { WizardFormData } from '../wizard.types';
import { formatCurrency } from '../../../utils/formatters';
import { PAYMENT_METHODS, SALE_TYPES } from '../../../utils/constants';
import styles from '../SaleFormPage.module.css';

interface StepSummaryProps {
  data: WizardFormData;
  customers: Customer[];
  warehouses: Warehouse[];
  totals: { subtotal: number; vatTotal: number; discount: number; grandTotal: number };
  onGoToStep: (step: number) => void;
}

export function StepSummary({ data, customers, warehouses, totals, onGoToStep }: StepSummaryProps) {
  const customer = customers.find(c => c.id === data.customerId);
  const warehouse = warehouses.find(w => w.id === data.warehouseId);

  return (
    <div className={styles.stepContent}>
      <Card className={styles.summaryCard}>
        <div className={styles.summaryHeader}>
          <h3>Satis Bilgileri</h3>
          <Button type="button" size="sm" variant="ghost" onClick={() => onGoToStep(3)}>Duzenle</Button>
        </div>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Satis Tipi</span>
            <span>{SALE_TYPES[data.saleType as keyof typeof SALE_TYPES] || data.saleType}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Musteri</span>
            <span>{customer ? customer.name : 'Perakende Satis'}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Depo</span>
            <span>{warehouse ? warehouse.name : '-'}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Odeme Yontemi</span>
            <span>{PAYMENT_METHODS[data.paymentMethod as keyof typeof PAYMENT_METHODS] || data.paymentMethod}</span>
          </div>
          {data.paymentMethod === 'veresiye' && data.dueDate && (
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Vade Tarihi</span>
              <span>{data.dueDate}</span>
            </div>
          )}
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>KDV</span>
            <span>{data.includeVat ? 'Dahil' : 'Haric'}</span>
          </div>
          {data.notes && (
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Notlar</span>
              <span>{data.notes}</span>
            </div>
          )}
        </div>
      </Card>

      <Card className={styles.summaryCard}>
        <div className={styles.summaryHeader}>
          <h3>Urunler ({data.items.length})</h3>
          <Button type="button" size="sm" variant="ghost" onClick={() => onGoToStep(1)}>Duzenle</Button>
        </div>
        <div className={styles.itemsTableContainer}>
          <table className={styles.itemsTable}>
            <thead>
              <tr>
                <th>Urun</th>
                <th className={styles.alignRight}>Miktar</th>
                <th className={styles.alignRight}>Birim Fiyat</th>
                <th className={styles.alignRight}>Iskonto</th>
                <th className={styles.alignRight}>Toplam</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr key={index}>
                  <td>{item.product_name}</td>
                  <td className={styles.alignRight}>{item.quantity}</td>
                  <td className={styles.alignRight}>{formatCurrency(item.unit_price)}</td>
                  <td className={styles.alignRight}>{item.discount_rate > 0 ? `%${item.discount_rate}` : '-'}</td>
                  <td className={styles.alignRight}>{formatCurrency(item.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
    </div>
  );
}
