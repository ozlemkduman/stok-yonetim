import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@stok/ui';
import { Quote, quotesApi } from '../../api/quotes.api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useTenant } from '../../context/TenantContext';
import styles from './QuotePrintView.module.css';

export function QuotePrintView() {
  const { t } = useTranslation(['quotes', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const { settings: tenantSettings } = useTenant();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchQuote = async () => {
      try {
        setLoading(true);
        const response = await quotesApi.getById(id);
        setQuote(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('quotes:print.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [id, t]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>{t('quotes:print.loading')}</div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>{error || t('quotes:print.notFound')}</div>
        <Button onClick={() => navigate('/quotes')}>{t('quotes:print.goBackButton')}</Button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <Button variant="ghost" onClick={() => navigate(`/quotes/${id}`)}>
          {t('quotes:print.goBack')}
        </Button>
        <Button onClick={handlePrint}>{t('quotes:print.print')}</Button>
      </div>

      <div className={styles.printArea} ref={printRef}>
        <div className={styles.printContent}>
          {/* Header */}
          <div className={styles.printHeader}>
            <div className={styles.companyInfo}>
              <h1 className={styles.companyName}>{tenantSettings?.name || t('quotes:print.companyName')}</h1>
              {tenantSettings?.settings?.address && <p>{tenantSettings.settings.address}</p>}
              {tenantSettings?.settings?.phone && <p>Tel: {tenantSettings.settings.phone}</p>}
              {tenantSettings?.settings?.taxOffice && tenantSettings?.settings?.taxNumber && (
                <p>{tenantSettings.settings.taxOffice} V.D. - {tenantSettings.settings.taxNumber}</p>
              )}
            </div>
            <div className={styles.documentInfo}>
              <h2 className={styles.documentTitle}>{t('quotes:print.documentTitle')}</h2>
              <table className={styles.infoTable}>
                <tbody>
                  <tr>
                    <td>{t('quotes:print.quoteNo')}</td>
                    <td><strong>{quote.quote_number}</strong></td>
                  </tr>
                  <tr>
                    <td>{t('quotes:print.date')}</td>
                    <td>{formatDate(quote.quote_date)}</td>
                  </tr>
                  <tr>
                    <td>{t('quotes:print.validity')}</td>
                    <td>{formatDate(quote.valid_until)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer Info */}
          {quote.customer_name && (
            <div className={styles.customerSection}>
              <h3>{t('quotes:print.customerInfo')}</h3>
              <p><strong>{quote.customer_name}</strong></p>
            </div>
          )}

          {/* Items Table */}
          <table className={styles.itemsTable}>
            <thead>
              <tr>
                <th>#</th>
                <th>{t('quotes:print.productService')}</th>
                <th className={styles.alignRight}>{t('quotes:print.quantity')}</th>
                <th className={styles.alignRight}>{t('quotes:print.unitPrice')}</th>
                <th className={styles.alignRight}>{t('quotes:print.discount')}</th>
                <th className={styles.alignRight}>{t('quotes:print.vat')}</th>
                <th className={styles.alignRight}>{t('quotes:print.total')}</th>
              </tr>
            </thead>
            <tbody>
              {quote.items && quote.items.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>{item.product_name}</td>
                  <td className={styles.alignRight}>{item.quantity}</td>
                  <td className={styles.alignRight}>{formatCurrency(item.unit_price)}</td>
                  <td className={styles.alignRight}>
                    {item.discount_rate > 0 ? `%${item.discount_rate}` : '-'}
                  </td>
                  <td className={styles.alignRight}>%{item.vat_rate}</td>
                  <td className={styles.alignRight}>{formatCurrency(item.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className={styles.totalsSection}>
            <table className={styles.totalsTable}>
              <tbody>
                <tr>
                  <td>{t('quotes:print.subtotal')}</td>
                  <td>{formatCurrency(quote.subtotal)}</td>
                </tr>
                {(quote.discount_amount > 0 || quote.discount_rate > 0) && (
                  <tr>
                    <td>{t('quotes:print.discountLabel')} {quote.discount_rate > 0 && `(%${quote.discount_rate})`}:</td>
                    <td>-{formatCurrency(quote.discount_amount)}</td>
                  </tr>
                )}
                <tr>
                  <td>{t('quotes:print.vatTotal')}</td>
                  <td>{formatCurrency(quote.vat_total)}</td>
                </tr>
                <tr className={styles.grandTotalRow}>
                  <td><strong>{t('quotes:print.grandTotal')}</strong></td>
                  <td><strong>{formatCurrency(quote.grand_total)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className={styles.notesSection}>
              <h4>{t('quotes:print.notes')}</h4>
              <p>{quote.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className={styles.printFooter}>
            <p>{t('quotes:print.validUntilFooter', { date: formatDate(quote.valid_until) })}</p>
            <div className={styles.signatureArea}>
              <div className={styles.signatureBox}>
                <p>{t('quotes:print.preparedBy')}</p>
                <div className={styles.signatureLine}></div>
              </div>
              <div className={styles.signatureBox}>
                <p>{t('quotes:print.approvedBy')}</p>
                <div className={styles.signatureLine}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
