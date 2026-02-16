import { forwardRef } from 'react';
import { SaleDetail } from '../../api/sales.api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { PAYMENT_METHODS } from '../../utils/constants';
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
            <p>Tel: {company.phone}</p>
            <p>Vergi No: {company.taxNumber} / {company.taxOffice}</p>
          </div>
          <div className={styles.invoiceInfo}>
            <h2 className={styles.invoiceTitle}>
              {data.include_vat ? 'FATURA' : 'SATIS FISI'}
            </h2>
            <table className={styles.invoiceMeta}>
              <tbody>
                <tr>
                  <td>Fatura No:</td>
                  <td><strong>{data.invoice_number}</strong></td>
                </tr>
                <tr>
                  <td>Tarih:</td>
                  <td>{formatDate(data.sale_date)}</td>
                </tr>
                {data.due_date && (
                  <tr>
                    <td>Vade Tarihi:</td>
                    <td>{formatDate(data.due_date)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Info */}
        <div className={styles.customerSection}>
          <h3>Musteri Bilgileri</h3>
          <div className={styles.customerInfo}>
            {data.customer_name ? (
              <>
                <p><strong>{data.customer_name}</strong></p>
                {data.customer_phone && <p>Tel: {data.customer_phone}</p>}
                {data.customer_address && <p>Adres: {data.customer_address}</p>}
                {data.customer_tax_number && (
                  <p>Vergi No: {data.customer_tax_number} / {data.customer_tax_office || '-'}</p>
                )}
              </>
            ) : (
              <p>Perakende Satis</p>
            )}
          </div>
        </div>

        {/* Items Table */}
        <table className={styles.itemsTable}>
          <thead>
            <tr>
              <th>#</th>
              <th>Urun / Hizmet</th>
              <th>Barkod</th>
              <th className={styles.right}>Miktar</th>
              <th className={styles.right}>Birim Fiyat</th>
              {data.items.some(i => i.discount_rate > 0) && (
                <th className={styles.right}>Iskonto</th>
              )}
              {data.include_vat && (
                <>
                  <th className={styles.right}>KDV %</th>
                  <th className={styles.right}>KDV Tutar</th>
                </>
              )}
              <th className={styles.right}>Toplam</th>
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
              <td colSpan={3} className={styles.right}><strong>Toplam Adet:</strong></td>
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
                <td>Ara Toplam:</td>
                <td>{formatCurrency(data.subtotal)}</td>
              </tr>
              {data.discount_amount > 0 && (
                <tr>
                  <td>Iskonto {data.discount_rate > 0 ? `(%${data.discount_rate})` : ''}:</td>
                  <td>-{formatCurrency(data.discount_amount)}</td>
                </tr>
              )}
              {data.include_vat && (
                <tr>
                  <td>KDV Toplam:</td>
                  <td>{formatCurrency(data.vat_total)}</td>
                </tr>
              )}
              <tr className={styles.grandTotal}>
                <td>GENEL TOPLAM:</td>
                <td>{formatCurrency(data.grand_total)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Payment Info */}
        <div className={styles.paymentSection}>
          <p>
            <strong>Odeme Yontemi:</strong>{' '}
            {PAYMENT_METHODS[data.payment_method as keyof typeof PAYMENT_METHODS] || data.payment_method}
          </p>
          {data.notes && <p><strong>Notlar:</strong> {data.notes}</p>}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.signatures}>
            <div className={styles.signature}>
              <div className={styles.signatureLine}></div>
              <p>Teslim Eden</p>
            </div>
            <div className={styles.signature}>
              <div className={styles.signatureLine}></div>
              <p>Teslim Alan</p>
            </div>
          </div>
          <p className={styles.footerNote}>
            Bu belge bilgisayar ortaminda olusturulmustur.
          </p>
        </div>
      </div>
    );
  }
);

InvoicePrintView.displayName = 'InvoicePrintView';
