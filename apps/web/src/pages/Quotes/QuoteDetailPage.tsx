import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Badge, Card, Select } from '@stok/ui';
import { Quote, QuoteItem, quotesApi, ConvertToSaleData } from '../../api/quotes.api';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './QuoteDetailPage.module.css';

const STATUS_LABELS: Record<string, string> = {
  draft: 'Taslak',
  sent: 'Gonderildi',
  accepted: 'Kabul Edildi',
  rejected: 'Reddedildi',
  expired: 'Suresi Doldu',
  converted: 'Satisa Donusturuldu',
};

const PAYMENT_METHOD_OPTIONS = [
  { value: 'nakit', label: 'Nakit' },
  { value: 'kredi_karti', label: 'Kredi Karti' },
  { value: 'havale', label: 'Havale/EFT' },
  { value: 'veresiye', label: 'Veresiye' },
];

export function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertPaymentMethod, setConvertPaymentMethod] = useState<ConvertToSaleData['payment_method']>('nakit');

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

  const handleSend = async () => {
    if (!quote) return;
    setActionLoading(true);
    try {
      const response = await quotesApi.send(quote.id);
      setQuote({ ...quote, ...response.data });
      showToast('success', 'Teklif gonderildi');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Islem basarisiz');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!quote) return;
    setActionLoading(true);
    try {
      const response = await quotesApi.accept(quote.id);
      setQuote({ ...quote, ...response.data });
      showToast('success', 'Teklif kabul edildi');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Islem basarisiz');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!quote) return;
    const confirmed = await confirm({ message: 'Teklifi reddetmek istediginizden emin misiniz?', variant: 'warning' });
    if (!confirmed) return;
    setActionLoading(true);
    try {
      const response = await quotesApi.reject(quote.id);
      setQuote({ ...quote, ...response.data });
      showToast('success', 'Teklif reddedildi');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Islem basarisiz');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToSale = async () => {
    if (!quote) return;
    setActionLoading(true);
    try {
      await quotesApi.convertToSale(quote.id, { payment_method: convertPaymentMethod });
      showToast('success', 'Teklif satisa donusturuldu');
      setShowConvertModal(false);
      // Refresh quote data
      const response = await quotesApi.getById(quote.id);
      setQuote(response.data);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Islem basarisiz');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!quote) return;
    const confirmed = await confirm({ message: `"${quote.quote_number}" teklifini silmek istediginizden emin misiniz?`, variant: 'danger' });
    if (!confirmed) return;
    setActionLoading(true);
    try {
      await quotesApi.delete(quote.id);
      showToast('success', 'Teklif silindi');
      navigate('/quotes');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Silme islemi basarisiz');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'converted':
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'expired':
        return 'warning';
      case 'sent':
        return 'info';
      default:
        return 'default';
    }
  };

  const getValidityStatus = () => {
    if (!quote) return null;
    if (['converted', 'rejected', 'expired'].includes(quote.status)) return null;

    const validUntil = new Date(quote.valid_until);
    const today = new Date();
    const diffDays = Math.ceil((validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: 'Suresi doldu', variant: 'danger' as const };
    if (diffDays === 0) return { text: 'Bugun son gun', variant: 'warning' as const };
    if (diffDays <= 3) return { text: `${diffDays} gun kaldi`, variant: 'warning' as const };
    return { text: `${diffDays} gun kaldi`, variant: 'default' as const };
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

  const validityStatus = getValidityStatus();
  const canSend = quote.status === 'draft';
  const canAcceptReject = ['draft', 'sent'].includes(quote.status);
  const canConvert = ['draft', 'sent', 'accepted'].includes(quote.status);
  const canDelete = quote.status !== 'converted';

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Button variant="ghost" onClick={() => navigate('/quotes')}>
            ← Teklifler
          </Button>
          <h1 className={styles.title}>{quote.quote_number}</h1>
          <div className={styles.quoteMeta}>
            <Badge variant={getStatusBadgeVariant(quote.status)}>
              {STATUS_LABELS[quote.status] || quote.status}
            </Badge>
            {quote.customer_name && <span className={styles.customerName}>{quote.customer_name}</span>}
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.totalCard}>
            <span className={styles.totalLabel}>Toplam Tutar</span>
            <span className={styles.totalValue}>{formatCurrency(quote.grand_total)}</span>
            {validityStatus && (
              <span className={styles.validityBadge}>
                <Badge variant={validityStatus.variant}>
                  {validityStatus.text}
                </Badge>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quote Info */}
      <div className={styles.infoGrid}>
        <Card className={styles.infoCard}>
          <h3>Teklif Bilgileri</h3>
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Teklif No</span>
              <span className={styles.infoValue}>{quote.quote_number}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Tarih</span>
              <span className={styles.infoValue}>{formatDate(quote.quote_date)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Gecerlilik Tarihi</span>
              <span className={`${styles.infoValue} ${validityStatus?.variant === 'danger' ? styles.expired : validityStatus?.variant === 'warning' ? styles.warning : ''}`}>
                {formatDate(quote.valid_until)}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Musteri</span>
              <span className={styles.infoValue}>{quote.customer_name || 'Belirtilmemis'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>KDV Dahil</span>
              <span className={styles.infoValue}>{quote.include_vat ? 'Evet' : 'Hayir'}</span>
            </div>
            {quote.notes && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Notlar</span>
                <span className={styles.infoValue}>{quote.notes}</span>
              </div>
            )}
          </div>
        </Card>

        <Card className={styles.actionsCard}>
          <h3>Islemler</h3>
          <div className={styles.actionButtons}>
            {canSend && (
              <Button onClick={handleSend} disabled={actionLoading}>
                Gonder
              </Button>
            )}
            {canAcceptReject && (
              <>
                <Button variant="secondary" onClick={handleAccept} disabled={actionLoading}>
                  Kabul Et
                </Button>
                <Button variant="ghost" onClick={handleReject} disabled={actionLoading}>
                  Reddet
                </Button>
              </>
            )}
            {canConvert && (
              <Button variant="primary" onClick={() => setShowConvertModal(true)} disabled={actionLoading}>
                Satisa Donustur
              </Button>
            )}
            {canDelete && (
              <Button variant="ghost" onClick={handleDelete} disabled={actionLoading} className={styles.deleteButton}>
                Sil
              </Button>
            )}
          </div>
          {quote.converted_sale_id && (
            <div className={styles.convertedInfo}>
              <span className={styles.convertedLabel}>Satisa Donusturuldu</span>
              <Button variant="ghost" size="sm" onClick={() => navigate(`/sales/${quote.converted_sale_id}`)}>
                Satisi Gor
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Quote Items */}
      <Card className={styles.itemsCard}>
        <h3>Teklif Kalemleri</h3>
        <div className={styles.itemsTableContainer}>
          <table className={styles.itemsTable}>
            <thead>
              <tr>
                <th>Urun</th>
                <th className={styles.alignRight}>Miktar</th>
                <th className={styles.alignRight}>Birim Fiyat</th>
                <th className={styles.alignRight}>Iskonto</th>
                <th className={styles.alignRight}>KDV</th>
                <th className={styles.alignRight}>Toplam</th>
              </tr>
            </thead>
            <tbody>
              {quote.items && quote.items.length > 0 ? (
                quote.items.map((item: QuoteItem) => (
                  <tr key={item.id}>
                    <td className={styles.productCell}>
                      <span className={styles.productName}>{item.product_name}</span>
                    </td>
                    <td className={styles.alignRight}>{item.quantity}</td>
                    <td className={styles.alignRight}>{formatCurrency(item.unit_price)}</td>
                    <td className={styles.alignRight}>
                      {item.discount_rate > 0 ? `%${item.discount_rate}` : '-'}
                    </td>
                    <td className={styles.alignRight}>%{item.vat_rate}</td>
                    <td className={styles.alignRight}>{formatCurrency(item.line_total)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className={styles.emptyItems}>
                    Teklif kalemi bulunamadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className={styles.totalsSection}>
          <div className={styles.totalsGrid}>
            <div className={styles.totalRow}>
              <span className={styles.totalRowLabel}>Ara Toplam</span>
              <span className={styles.totalRowValue}>{formatCurrency(quote.subtotal)}</span>
            </div>
            {(quote.discount_amount > 0 || quote.discount_rate > 0) && (
              <div className={styles.totalRow}>
                <span className={styles.totalRowLabel}>
                  Iskonto {quote.discount_rate > 0 && `(%${quote.discount_rate})`}
                </span>
                <span className={styles.totalRowValue}>-{formatCurrency(quote.discount_amount)}</span>
              </div>
            )}
            <div className={styles.totalRow}>
              <span className={styles.totalRowLabel}>KDV Toplam</span>
              <span className={styles.totalRowValue}>{formatCurrency(quote.vat_total)}</span>
            </div>
            <div className={`${styles.totalRow} ${styles.grandTotalRow}`}>
              <span className={styles.totalRowLabel}>Genel Toplam</span>
              <span className={styles.totalRowValue}>{formatCurrency(quote.grand_total)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Convert to Sale Modal */}
      {showConvertModal && (
        <div className={styles.modalOverlay} onClick={() => setShowConvertModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>Satisa Donustur</h3>
            <p className={styles.modalDescription}>
              Bu teklifi satisa donusturmek icin odeme yontemini secin.
            </p>
            <div className={styles.modalField}>
              <label className={styles.modalLabel}>Odeme Yontemi</label>
              <Select
                options={PAYMENT_METHOD_OPTIONS}
                value={convertPaymentMethod}
                onChange={(e) => setConvertPaymentMethod(e.target.value as ConvertToSaleData['payment_method'])}
              />
            </div>
            <div className={styles.modalActions}>
              <Button variant="ghost" onClick={() => setShowConvertModal(false)} disabled={actionLoading}>
                Iptal
              </Button>
              <Button variant="primary" onClick={handleConvertToSale} disabled={actionLoading}>
                {actionLoading ? 'Donusturuluyor...' : 'Donustur'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
