import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

export function EDocumentListPage() {
  const { t } = useTranslation(['edocuments', 'common']);
  const navigate = useNavigate();
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

  const TYPE_OPTIONS = [
    { value: '', label: t('edocuments:typeFilter.all') },
    { value: 'e_fatura', label: t('edocuments:documentTypes.e_fatura') },
    { value: 'e_arsiv', label: t('edocuments:documentTypes.e_arsiv') },
    { value: 'e_ihracat', label: t('edocuments:documentTypes.e_ihracat') },
    { value: 'e_irsaliye', label: t('edocuments:documentTypes.e_irsaliye') },
    { value: 'e_smm', label: t('edocuments:documentTypes.e_smm') },
  ];

  const STATUS_OPTIONS = [
    { value: '', label: t('edocuments:statusFilter.all') },
    { value: 'draft', label: t('edocuments:statuses.draft') },
    { value: 'pending', label: t('edocuments:statuses.pending') },
    { value: 'approved', label: t('edocuments:statuses.approved') },
    { value: 'rejected', label: t('edocuments:statuses.rejected') },
    { value: 'cancelled', label: t('edocuments:statuses.cancelled') },
  ];

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
      setError(err instanceof Error ? err.message : t('edocuments:toast.loadError'));
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, statusFilter, t]);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await eDocumentsApi.getSummary();
      setSummary(response.data);
    } catch (err) {
      showToast('error', t('edocuments:toast.summaryLoadError'));
    }
  }, [t]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleSend = async (doc: EDocument) => {
    try {
      await eDocumentsApi.send(doc.id);
      showToast('success', t('edocuments:toast.sentToGib'));
      fetchDocuments();
      fetchSummary();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('edocuments:toast.sendFailed'));
    }
  };

  const handleCheckStatus = async (doc: EDocument) => {
    try {
      const result = await eDocumentsApi.checkStatus(doc.id);
      const statusLabel = t(`edocuments:statuses.${result.data.status}`, { defaultValue: result.data.status });
      showToast('success', t('edocuments:toast.statusResult', { status: statusLabel }));
      fetchDocuments();
      fetchSummary();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('edocuments:toast.statusQueryFailed'));
    }
  };

  const handleCancel = async (doc: EDocument) => {
    const confirmed = await confirm({ message: t('edocuments:confirm.cancelMessage'), variant: 'danger' });
    if (!confirmed) return;
    try {
      await eDocumentsApi.cancel(doc.id);
      showToast('success', t('edocuments:toast.cancelled'));
      fetchDocuments();
      fetchSummary();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('edocuments:toast.cancelFailed'));
    }
  };

  const columns: Column<EDocument>[] = [
    {
      key: 'document_number',
      header: t('edocuments:columns.document'),
      render: (d) => (
        <div className={styles.documentInfo}>
          <Link to={`/e-documents/${d.id}`} className={styles.documentNumber}>{d.document_number}</Link>
          <span className={styles.documentType}>{t(`edocuments:documentTypes.${d.document_type}`, { defaultValue: d.document_type })}</span>
        </div>
      ),
    },
    {
      key: 'customer_name',
      header: t('edocuments:columns.customer'),
      render: (d) => d.customer_id ? (
        <button className={styles.customerLink} onClick={(e) => { e.stopPropagation(); navigate(`/customers/${d.customer_id}`); }}>
          {d.customer_name}
        </button>
      ) : (d.customer_name || '-'),
    },
    {
      key: 'issue_date',
      header: t('edocuments:columns.date'),
      render: (d) => formatDate(d.issue_date),
    },
    {
      key: 'total_amount',
      header: t('edocuments:columns.amount'),
      align: 'right',
      render: (d) => <span className={styles.total}>{formatCurrency(d.total_amount)}</span>,
    },
    {
      key: 'status',
      header: t('edocuments:columns.status'),
      render: (d) => (
        <Badge variant={
          d.status === 'approved' ? 'success' :
          d.status === 'rejected' ? 'danger' :
          d.status === 'cancelled' ? 'warning' :
          d.status === 'pending' ? 'info' : 'default'
        }>
          {t(`edocuments:statuses.${d.status}`, { defaultValue: d.status })}
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
            <Button size="sm" variant="primary" onClick={() => handleSend(d)}>{t('edocuments:actions.send')}</Button>
          )}
          {d.status === 'pending' && (
            <Button size="sm" variant="secondary" onClick={() => handleCheckStatus(d)}>{t('edocuments:actions.query')}</Button>
          )}
          {['draft', 'pending'].includes(d.status) && (
            <Button size="sm" variant="danger" onClick={() => handleCancel(d)}>{t('edocuments:actions.cancel')}</Button>
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
            {t('edocuments:pageTitle')}
          </h1>
          <p className={styles.subtitle}>{t('edocuments:totalDocuments', { count: total })}</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          {t('edocuments:newDocument')}
        </Button>
      </div>

      {summary && (
        <div className={styles.summaryCards}>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>{t('edocuments:summary.eFatura')}</p>
            <p className={styles.summaryValue}>{summary.byType.e_fatura || 0}</p>
          </div>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>{t('edocuments:summary.eArsiv')}</p>
            <p className={styles.summaryValue}>{summary.byType.e_arsiv || 0}</p>
          </div>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>{t('edocuments:summary.eIrsaliye')}</p>
            <p className={styles.summaryValue}>{summary.byType.e_irsaliye || 0}</p>
          </div>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>{t('edocuments:summary.approved')}</p>
            <p className={styles.summaryValue}>{summary.byStatus.approved || 0}</p>
          </div>
          <div className={styles.summaryCard}>
            <p className={styles.summaryLabel}>{t('edocuments:summary.pending')}</p>
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
          emptyMessage={t('edocuments:emptyMessage')}
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
