import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Table, Button, Input, Select, Badge, Pagination, type Column } from '@stok/ui';
import { Quote, quotesApi } from '../../api/quotes.api';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './QuoteListPage.module.css';

const icons = {
  quotes: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
};

export function QuoteListPage() {
  const { t } = useTranslation(['quotes', 'common']);
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();

  const STATUS_OPTIONS = [
    { value: '', label: t('quotes:statusFilter.all') },
    { value: 'draft', label: t('quotes:statuses.draft') },
    { value: 'sent', label: t('quotes:statuses.sent') },
    { value: 'accepted', label: t('quotes:statuses.accepted') },
    { value: 'rejected', label: t('quotes:statuses.rejected') },
    { value: 'expired', label: t('quotes:statuses.expired') },
    { value: 'converted', label: t('quotes:statuses.converted') },
  ];

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await quotesApi.getAll({
        page,
        limit: 20,
        search: search || undefined,
        status: statusFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setQuotes(response.data);
      setTotal(response.meta?.total || 0);
      setTotalPages(response.meta?.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('quotes:toast.loadError'));
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, startDate, endDate, t]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
    setPage(1);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
    setPage(1);
  };

  const handleSend = async (quote: Quote) => {
    try {
      await quotesApi.send(quote.id);
      showToast('success', t('quotes:toast.sent'));
      fetchQuotes();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('quotes:toast.operationFailed'));
    }
  };

  const handleAccept = async (quote: Quote) => {
    try {
      await quotesApi.accept(quote.id);
      showToast('success', t('quotes:toast.accepted'));
      fetchQuotes();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('quotes:toast.operationFailed'));
    }
  };

  const handleReject = async (quote: Quote) => {
    const confirmed = await confirm({ message: t('quotes:confirm.rejectMessage'), variant: 'warning' });
    if (!confirmed) return;
    try {
      await quotesApi.reject(quote.id);
      showToast('success', t('quotes:toast.rejected'));
      fetchQuotes();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('quotes:toast.operationFailed'));
    }
  };

  const handleConvert = async (quote: Quote) => {
    const confirmed = await confirm({ message: t('quotes:confirm.convertMessage'), variant: 'warning' });
    if (!confirmed) return;
    try {
      await quotesApi.convertToSale(quote.id, { payment_method: 'nakit' });
      showToast('success', t('quotes:toast.converted'));
      fetchQuotes();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('quotes:toast.operationFailed'));
    }
  };

  const handleDelete = async (quote: Quote) => {
    const confirmed = await confirm({ message: t('quotes:confirm.deleteMessage', { number: quote.quote_number }), variant: 'danger' });
    if (!confirmed) return;
    try {
      await quotesApi.delete(quote.id);
      showToast('success', t('quotes:toast.deleted'));
      fetchQuotes();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('quotes:toast.deleteFailed'));
    }
  };

  const getValidUntilClass = (validUntil: string, status: string) => {
    if (['converted', 'rejected', 'expired'].includes(status)) return '';
    const date = new Date(validUntil);
    const today = new Date();
    const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return styles.expired;
    if (diffDays <= 3) return styles.warning;
    return '';
  };

  const columns: Column<Quote>[] = [
    {
      key: 'quote_number',
      header: t('quotes:columns.quote'),
      render: (q) => (
        <div className={styles.quoteInfo} onClick={() => navigate(`/quotes/${q.id}`)} style={{ cursor: 'pointer' }}>
          <span className={styles.quoteNumber}>{q.quote_number}</span>
          {q.customer_name && (
            <span
              className={`${styles.customerName} ${q.customer_id ? styles.customerLink : ''}`}
              onClick={(e) => { if (q.customer_id) { e.stopPropagation(); navigate(`/customers/${q.customer_id}`); } }}
            >
              {q.customer_name}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'quote_date',
      header: t('quotes:columns.date'),
      render: (q) => formatDate(q.quote_date),
    },
    {
      key: 'valid_until',
      header: t('quotes:columns.validity'),
      render: (q) => (
        <span className={`${styles.validUntil} ${getValidUntilClass(q.valid_until, q.status)}`}>
          {formatDate(q.valid_until)}
        </span>
      ),
    },
    {
      key: 'grand_total',
      header: t('quotes:columns.total'),
      align: 'right',
      render: (q) => <span className={styles.total}>{formatCurrency(q.grand_total)}</span>,
    },
    {
      key: 'status',
      header: t('quotes:columns.status'),
      render: (q) => (
        <Badge variant={
          q.status === 'converted' ? 'success' :
          q.status === 'accepted' ? 'success' :
          q.status === 'rejected' ? 'danger' :
          q.status === 'expired' ? 'warning' :
          q.status === 'sent' ? 'info' : 'default'
        }>
          {t(`quotes:statuses.${q.status}`, { defaultValue: q.status })}
        </Badge>
      ),
    },
    {
      key: 'created_by_name',
      header: t('quotes:columns.createdBy'),
      render: (q) => q.created_by_name || '-',
    },
    {
      key: 'actions',
      header: '',
      width: '230px',
      render: (q) => (
        <div className={styles.actions}>
          {q.status === 'draft' && (
            <Button size="xs" variant="secondary" onClick={() => handleSend(q)}>{t('quotes:actions.send')}</Button>
          )}
          {['draft', 'sent'].includes(q.status) && (
            <>
              <Button size="xs" variant="secondary" onClick={() => handleAccept(q)}>{t('quotes:actions.accept')}</Button>
              <Button size="xs" variant="secondary" onClick={() => handleReject(q)}>{t('quotes:actions.reject')}</Button>
            </>
          )}
          {['draft', 'sent', 'accepted'].includes(q.status) && (
            <Button size="xs" variant="secondary" onClick={() => handleConvert(q)}>{t('quotes:actions.convertShort')}</Button>
          )}
          {q.status !== 'converted' && (
            <Button size="xs" variant="danger" onClick={() => handleDelete(q)}>{t('quotes:actions.delete')}</Button>
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
            <span className={styles.titleIcon}>{icons.quotes}</span>
            {t('quotes:pageTitle')}
          </h1>
          <p className={styles.subtitle}>{t('quotes:totalQuotes', { count: total })}</p>
        </div>
        <Button onClick={() => navigate('/quotes/new')}>
          {t('quotes:newQuote')}
        </Button>
      </div>

      <div className={styles.card}>
        <div className={styles.toolbar}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <Input
              placeholder={t('quotes:searchPlaceholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Button type="submit" variant="secondary">{t('common:buttons.search')}</Button>
          </form>

          <div className={styles.filters}>
            <Select
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={handleStatusChange}
            />
            <Input type="date" value={startDate} onChange={handleStartDateChange} />
            <Input type="date" value={endDate} onChange={handleEndDateChange} />
          </div>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <Table
          columns={columns}
          data={quotes}
          keyExtractor={(q) => q.id}
          loading={loading}
          emptyMessage={t('quotes:emptyMessage')}
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
    </div>
  );
}
