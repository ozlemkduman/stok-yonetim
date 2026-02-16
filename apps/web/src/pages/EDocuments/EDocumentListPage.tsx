import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Table, Button, Select, Badge, Pagination, type Column } from '@stok/ui';
import { EDocument, EDocumentSummary, eDocumentsApi } from '../../api/e-documents.api';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { CreateEDocumentModal } from './CreateEDocumentModal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './EDocumentListPage.module.css';

const icons = {
  edocuments: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 15L11 17L15 13" />
    </svg>
  ),
};

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

const TYPE_OPTIONS = [
  { value: '', label: 'Tum Belgeler' },
  { value: 'e_fatura', label: 'e-Fatura' },
  { value: 'e_arsiv', label: 'e-Arsiv' },
  { value: 'e_ihracat', label: 'e-Ihracat' },
  { value: 'e_irsaliye', label: 'e-Irsaliye' },
  { value: 'e_smm', label: 'e-SMM' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Tum Durumlar' },
  { value: 'draft', label: 'Taslak' },
  { value: 'pending', label: 'Bekliyor' },
  { value: 'approved', label: 'Onaylandi' },
  { value: 'rejected', label: 'Reddedildi' },
  { value: 'cancelled', label: 'Iptal' },
];

export function EDocumentListPage() {
  const [documents, setDocuments] = useState<EDocument[]>([]);
  const [summary, setSummary] = useState<EDocumentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await eDocumentsApi.getAll({
        page,
        limit: 20,
        documentType: typeFilter || undefined,
        status: statusFilter || undefined,
      });
      setDocuments(response.data);
      setTotal(response.meta?.total || 0);
      setTotalPages(response.meta?.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Belgeler yuklenirken hata olustu');
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, statusFilter]);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await eDocumentsApi.getSummary();
      setSummary(response.data);
    } catch (err) {
      showToast('error', 'Ozet bilgileri yuklenemedi');
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleSend = async (doc: EDocument) => {
    try {
      await eDocumentsApi.send(doc.id);
      showToast('success', 'Belge GIB\'e gonderildi');
      fetchDocuments();
      fetchSummary();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gonderim basarisiz');
    }
  };

  const handleCheckStatus = async (doc: EDocument) => {
    try {
      const result = await eDocumentsApi.checkStatus(doc.id);
      showToast('success', `Durum: ${STATUS_LABELS[result.data.status] || result.data.status}`);
      fetchDocuments();
      fetchSummary();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Durum sorgulanamadi');
    }
  };

  const handleCancel = async (doc: EDocument) => {
    const confirmed = await confirm({ message: 'Belgeyi iptal etmek istediginizden emin misiniz?', variant: 'danger' });
    if (!confirmed) return;
    try {
      await eDocumentsApi.cancel(doc.id);
      showToast('success', 'Belge iptal edildi');
      fetchDocuments();
      fetchSummary();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Iptal basarisiz');
    }
  };

  const columns: Column<EDocument>[] = [
    {
      key: 'document_number',
      header: 'Belge',
      render: (d) => (
        <div className={styles.documentInfo}>
          <Link to={`/e-documents/${d.id}`} className={styles.documentNumber}>{d.document_number}</Link>
          <span className={styles.documentType}>{DOCUMENT_TYPE_LABELS[d.document_type] || d.document_type}</span>
        </div>
      ),
    },
    {
      key: 'customer_name',
      header: 'Musteri',
      render: (d) => d.customer_name || '-',
    },
    {
      key: 'issue_date',
      header: 'Tarih',
      render: (d) => formatDate(d.issue_date),
    },
    {
      key: 'total_amount',
      header: 'Tutar',
      align: 'right',
      render: (d) => <span className={styles.total}>{formatCurrency(d.total_amount)}</span>,
    },
    {
      key: 'status',
      header: 'Durum',
      render: (d) => (
        <Badge variant={
          d.status === 'approved' ? 'success' :
          d.status === 'rejected' ? 'danger' :
          d.status === 'cancelled' ? 'warning' :
          d.status === 'pending' ? 'info' : 'default'
        }>
          {STATUS_LABELS[d.status] || d.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '180px',
      render: (d) => (
        <div className={styles.actions}>
          {d.status === 'draft' && (
            <Button size="sm" variant="ghost" onClick={() => handleSend(d)}>Gonder</Button>
          )}
          {d.status === 'pending' && (
            <Button size="sm" variant="ghost" onClick={() => handleCheckStatus(d)}>Sorgula</Button>
          )}
          {['draft', 'pending'].includes(d.status) && (
            <Button size="sm" variant="ghost" onClick={() => handleCancel(d)}>Iptal</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>{icons.edocuments}</span>
            e-Belgeler
          </h1>
          <p className={styles.subtitle}>Toplam {total} belge</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          + Yeni e-Belge
        </Button>
      </div>

      {summary && (
        <div className={styles.summaryCards}>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>e-Fatura</p>
            <p className={styles.summaryValue}>{summary.byType.e_fatura || 0}</p>
          </div>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>e-Arsiv</p>
            <p className={styles.summaryValue}>{summary.byType.e_arsiv || 0}</p>
          </div>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>e-Irsaliye</p>
            <p className={styles.summaryValue}>{summary.byType.e_irsaliye || 0}</p>
          </div>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>Onaylanan</p>
            <p className={styles.summaryValue}>{summary.byStatus.approved || 0}</p>
          </div>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>Bekleyen</p>
            <p className={styles.summaryValue}>{summary.byStatus.pending || 0}</p>
          </div>
        </div>
      )}

      <div className={styles.card}>
        <div className={styles.toolbar}>
          <div className={styles.filters}>
            <Select
              options={TYPE_OPTIONS}
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            />
            <Select
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <Table
          columns={columns}
          data={documents}
          keyExtractor={(d) => d.id}
          loading={loading}
          emptyMessage="e-Belge bulunamadi"
        />

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateEDocumentModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchDocuments();
            fetchSummary();
          }}
        />
      )}
    </div>
  );
}
