import { useTranslation } from 'react-i18next';
import { Button, Card } from '@stok/ui';
import { Customer } from '../../../api/customers.api';
import { Warehouse } from '../../../api/warehouses.api';
import { WizardFormData } from '../wizard.types';
import { formatCurrency } from '../../../utils/formatters';
import styles from '../SaleFormPage.module.css';

interface StepSummaryProps {
  data: WizardFormData;
  customers: Customer[];
  warehouses: Warehouse[];
  totals: { subtotal: number; vatTotal: number; discount: number; grandTotal: number };
  onGoToStep: (step: number) => void;
}

export function StepSummary({ data, customers, warehouses, totals, onGoToStep }: StepSummaryProps) {
  const { t } = useTranslation(['sales', 'common']);
  const customer = customers.find(c => c.id === data.customerId);
  const warehouse = warehouses.find(w => w.id === data.warehouseId);

  return (
    <div className={styles.stepContent}>
      <Card className={styles.summaryCard}>
        <div className={styles.summaryHeader}>
          <h3>{t('sales:stepSummary.saleInfo')}</h3>
          <Button type="button" size="sm" variant="ghost" onClick={() => onGoToStep(3)}>{t('sales:stepSummary.edit')}</Button>
        </div>
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>{t('sales:stepSummary.saleType')}</span>
            <span>{t(`common:saleTypes.${data.saleType === 'wholesale' ? 'wholesale' : 'retail'}`)}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>{t('sales:stepSummary.customer')}</span>
            <span>{customer ? customer.name : t('sales:stepSummary.retailSale')}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>{t('sales:stepSummary.warehouse')}</span>
            <span>{warehouse ? warehouse.name : '-'}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>{t('sales:stepSummary.paymentMethod')}</span>
            <span>{t(`common:paymentMethods.${data.paymentMethod}`, { defaultValue: data.paymentMethod })}</span>
          </div>
          {data.paymentMethod === 'veresiye' && data.dueDate && (
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>{t('sales:stepSummary.dueDate')}</span>
              <span>{data.dueDate}</span>
            </div>
          )}
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>{t('sales:stepSummary.vat')}</span>
            <span>{data.includeVat ? t('sales:stepSummary.vatIncluded') : t('sales:stepSummary.vatExcluded')}</span>
          </div>
          {data.notes && (
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>{t('sales:stepSummary.notes')}</span>
              <span>{data.notes}</span>
            </div>
          )}
        </div>
      </Card>

      <Card className={styles.summaryCard}>
        <div className={styles.summaryHeader}>
          <h3>{t('sales:stepSummary.productsCount', { count: data.items.length })}</h3>
          <Button type="button" size="sm" variant="ghost" onClick={() => onGoToStep(1)}>{t('sales:stepSummary.edit')}</Button>
        </div>
        <div className={styles.itemsTableContainer}>
          <table className={styles.itemsTable}>
            <thead>
              <tr>
                <th>{t('sales:stepSummary.columns.product')}</th>
                <th className={styles.alignRight}>{t('sales:stepSummary.columns.quantity')}</th>
                <th className={styles.alignRight}>{t('sales:stepSummary.columns.unitPrice')}</th>
                <th className={styles.alignRight}>{t('sales:stepSummary.columns.discount')}</th>
                <th className={styles.alignRight}>{t('sales:stepSummary.columns.total')}</th>
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
              <span>{t('sales:stepSummary.subtotal')}</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            {totals.discount > 0 && (
              <div className={styles.totalRow}>
                <span>{t('sales:stepSummary.discountLabel')}</span>
                <span>-{formatCurrency(totals.discount)}</span>
              </div>
            )}
            <div className={styles.totalRow}>
              <span>{t('sales:stepSummary.vatTotal')}</span>
              <span>{formatCurrency(totals.vatTotal)}</span>
            </div>
            <div className={`${styles.totalRow} ${styles.grandTotal}`}>
              <span>{t('sales:stepSummary.grandTotal')}</span>
              <span>{formatCurrency(totals.grandTotal)}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
