import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SaleDetail } from '../../api/sales.api';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import styles from './ReceiptPrintView.module.css';

interface ReceiptPrintViewProps {
  data: SaleDetail;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
  };
}

export const ReceiptPrintView = forwardRef<HTMLDivElement, ReceiptPrintViewProps>(
  ({ data, companyInfo }, ref) => {
    const { t } = useTranslation(['sales', 'common']);

    const company = companyInfo || {
      name: 'Stok Sayac',
      address: 'Kadikoy, Istanbul',
      phone: '0216 123 45 67',
    };

    const repeatChar = (char: string, count: number) => char.repeat(count);

    return (
      <div ref={ref} className={styles.receipt}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.companyName}>{company.name}</h1>
          <p>{company.address}</p>
          <p>{t('sales:invoice.phone')}: {company.phone}</p>
        </div>

        <div className={styles.divider}>{repeatChar('=', 32)}</div>

        {/* Invoice Info */}
        <div className={styles.section}>
          <p><strong>{t('sales:receipt.receiptNo')}</strong> {data.invoice_number}</p>
          <p><strong>{t('sales:receipt.date')}</strong> {formatDateTime(data.sale_date)}</p>
          {data.customer_name && (
            <p><strong>{t('sales:receipt.customer')}</strong> {data.customer_name}</p>
          )}
        </div>

        <div className={styles.divider}>{repeatChar('-', 32)}</div>

        {/* Items */}
        <div className={styles.items}>
          {data.items.map((item) => (
            <div key={item.id} className={styles.item}>
              <div className={styles.itemName}>{item.product_name}</div>
              <div className={styles.itemDetails}>
                <span>{item.quantity} x {formatCurrency(item.unit_price)}</span>
                <span>{formatCurrency(item.line_total)}</span>
              </div>
              {item.discount_rate > 0 && (
                <div className={styles.itemDiscount}>
                  {t('sales:receipt.discount')}: %{item.discount_rate}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={styles.divider}>{repeatChar('-', 32)}</div>

        {/* Totals */}
        <div className={styles.totals}>
          <div className={styles.totalRow}>
            <span>{t('sales:receipt.subtotal')}</span>
            <span>{formatCurrency(data.subtotal)}</span>
          </div>
          {data.discount_amount > 0 && (
            <div className={styles.totalRow}>
              <span>{t('sales:receipt.discount')}:</span>
              <span>-{formatCurrency(data.discount_amount)}</span>
            </div>
          )}
          {data.include_vat && data.vat_total > 0 && (
            <div className={styles.totalRow}>
              <span>{t('sales:receipt.vatLabel')}</span>
              <span>{formatCurrency(data.vat_total)}</span>
            </div>
          )}
        </div>

        <div className={styles.divider}>{repeatChar('=', 32)}</div>

        {/* Grand Total */}
        <div className={styles.grandTotal}>
          <span>{t('sales:receipt.grandTotal')}</span>
          <span>{formatCurrency(data.grand_total)}</span>
        </div>

        <div className={styles.divider}>{repeatChar('=', 32)}</div>

        {/* Payment */}
        <div className={styles.section}>
          <p>
            <strong>{t('sales:receipt.payment')}</strong>{' '}
            {t(`common:paymentMethods.${data.payment_method}`, { defaultValue: data.payment_method })}
          </p>
          {data.due_date && (
            <p><strong>{t('sales:receipt.dueDate')}</strong> {formatDate(data.due_date)}</p>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.divider}>{repeatChar('-', 32)}</div>
          <p>{t('sales:receipt.thankYou')}</p>
          <p>{t('sales:receipt.thanks')}</p>
          <div className={styles.divider}>{repeatChar('-', 32)}</div>
          {!data.include_vat && (
            <p className={styles.noVatNote}>{t('sales:receipt.noVatNote')}</p>
          )}
        </div>
      </div>
    );
  }
);

ReceiptPrintView.displayName = 'ReceiptPrintView';
