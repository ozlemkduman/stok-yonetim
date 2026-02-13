import { forwardRef } from 'react';
import { SaleDetail } from '../../api/sales.api';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { PAYMENT_METHODS } from '../../utils/constants';
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
    const company = companyInfo || {
      name: 'Stok Yonetim',
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
          <p>Tel: {company.phone}</p>
        </div>

        <div className={styles.divider}>{repeatChar('=', 32)}</div>

        {/* Invoice Info */}
        <div className={styles.section}>
          <p><strong>Fis No:</strong> {data.invoice_number}</p>
          <p><strong>Tarih:</strong> {formatDateTime(data.sale_date)}</p>
          {data.customer_name && (
            <p><strong>Musteri:</strong> {data.customer_name}</p>
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
                  Iskonto: %{item.discount_rate}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={styles.divider}>{repeatChar('-', 32)}</div>

        {/* Totals */}
        <div className={styles.totals}>
          <div className={styles.totalRow}>
            <span>Ara Toplam:</span>
            <span>{formatCurrency(data.subtotal)}</span>
          </div>
          {data.discount_amount > 0 && (
            <div className={styles.totalRow}>
              <span>Iskonto:</span>
              <span>-{formatCurrency(data.discount_amount)}</span>
            </div>
          )}
          {data.include_vat && data.vat_total > 0 && (
            <div className={styles.totalRow}>
              <span>KDV:</span>
              <span>{formatCurrency(data.vat_total)}</span>
            </div>
          )}
        </div>

        <div className={styles.divider}>{repeatChar('=', 32)}</div>

        {/* Grand Total */}
        <div className={styles.grandTotal}>
          <span>TOPLAM:</span>
          <span>{formatCurrency(data.grand_total)}</span>
        </div>

        <div className={styles.divider}>{repeatChar('=', 32)}</div>

        {/* Payment */}
        <div className={styles.section}>
          <p>
            <strong>Odeme:</strong>{' '}
            {PAYMENT_METHODS[data.payment_method as keyof typeof PAYMENT_METHODS] || data.payment_method}
          </p>
          {data.due_date && (
            <p><strong>Vade:</strong> {formatDate(data.due_date)}</p>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.divider}>{repeatChar('-', 32)}</div>
          <p>Bizi tercih ettiginiz icin</p>
          <p>TESEKKUR EDERIZ</p>
          <div className={styles.divider}>{repeatChar('-', 32)}</div>
          {!data.include_vat && (
            <p className={styles.noVatNote}>* Bu fis KDV icermemektedir</p>
          )}
        </div>
      </div>
    );
  }
);

ReceiptPrintView.displayName = 'ReceiptPrintView';
