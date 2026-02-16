import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Badge, Card } from '@stok/ui';
import { eDocumentsApi, EDocument, EDocumentLog } from '../../api/e-documents.api';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { useTenant } from '../../context/TenantContext';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import styles from './EDocumentDetailPage.module.css';

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  e_fatura: 'e-Fatura',
  e_arsiv: 'e-Arsiv',
  e_ihracat: 'e-Ihracat',
  e_irsaliye: 'e-Irsaliye',
  e_smm: 'e-SMM',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Taslak',
  pending: 'Bekliyor',
  sent: 'Gonderildi',
  approved: 'Onaylandi',
  rejected: 'Reddedildi',
  cancelled: 'Iptal',
};

const ACTION_LABELS: Record<string, string> = {
  created: 'Olusturuldu',
  sent: 'Gonderildi',
  send_failed: 'Gonderim Basarisiz',
  status_checked: 'Durum Sorgulandi',
  cancelled: 'Iptal Edildi',
};

const REFERENCE_TYPE_LABELS: Record<string, string> = {
  sale: 'Satis',
  return: 'Iade',
  waybill: 'Irsaliye',
};

export function EDocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();
  const { settings: tenantSettings } = useTenant();

  const [document, setDocument] = useState<EDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await eDocumentsApi.getById(id);
      setDocument(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Belge yuklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!document) return;
    setActionLoading('send');
    try {
      await eDocumentsApi.send(document.id);
      showToast('success', 'Belge GIB\'e gonderildi');
      fetchDocument();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gonderim basarisiz');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckStatus = async () => {
    if (!document) return;
    setActionLoading('check');
    try {
      const result = await eDocumentsApi.checkStatus(document.id);
      showToast('success', `Durum: ${STATUS_LABELS[result.data.status] || result.data.status}`);
      fetchDocument();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Durum sorgulanamadi');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!document) return;
    const confirmed = await confirm({ message: 'Belgeyi iptal etmek istediginizden emin misiniz?', variant: 'danger' });
    if (!confirmed) return;
    setActionLoading('cancel');
    try {
      await eDocumentsApi.cancel(document.id);
      showToast('success', 'Belge iptal edildi');
      fetchDocument();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Iptal basarisiz');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadPdf = () => {
    if (!document) return;

    const companyName = tenantSettings?.name || 'Sirket Adi';
    const companyAddress = tenantSettings?.settings?.address || '';
    const companyPhone = tenantSettings?.settings?.phone || '';
    const taxOffice = tenantSettings?.settings?.taxOffice || '';
    const taxNumber = tenantSettings?.settings?.taxNumber || '';
    const docTypeLabel = DOCUMENT_TYPE_LABELS[document.document_type] || document.document_type;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast('error', 'Popup engelleyici aktif. Lutfen izin verin.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${docTypeLabel} - ${document.document_number}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, sans-serif; color: #1a1a2e; padding: 40px; font-size: 13px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 32px; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; }
          .company h1 { font-size: 22px; color: #4f46e5; margin-bottom: 4px; }
          .company p { color: #6b7280; font-size: 12px; }
          .doc-info { text-align: right; }
          .doc-info h2 { font-size: 18px; color: #4f46e5; margin-bottom: 8px; }
          .doc-info table td { padding: 2px 0; font-size: 12px; }
          .doc-info table td:first-child { color: #6b7280; padding-right: 12px; }
          .section { margin-bottom: 24px; }
          .section h3 { font-size: 14px; color: #4f46e5; margin-bottom: 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          .info-row { display: flex; gap: 8px; }
          .info-label { color: #6b7280; min-width: 120px; }
          .totals { margin-top: 24px; display: flex; justify-content: flex-end; }
          .totals table { border-collapse: collapse; }
          .totals td { padding: 6px 16px; }
          .totals td:first-child { color: #6b7280; text-align: right; }
          .totals td:last-child { text-align: right; font-weight: 500; }
          .totals tr.grand td { border-top: 2px solid #1a1a2e; font-weight: 700; font-size: 15px; }
          .gib-info { background: #f9fafb; padding: 16px; border-radius: 8px; margin-top: 16px; }
          .gib-info p { font-size: 11px; color: #6b7280; margin: 2px 0; }
          .footer { margin-top: 48px; text-align: center; color: #9ca3af; font-size: 11px; border-top: 1px solid #e5e7eb; padding-top: 16px; }
          .status { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
          .status-approved { background: #d1fae5; color: #065f46; }
          .status-sent, .status-pending { background: #dbeafe; color: #1e40af; }
          .status-draft { background: #f3f4f6; color: #374151; }
          .status-rejected, .status-cancelled { background: #fee2e2; color: #991b1b; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company">
            <h1>${companyName}</h1>
            ${companyAddress ? `<p>${companyAddress}</p>` : ''}
            ${companyPhone ? `<p>Tel: ${companyPhone}</p>` : ''}
            ${taxOffice && taxNumber ? `<p>${taxOffice} V.D. - ${taxNumber}</p>` : ''}
          </div>
          <div class="doc-info">
            <h2>${docTypeLabel}</h2>
            <table>
              <tr><td>Belge No:</td><td><strong>${document.document_number}</strong></td></tr>
              <tr><td>Tarih:</td><td>${formatDate(document.issue_date)}</td></tr>
              <tr>
                <td>Durum:</td>
                <td><span class="status status-${document.status}">${STATUS_LABELS[document.status] || document.status}</span></td>
              </tr>
            </table>
          </div>
        </div>

        <div class="section">
          <h3>Musteri Bilgileri</h3>
          <p><strong>${document.customer_name || 'Genel Musteri'}</strong></p>
        </div>

        <div class="section">
          <h3>Belge Detaylari</h3>
          <div class="info-grid">
            <div class="info-row">
              <span class="info-label">Belge Tipi:</span>
              <span>${docTypeLabel}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Referans:</span>
              <span>${REFERENCE_TYPE_LABELS[document.reference_type] || document.reference_type}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Duzenleme Tarihi:</span>
              <span>${formatDate(document.issue_date)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Olusturulma:</span>
              <span>${formatDateTime(document.created_at)}</span>
            </div>
          </div>
        </div>

        <div class="totals">
          <table>
            <tr><td>Ara Toplam:</td><td>${formatCurrency(document.amount)}</td></tr>
            <tr><td>KDV Toplam:</td><td>${formatCurrency(document.vat_amount)}</td></tr>
            <tr class="grand"><td>GENEL TOPLAM:</td><td>${formatCurrency(document.total_amount)}</td></tr>
          </table>
        </div>

        ${document.gib_uuid ? `
        <div class="gib-info">
          <p><strong>GIB UUID:</strong> ${document.gib_uuid}</p>
          ${document.envelope_uuid ? `<p><strong>Zarf UUID:</strong> ${document.envelope_uuid}</p>` : ''}
          ${document.gib_response_code ? `<p><strong>Yanit Kodu:</strong> ${document.gib_response_code}</p>` : ''}
        </div>
        ` : ''}

        <div class="footer">
          <p>Bu belge elektronik ortamda olusturulmustur.</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      case 'cancelled': return 'warning';
      case 'pending': return 'info';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Yukleniyor...</div>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>{error || 'Belge bulunamadi'}</div>
        <Button onClick={() => navigate('/e-documents')}>Geri Don</Button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Button variant="ghost" onClick={() => navigate('/e-documents')}>
            ← e-Belgeler
          </Button>
          <h1 className={styles.title}>{document.document_number}</h1>
          <div className={styles.documentMeta}>
            <span className={styles.documentType}>
              {DOCUMENT_TYPE_LABELS[document.document_type] || document.document_type}
            </span>
            <Badge variant={getStatusVariant(document.status)}>
              {STATUS_LABELS[document.status] || document.status}
            </Badge>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.totalCard}>
            <span className={styles.totalLabel}>Toplam Tutar</span>
            <span className={styles.totalValue}>{formatCurrency(document.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actionsBar}>
        {document.status === 'draft' && (
          <Button
            onClick={handleSend}
            disabled={actionLoading !== null}
          >
            {actionLoading === 'send' ? 'Gonderiliyor...' : 'GIB\'e Gonder'}
          </Button>
        )}
        {document.status === 'pending' && (
          <Button
            variant="secondary"
            onClick={handleCheckStatus}
            disabled={actionLoading !== null}
          >
            {actionLoading === 'check' ? 'Sorgulaniyor...' : 'Durumu Sorgula'}
          </Button>
        )}
        <Button variant="secondary" onClick={handleDownloadPdf}>
          PDF Indir
        </Button>
        {['draft', 'pending'].includes(document.status) && (
          <Button
            variant="ghost"
            onClick={handleCancel}
            disabled={actionLoading !== null}
          >
            {actionLoading === 'cancel' ? 'Iptal Ediliyor...' : 'Iptal Et'}
          </Button>
        )}
      </div>

      {/* Info Grid */}
      <div className={styles.infoGrid}>
        <Card className={styles.infoCard}>
          <h3>Belge Bilgileri</h3>
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Belge Tipi</span>
              <span className={styles.infoValue}>
                {DOCUMENT_TYPE_LABELS[document.document_type] || document.document_type}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Belge No</span>
              <span className={styles.infoValue}>{document.document_number}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Duzenleme Tarihi</span>
              <span className={styles.infoValue}>{formatDate(document.issue_date)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Referans</span>
              <span className={styles.infoValue}>
                {REFERENCE_TYPE_LABELS[document.reference_type] || document.reference_type}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Durum</span>
              <span className={styles.infoValue}>
                <Badge variant={getStatusVariant(document.status)}>
                  {STATUS_LABELS[document.status] || document.status}
                </Badge>
              </span>
            </div>
          </div>
        </Card>

        <Card className={styles.infoCard}>
          <h3>Musteri Bilgileri</h3>
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Musteri</span>
              <span className={styles.infoValue}>{document.customer_name || 'Genel Musteri'}</span>
            </div>
          </div>
        </Card>

        <Card className={styles.infoCard}>
          <h3>Tutar Bilgileri</h3>
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Ara Toplam</span>
              <span className={styles.infoValue}>{formatCurrency(document.amount)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>KDV Toplam</span>
              <span className={styles.infoValue}>{formatCurrency(document.vat_amount)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Genel Toplam</span>
              <span className={`${styles.infoValue} ${styles.grandTotal}`}>
                {formatCurrency(document.total_amount)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* GIB Response */}
      {(document.gib_uuid || document.gib_response_code) && (
        <Card className={styles.gibCard}>
          <h3>GIB Bilgileri</h3>
          <div className={styles.gibInfo}>
            {document.gib_uuid && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>GIB UUID</span>
                <span className={styles.infoValue}>{document.gib_uuid}</span>
              </div>
            )}
            {document.envelope_uuid && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Zarf UUID</span>
                <span className={styles.infoValue}>{document.envelope_uuid}</span>
              </div>
            )}
            {document.gib_response_code && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Yanit Kodu</span>
                <span className={styles.infoValue}>{document.gib_response_code}</span>
              </div>
            )}
            {document.gib_response_message && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Yanit Mesaji</span>
                <span className={styles.infoValue}>{document.gib_response_message}</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Logs */}
      {document.logs && document.logs.length > 0 && (
        <Card className={styles.logsCard}>
          <h3>Islem Gecmisi</h3>
          <div className={styles.logsList}>
            {document.logs.map((log: EDocumentLog) => (
              <div key={log.id} className={styles.logItem}>
                <div className={styles.logHeader}>
                  <span className={styles.logAction}>
                    {ACTION_LABELS[log.action] || log.action}
                  </span>
                  <span className={styles.logDate}>{formatDateTime(log.created_at)}</span>
                </div>
                {log.status_before && log.status_after && log.status_before !== log.status_after && (
                  <div className={styles.logStatus}>
                    <Badge variant="default" size="sm">
                      {STATUS_LABELS[log.status_before] || log.status_before}
                    </Badge>
                    <span className={styles.logArrow}>→</span>
                    <Badge variant={getStatusVariant(log.status_after)} size="sm">
                      {STATUS_LABELS[log.status_after] || log.status_after}
                    </Badge>
                  </div>
                )}
                {log.message && (
                  <p className={styles.logMessage}>{log.message}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
