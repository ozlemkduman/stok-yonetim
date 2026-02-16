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
  sent: 'Gönderildi',
  accepted: 'Kabul Edildi',
  rejected: 'Reddedildi',
  expired: 'Süresi Doldu',
  converted: 'Satışa Dönüştürüldü',
};

const PAYMENT_METHOD_OPTIONS = [
  { value: 'nakit', label: 'Nakit' },
  { value: 'kredi_karti', label: 'Kredi Kartı' },
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
        setError(err instanceof Error ? err.message : 'Teklif yüklenemedi');
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
      showToast('success', 'Teklif gönderildi');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'İşlem başarısız');
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
      showToast('error', err instanceof Error ? err.message : 'İşlem başarısız');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!quote) return;
    const confirmed = await confirm({ message: 'Teklifi reddetmek istediğinizden emin misiniz?', variant: 'warning' });
    if (!confirmed) return;
    setActionLoading(true);
    try {
      const response = await quotesApi.reject(quote.id);
      setQuote({ ...quote, ...response.data });
      showToast('success', 'Teklif reddedildi');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'İşlem başarısız');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToSale = async () => {
    if (!quote) return;
    setActionLoading(true);
    try {
      await quotesApi.convertToSale(quote.id, { payment_method: convertPaymentMethod });
      showToast('success', 'Teklif satışa dönüştürüldü');
      setShowConvertModal(false);
      // Refresh quote data
      const response = await quotesApi.getById(quote.id);
      setQuote(response.data);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'İşlem başarısız');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!quote) return;
    const confirmed = await confirm({ message: `"${quote.quote_number}" teklifini silmek istediğinizden emin misiniz?`, variant: 'danger' });
    if (!confirmed) return;
    setActionLoading(true);
    try {
      await quotesApi.delete(quote.id);
      showToast('success', 'Teklif silindi');
      navigate('/quotes');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Silme işlemi başarısız');
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

    if (diffDays < 0) return { text: 'Süresi doldu', variant: 'danger' as const };
    if (diffDays === 0) return { text: 'Bugün son gün', variant: 'warning' as const };
    if (diffDays <= 3) return { text: `${diffDays} gün kaldı`, variant: 'warning' as const };
    return { text: `${diffDays} gün kaldı`, variant: 'default' as const };
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Yükleniyor...</div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>{error || 'Teklif bulunamadı'}</div>
        <Button onClick={() => navigate('/quotes')}>Geri Dön</Button>
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
              <span className={styles.infoLabel}>Geçerlilik Tarihi</span>
              <span className={`${styles.infoValue} ${validityStatus?.variant === 'danger' ? styles.expired : validityStatus?.variant === 'warning' ? styles.warning : ''}`}>
                {formatDate(quote.valid_until)}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Müşteri</span>
              <span className={styles.infoValue}>{quote.customer_name || 'Belirtilmemiş'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>KDV Dahil</span>
              <span className={styles.infoValue}>{quote.include_vat ? 'Evet' : 'Hayır'}</span>
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
          <h3>İşlemler</h3>
          <div className={styles.actionButtons}>
            {canSend && (
              <Button onClick={handleSend} disabled={actionLoading}>
                Gönder
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
                Satışa Dönüştür
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
              <span className={styles.convertedLabel}>Satışa Dönüştürüldü</span>
              <Button variant="ghost" size="sm" onClick={() => navigate(`/sales/${quote.converted_sale_id}`)}>
                Satışı Gör
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
                <th>Ürün</th>
                <th className={styles.alignRight}>Miktar</th>
                <th className={styles.alignRight}>Birim Fiyat</th>
                <th className={styles.alignRight}>İskonto</th>
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
                    Teklif kalemi bulunamadı
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
                  İskonto {quote.discount_rate > 0 && `(%${quote.discount_rate})`}
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
            <h3 className={styles.modalTitle}>Satışa Dönüştür</h3>
            <p className={styles.modalDescription}>
              Bu teklifi satışa dönüştürmek için ödeme yöntemini seçin.
            </p>
            <div className={styles.modalField}>
              <label className={styles.modalLabel}>Ödeme Yöntemi</label>
              <Select
                options={PAYMENT_METHOD_OPTIONS}
                value={convertPaymentMethod}
                onChange={(e) => setConvertPaymentMethod(e.target.value as ConvertToSaleData['payment_method'])}
              />
            </div>
            <div className={styles.modalActions}>
              <Button variant="ghost" onClick={() => setShowConvertModal(false)} disabled={actionLoading}>
                İptal
              </Button>
              <Button variant="primary" onClick={handleConvertToSale} disabled={actionLoading}>
                {actionLoading ? 'Dönüştürülüyor...' : 'Dönüştür'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
