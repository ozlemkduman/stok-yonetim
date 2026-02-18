import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Badge, Card } from '@stok/ui';
import { salesApi, SaleDetail } from '../../api/sales.api';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { PAYMENT_METHODS, SALE_STATUSES, SALE_TYPES } from '../../utils/constants';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { PrintModal } from './PrintModal';
import styles from './SaleDetailPage.module.css';

export function SaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();
  const [data, setData] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [togglingInvoice, setTogglingInvoice] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await salesApi.getDetail(id);
        setData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Veri yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleCancel = async () => {
    if (!data || !id) return;
    const confirmed = await confirm({ message: `${data.invoice_number} numaralı satışı iptal etmek istediğinizden emin misiniz?`, variant: 'danger' });
    if (!confirmed) return;

    setCancelling(true);
    try {
      await salesApi.cancel(id);
      showToast('success', 'Satış iptal edildi');
      // Refresh data
      const response = await salesApi.getDetail(id);
      setData(response.data);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'İptal başarısız');
    } finally {
      setCancelling(false);
    }
  };

  const handleToggleInvoice = async () => {
    if (!data || !id) return;
    setTogglingInvoice(true);
    try {
      await salesApi.updateInvoiceIssued(id, !data.invoice_issued);
      showToast('success', data.invoice_issued ? 'Fatura durumu kaldırıldı' : 'Fatura kesildi olarak işaretlendi');
      const response = await salesApi.getDetail(id);
      setData(response.data);
    } catch (err) {
      showToast('error', 'Fatura durumu güncellenemedi');
    } finally {
      setTogglingInvoice(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Yükleniyor...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>{error || 'Satış bulunamadı'}</div>
        <Button onClick={() => navigate('/sales')}>Geri Dön</Button>
      </div>
    );
  }

  const statusVariant = data.status === 'completed' ? 'success' : data.status === 'cancelled' ? 'danger' : 'warning';
  const canCancel = data.status === 'completed';

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Button variant="ghost" onClick={() => navigate('/sales')}>
            &#8592; Satışlar
          </Button>
          <h1 className={styles.title}>{data.invoice_number}</h1>
          <div className={styles.saleMeta}>
            <Badge variant={statusVariant}>
              {SALE_STATUSES[data.status as keyof typeof SALE_STATUSES] || data.status}
            </Badge>
            <span>{formatDateTime(data.sale_date)}</span>
          </div>
        </div>
        <div className={styles.headerRight}>
          <Button variant="secondary" onClick={() => setShowPrintModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, marginRight: 8 }}>
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Yazdır
          </Button>
          {canCancel && (
            <Button variant="danger" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? 'İptal Ediliyor...' : 'Satışı İptal Et'}
            </Button>
          )}
        </div>
      </div>

      {/* Info Grid */}
      <div className={styles.infoGrid}>
        {/* Sale Info Card */}
        <Card className={styles.infoCard}>
          <h3>Satış Bilgileri</h3>
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Fatura No</span>
              <span className={styles.infoValue}>{data.invoice_number}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Tarih</span>
              <span className={styles.infoValue}>{formatDate(data.sale_date)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Müşteri</span>
              <span className={styles.infoValue}>
                {data.customer_name ? (
                  <button
                    className={styles.linkButton}
                    onClick={() => data.customer_id && navigate(`/customers/${data.customer_id}`)}
                  >
                    {data.customer_name}
                  </button>
                ) : (
                  'Perakende Satış'
                )}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Satış Tipi</span>
              <span className={styles.infoValue}>
                {SALE_TYPES[data.sale_type as keyof typeof SALE_TYPES] || 'Perakende'}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Ödeme Yöntemi</span>
              <span className={styles.infoValue}>
                {PAYMENT_METHODS[data.payment_method as keyof typeof PAYMENT_METHODS] || data.payment_method}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Fatura Durumu</span>
              <span className={styles.infoValue}>
                <Badge variant={data.invoice_issued ? 'success' : 'warning'}>
                  {data.invoice_issued ? 'Fatura Kesildi' : 'Fatura Kesilmedi'}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleToggleInvoice}
                  disabled={togglingInvoice}
                  style={{ marginLeft: 8 }}
                >
                  {togglingInvoice ? '...' : data.invoice_issued ? 'Kaldır' : 'Kesildi İşaretle'}
                </Button>
              </span>
            </div>
            {data.created_by_name && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Satisi Yapan</span>
                <span className={styles.infoValue}>{data.created_by_name}</span>
              </div>
            )}
            {data.due_date && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Vade Tarihi</span>
                <span className={styles.infoValue}>{formatDate(data.due_date)}</span>
              </div>
            )}
            {data.notes && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Notlar</span>
                <span className={styles.infoValue}>{data.notes}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Totals Card */}
        <Card className={styles.totalsCard}>
          <h3>Tutar Bilgileri</h3>
          <div className={styles.totalsList}>
            <div className={styles.totalItem}>
              <span className={styles.totalLabel}>Ara Toplam</span>
              <span className={styles.totalValue}>{formatCurrency(data.subtotal)}</span>
            </div>
            {data.discount_amount > 0 && (
              <div className={styles.totalItem}>
                <span className={styles.totalLabel}>
                  İskonto {data.discount_rate > 0 ? `(%${data.discount_rate})` : ''}
                </span>
                <span className={`${styles.totalValue} ${styles.discount}`}>
                  -{formatCurrency(data.discount_amount)}
                </span>
              </div>
            )}
            <div className={styles.totalItem}>
              <span className={styles.totalLabel}>KDV Toplam</span>
              <span className={styles.totalValue}>{formatCurrency(data.vat_total)}</span>
            </div>
            <div className={`${styles.totalItem} ${styles.grandTotal}`}>
              <span className={styles.totalLabel}>Genel Toplam</span>
              <span className={styles.totalValue}>{formatCurrency(data.grand_total)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Sale Items */}
      <Card className={styles.itemsCard}>
        <h3>Satış Kalemleri ({data.items.length})</h3>
        <div className={styles.tableWrapper}>
          <table className={styles.itemsTable}>
            <thead>
              <tr>
                <th>Ürün</th>
                <th>Barkod</th>
                <th className={styles.alignRight}>Miktar</th>
                <th className={styles.alignRight}>Birim Fiyat</th>
                <th className={styles.alignRight}>İskonto</th>
                <th className={styles.alignRight}>KDV (%)</th>
                <th className={styles.alignRight}>KDV Tutar</th>
                <th className={styles.alignRight}>Toplam</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.product_name || '-'}</td>
                  <td>{item.barcode || '-'}</td>
                  <td className={styles.alignRight}>{item.quantity}</td>
                  <td className={styles.alignRight}>{formatCurrency(item.unit_price)}</td>
                  <td className={styles.alignRight}>
                    {item.discount_rate > 0 ? `%${item.discount_rate}` : '-'}
                  </td>
                  <td className={styles.alignRight}>%{item.vat_rate}</td>
                  <td className={styles.alignRight}>{formatCurrency(item.vat_amount)}</td>
                  <td className={styles.alignRight}>{formatCurrency(item.line_total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={7}>Ara Toplam</td>
                <td className={styles.alignRight}>{formatCurrency(data.subtotal)}</td>
              </tr>
              {data.discount_amount > 0 && (
                <tr>
                  <td colSpan={7}>İskonto</td>
                  <td className={styles.alignRight}>-{formatCurrency(data.discount_amount)}</td>
                </tr>
              )}
              <tr>
                <td colSpan={7}>KDV Toplam</td>
                <td className={styles.alignRight}>{formatCurrency(data.vat_total)}</td>
              </tr>
              <tr className={styles.footerGrandTotal}>
                <td colSpan={7}>Genel Toplam</td>
                <td className={styles.alignRight}>{formatCurrency(data.grand_total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Payments */}
      <Card className={styles.paymentsCard}>
        <h3>Ödeme Bilgileri ({data.payments.length})</h3>
        {data.payments.length === 0 ? (
          <div className={styles.emptyState}>
            {data.payment_method === 'veresiye'
              ? 'Henüz ödeme yapılmamış (Veresiye satış)'
              : 'Ödeme peşin olarak alınmıştır'}
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.paymentsTable}>
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Ödeme Yöntemi</th>
                  <th>Notlar</th>
                  <th className={styles.alignRight}>Tutar</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{formatDate(payment.payment_date)}</td>
                    <td>
                      {PAYMENT_METHODS[payment.method as keyof typeof PAYMENT_METHODS] || payment.method}
                    </td>
                    <td>{payment.notes || '-'}</td>
                    <td className={`${styles.alignRight} ${styles.paymentAmount}`}>
                      {formatCurrency(payment.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3}>Toplam Ödeme</td>
                  <td className={`${styles.alignRight} ${styles.paymentAmount}`}>
                    {formatCurrency(data.payments.reduce((sum, p) => sum + p.amount, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      {/* Print Modal */}
      <PrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        data={data}
      />
    </div>
  );
}
