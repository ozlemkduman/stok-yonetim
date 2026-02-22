import { forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { SaleDetail } from '../../api/sales.api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './InvoicePrintView.module.css';

interface InvoicePrintViewProps {
  data: SaleDetail;
  companyInfo?: {
    name: string;
    address: string;
    phone: string;
    taxNumber: string;
    taxOffice: string;
  };
}

export const InvoicePrintView = forwardRef<HTMLDivElement, InvoicePrintViewProps>(
  ({ data, companyInfo }, ref) => {
    const { t } = useTranslation(['sales', 'common']);

    const company = companyInfo || {
      name: 'Stok Yonetim A.S.',
      address: 'Kadikoy, Istanbul',
      phone: '0216 123 45 67',
      taxNumber: '1234567890',
      taxOffice: 'Kadikoy',
    };

    return (
      <div ref={ref} className={styles.invoice}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.companyInfo}>
            <h1 className={styles.companyName}>{company.name}</h1>
            <p>{company.address}</p>
            <p>{t('sales:invoice.phone')}: {company.phone}</p>
            <p>{t('sales:invoice.taxNumber')}: {company.taxNumber} / {company.taxOffice}</p>
          </div>
          <div className={styles.invoiceInfo}>
            <h2 className={styles.invoiceTitle}>
              {data.include_vat ? t('sales:invoice.title') : t('sales:invoice.receiptTitle')}
            </h2>
            <table className={styles.invoiceMeta}>
              <tbody>
                <tr>
                  <td>{t('sales:invoice.invoiceNo')}</td>
                  <td><strong>{data.invoice_number}</strong></td>
                </tr>
                <tr>
                  <td>{t('sales:invoice.date')}</td>
                  <td>{formatDate(data.sale_date)}</td>
                </tr>
                {data.due_date && (
                  <tr>
                    <td>{t('sales:invoice.dueDate')}</td>
                    <td>{formatDate(data.due_date)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Info */}
        <div className={styles.customerSection}>
          <h3>{t('sales:invoice.customerInfo')}</h3>
          <div className={styles.customerInfo}>
            {data.customer_name ? (
              <>
                <p><strong>{data.customer_name}</strong></p>
                {data.customer_phone && <p>{t('sales:invoice.phone')}: {data.customer_phone}</p>}
                {data.customer_address && <p>{t('sales:invoice.address')}: {data.customer_address}</p>}
                {data.customer_tax_number && (
                  <p>{t('sales:invoice.taxNumber')}: {data.customer_tax_number} / {data.customer_tax_office || '-'}</p>
                )}
              </>
            ) : (
              <p>{t('sales:invoice.retailSale')}</p>
            )}
          </div>
        </div>

        {/* Items Table */}
        <table className={styles.itemsTable}>
          <thead>
            <tr>
              <th>{t('sales:invoice.columns.no')}</th>
              <th>{t('sales:invoice.columns.productService')}</th>
              <th>{t('sales:invoice.columns.barcode')}</th>
              <th className={styles.right}>{t('sales:invoice.columns.quantity')}</th>
              <th className={styles.right}>{t('sales:invoice.columns.unitPrice')}</th>
              {data.items.some(i => i.discount_rate > 0) && (
                <th className={styles.right}>{t('sales:invoice.columns.discount')}</th>
              )}
              {data.include_vat && (
                <>
                  <th className={styles.right}>{t('sales:invoice.columns.vatRate')}</th>
                  <th className={styles.right}>{t('sales:invoice.columns.vatAmount')}</th>
                </>
              )}
              <th className={styles.right}>{t('sales:invoice.columns.total')}</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.product_name}</td>
                <td>{item.barcode || '-'}</td>
                <td className={styles.right}>{item.quantity}</td>
                <td className={styles.right}>{formatCurrency(item.unit_price)}</td>
                {data.items.some(i => i.discount_rate > 0) && (
                  <td className={styles.right}>
                    {item.discount_rate > 0 ? `%${item.discount_rate}` : '-'}
                  </td>
                )}
                {data.include_vat && (
                  <>
                    <td className={styles.right}>%{item.vat_rate}</td>
                    <td className={styles.right}>{formatCurrency(item.vat_amount)}</td>
                  </>
                )}
                <td className={styles.right}>{formatCurrency(item.line_total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className={styles.totalRow}>
              <td colSpan={3} className={styles.right}><strong>{t('sales:invoice.totalQuantity')}</strong></td>
              <td className={styles.right}>
                <strong>{data.items.reduce((sum, item) => sum + item.quantity, 0)}</strong>
              </td>
              <td></td>
              {data.items.some(i => i.discount_rate > 0) && <td></td>}
              {data.include_vat && <><td></td><td></td></>}
              <td></td>
            </tr>
          </tfoot>
        </table>

        {/* Totals */}
        <div className={styles.totalsSection}>
          <table className={styles.totalsTable}>
            <tbody>
              <tr>
                <td>{t('sales:invoice.subtotal')}</td>
                <td>{formatCurrency(data.subtotal)}</td>
              </tr>
              {data.discount_amount > 0 && (
                <tr>
                  <td>{data.discount_rate > 0 ? t('sales:invoice.discountWithRate', { rate: data.discount_rate }) : t('sales:invoice.discountLabel')}:</td>
                  <td>-{formatCurrency(data.discount_amount)}</td>
                </tr>
              )}
              {data.include_vat && (
                <tr>
                  <td>{t('sales:invoice.vatTotal')}</td>
                  <td>{formatCurrency(data.vat_total)}</td>
                </tr>
              )}
              <tr className={styles.grandTotal}>
                <td>{t('sales:invoice.grandTotal')}</td>
                <td>{formatCurrency(data.grand_total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment Info */}
        <div className={styles.paymentSection}>
          <p>
            <strong>{t('sales:invoice.paymentMethod')}</strong>{' '}
            {t(`common:paymentMethods.${data.payment_method}`, { defaultValue: data.payment_method })}
          </p>
          {data.notes && <p><strong>{t('sales:invoice.notes')}</strong> {data.notes}</p>}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.signatures}>
            <div className={styles.signature}>
              <div className={styles.signatureLine}></div>
              <p>{t('sales:invoice.deliveredBy')}</p>
            </div>
            <div className={styles.signature}>
              <div className={styles.signatureLine}></div>
              <p>{t('sales:invoice.receivedBy')}</p>
            </div>
          </div>
          <p className={styles.footerNote}>
            {t('sales:invoice.computerGenerated')}
          </p>
        </div>
      </div>
    );
  }
);

InvoicePrintView.displayName = 'InvoicePrintView';
