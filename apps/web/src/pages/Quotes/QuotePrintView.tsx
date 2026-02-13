import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@stok/ui';
import { Quote, quotesApi } from '../../api/quotes.api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './QuotePrintView.module.css';

export function QuotePrintView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
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
        setError(err instanceof Error ? err.message : 'Teklif yuklenemedi');
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Yukleniyor...</div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>{error || 'Teklif bulunamadi'}</div>
        <Button onClick={() => navigate('/quotes')}>Geri Don</Button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <Button variant="ghost" onClick={() => navigate(`/quotes/${id}`)}>
          ← Geri Don
        </Button>
        <Button onClick={handlePrint}>Yazdir</Button>
      </div>

      <div className={styles.printArea} ref={printRef}>
        <div className={styles.printContent}>
          {/* Header */}
          <div className={styles.printHeader}>
            <div className={styles.companyInfo}>
              <h1 className={styles.companyName}>Sirket Adi</h1>
              <p>Adres Bilgisi</p>
              <p>Tel: (XXX) XXX XX XX</p>
            </div>
            <div className={styles.documentInfo}>
              <h2 className={styles.documentTitle}>TEKLIF</h2>
              <table className={styles.infoTable}>
                <tbody>
                  <tr>
                    <td>Teklif No:</td>
                    <td><strong>{quote.quote_number}</strong></td>
                  </tr>
                  <tr>
                    <td>Tarih:</td>
                    <td>{formatDate(quote.quote_date)}</td>
                  </tr>
                  <tr>
                    <td>Gecerlilik:</td>
                    <td>{formatDate(quote.valid_until)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer Info */}
          {quote.customer_name && (
            <div className={styles.customerSection}>
              <h3>Musteri Bilgileri</h3>
              <p><strong>{quote.customer_name}</strong></p>
            </div>
          )}

          {/* Items Table */}
          <table className={styles.itemsTable}>
            <thead>
              <tr>
                <th>#</th>
                <th>Urun / Hizmet</th>
                <th className={styles.alignRight}>Miktar</th>
                <th className={styles.alignRight}>Birim Fiyat</th>
                <th className={styles.alignRight}>Iskonto</th>
                <th className={styles.alignRight}>KDV</th>
                <th className={styles.alignRight}>Toplam</th>
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
                  <td>Ara Toplam:</td>
                  <td>{formatCurrency(quote.subtotal)}</td>
                </tr>
                {(quote.discount_amount > 0 || quote.discount_rate > 0) && (
                  <tr>
                    <td>Iskonto {quote.discount_rate > 0 && `(%${quote.discount_rate})`}:</td>
                    <td>-{formatCurrency(quote.discount_amount)}</td>
                  </tr>
                )}
                <tr>
                  <td>KDV Toplam:</td>
                  <td>{formatCurrency(quote.vat_total)}</td>
                </tr>
                <tr className={styles.grandTotalRow}>
                  <td><strong>GENEL TOPLAM:</strong></td>
                  <td><strong>{formatCurrency(quote.grand_total)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className={styles.notesSection}>
              <h4>Notlar</h4>
              <p>{quote.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className={styles.printFooter}>
            <p>Bu teklif {formatDate(quote.valid_until)} tarihine kadar gecerlidir.</p>
            <div className={styles.signatureArea}>
              <div className={styles.signatureBox}>
                <p>Hazirlayan</p>
                <div className={styles.signatureLine}></div>
              </div>
              <div className={styles.signatureBox}>
                <p>Onaylayan</p>
                <div className={styles.signatureLine}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
