import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, Button, Badge, Select, Pagination, type Column } from '@stok/ui';
import { eDocumentsApi, EDocument, EDocumentSummary, EDocumentType, EDocumentStatus } from '../../api/e-documents.api';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './EDocumentListPage.module.css';

const DOC_TYPES: EDocumentType[] = ['e_fatura', 'e_arsiv', 'e_ihracat', 'e_irsaliye', 'e_smm'];
const STATUSES: EDocumentStatus[] = ['draft', 'pending', 'sent', 'approved', 'rejected', 'cancelled'];

function statusVariant(status: EDocumentStatus): 'success' | 'danger' | 'warning' | 'info' | 'default' {
  if (status === 'approved') return 'success';
  if (status === 'rejected' || status === 'cancelled') return 'danger';
  if (status === 'pending' || status === 'sent') return 'warning';
  return 'default';
}

export function EDocumentListPage() {
  const { t } = useTranslation(['eDocuments', 'common']);
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();

  const [documents, setDocuments] = useState<EDocument[]>([]);
  const [summary, setSummary] = useState<EDocumentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (typeFilter) params.documentType = typeFilter;
      if (statusFilter) params.status = statusFilter;
      const [docsRes, sumRes] = await Promise.all([
        eDocumentsApi.getAll(params),
        eDocumentsApi.getSummary(),
      ]);
      setDocuments(docsRes.data);
      setTotalPages(docsRes.meta?.totalPages || 1);
      setSummary(sumRes.data);
    } catch {
      showToast('error', t('eDocuments:toast.loadError'));
    }
    setLoading(false);
  }, [page, typeFilter, statusFilter, showToast, t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const runAction = async (fn: () => Promise<unknown>, successKey: string, id: string) => {
    setBusyId(id);
    try {
      await fn();
      showToast('success', t(successKey));
      await fetchData();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('eDocuments:toast.actionError'));
    } finally {
      setBusyId(null);
    }
  };

  const handleSend = (d: EDocument) => runAction(() => eDocumentsApi.send(d.id), 'eDocuments:toast.sendSuccess', d.id);
  const handleCheck = (d: EDocument) => runAction(() => eDocumentsApi.checkStatus(d.id), 'eDocuments:toast.statusSuccess', d.id);
  const handleCancel = async (d: EDocument) => {
    const ok = await confirm({ message: t('eDocuments:confirm.cancel'), variant: 'danger' });
    if (!ok) return;
    runAction(() => eDocumentsApi.cancel(d.id), 'eDocuments:toast.cancelSuccess', d.id);
  };

  const columns: Column<EDocument>[] = [
    { key: 'document_number', header: t('eDocuments:columns.documentNumber'), render: (d) => <strong>{d.document_number}</strong> },
    { key: 'document_type', header: t('eDocuments:columns.type'), render: (d) => t(`eDocuments:types.${d.document_type}`, { defaultValue: d.document_type }) },
    { key: 'customer_name', header: t('eDocuments:columns.customer'), render: (d) => d.customer_name || '-' },
    { key: 'issue_date', header: t('eDocuments:columns.issueDate'), render: (d) => formatDate(d.issue_date) },
    { key: 'total_amount', header: t('eDocuments:columns.total'), align: 'right', render: (d) => formatCurrency(Number(d.total_amount)) },
    {
      key: 'status', header: t('eDocuments:columns.status'),
      render: (d) => <Badge variant={statusVariant(d.status)}>{t(`eDocuments:statuses.${d.status}`, { defaultValue: d.status })}</Badge>,
    },
    {
      key: 'actions', header: t('eDocuments:columns.actions'), width: '260px',
      render: (d) => (
        <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
          {d.status === 'draft' && (
            <Button size="sm" variant="primary" disabled={busyId === d.id} onClick={() => handleSend(d)}>{t('eDocuments:actions.send')}</Button>
          )}
          {(d.status === 'pending' || d.status === 'sent') && (
            <Button size="sm" variant="secondary" disabled={busyId === d.id} onClick={() => handleCheck(d)}>{t('eDocuments:actions.checkStatus')}</Button>
          )}
          {(d.status === 'draft' || d.status === 'pending') && (
            <Button size="sm" variant="danger" disabled={busyId === d.id} onClick={() => handleCancel(d)}>{t('eDocuments:actions.cancel')}</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('eDocuments:title')}</h1>
          <p className={styles.subtitle}>{t('eDocuments:subtitle')}</p>
        </div>
      </div>

      {summary && (
        <div className={styles.summaryGrid}>
          <div className={styles.summaryCard}>
            <div className={styles.summaryValue}>{summary.total}</div>
            <div className={styles.summaryLabel}>{t('eDocuments:summary.total')}</div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryValue}>{summary.byStatus?.draft || 0}</div>
            <div className={styles.summaryLabel}>{t('eDocuments:summary.draft')}</div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryValue}>{summary.byStatus?.pending || 0}</div>
            <div className={styles.summaryLabel}>{t('eDocuments:summary.pending')}</div>
          </div>
          <div className={styles.summaryCard}>
            <div className={styles.summaryValue}>{summary.byStatus?.approved || 0}</div>
            <div className={styles.summaryLabel}>{t('eDocuments:summary.approved')}</div>
          </div>
        </div>
      )}

      <div className={styles.card}>
        <div className={styles.toolbar}>
          <Select
            options={[{ value: '', label: t('eDocuments:filters.allTypes') }, ...DOC_TYPES.map((v) => ({ value: v, label: t(`eDocuments:types.${v}`) }))]}
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          />
          <Select
            options={[{ value: '', label: t('eDocuments:filters.allStatuses') }, ...STATUSES.map((v) => ({ value: v, label: t(`eDocuments:statuses.${v}`) }))]}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          />
        </div>
        <Table
          columns={columns}
          data={documents}
          keyExtractor={(d) => d.id}
          loading={loading}
          emptyMessage={t('eDocuments:empty')}
        />
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
