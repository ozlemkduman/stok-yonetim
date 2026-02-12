import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Badge, Card } from '@stok/ui';
import { eDocumentsApi, EDocument, EDocumentLog } from '../../api/e-documents.api';
import { useToast } from '../../context/ToastContext';
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
    if (!confirm('Belgeyi iptal etmek istediginizden emin misiniz?')) return;
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
    // TODO: Implement PDF download when endpoint is available
    showToast('info', 'PDF indirme ozelligi yakin zamanda eklenecek');
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
