import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Table, Button, Badge, Input, Select, Pagination, type Column } from '@stok/ui';
import { apiClient } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import styles from './ReturnListPage.module.css';

const icons = {
  returns: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 14 4 9 9 4" />
      <path d="M20 20v-7a4 4 0 0 0-4-4H4" />
    </svg>
  ),
};

interface Return {
  id: string;
  return_number: string;
  customer_id?: string;
  customer_name?: string;
  return_date: string;
  total_amount: number;
  reason: string | null;
  status: string;
  created_by_name?: string | null;
}

export function ReturnListPage() {
  const { t } = useTranslation(['returns', 'common']);
  const navigate = useNavigate();
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = { page, limit: 20 };
        if (statusFilter) params.status = statusFilter;
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        const response = await apiClient.get<Return[]>('/returns', params);
        setReturns(response.data);
        setTotalPages(response.meta?.totalPages || 1);
        setTotal(response.meta?.total || 0);
      } catch {
        showToast('error', t('returns:toast.loadError'));
      }
      setLoading(false);
    })();
  }, [page, statusFilter, startDate, endDate]);

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

  const columns: Column<Return>[] = [
    {
      key: 'return_number',
      header: t('returns:columns.returnNumber'),
      render: (r) => (
        <Link to={`/returns/${r.id}`} className={styles.returnNumber}>
          {r.return_number}
        </Link>
      )
    },
    {
      key: 'customer_name',
      header: t('returns:columns.customer'),
      render: (r) => r.customer_id ? (
        <button className={styles.customerLink} onClick={(e) => { e.stopPropagation(); navigate(`/customers/${r.customer_id}`); }}>
          {r.customer_name}
        </button>
      ) : (r.customer_name || '-')
    },
    { key: 'return_date', header: t('returns:columns.date'), render: (r) => formatDateTime(r.return_date) },
    {
      key: 'total_amount',
      header: t('returns:columns.total'),
      align: 'right',
      render: (r) => <span className={styles.total}>{formatCurrency(r.total_amount)}</span>
    },
    { key: 'reason', header: t('returns:columns.reason'), render: (r) => r.reason || '-' },
    { key: 'created_by_name', header: t('returns:columns.createdBy'), render: (r) => r.created_by_name || '-' },
    {
      key: 'status',
      header: t('returns:columns.status'),
      render: (r) => <Badge variant="success">{r.status}</Badge>
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>{icons.returns}</span>
            {t('returns:title')}
          </h1>
          <p className={styles.subtitle}>{t('returns:subtitle', { total })}</p>
        </div>
        <Button onClick={() => navigate('/returns/new')}>
          {t('returns:newReturn')}
        </Button>
      </div>

      <div className={styles.card}>
        <div className={styles.toolbar}>
          <Select
            options={[
              { value: '', label: t('returns:filters.allStatuses') },
              { value: 'completed', label: t('returns:filters.completed') },
              { value: 'pending', label: t('returns:filters.pending') },
              { value: 'cancelled', label: t('returns:filters.cancelled') },
            ]}
            value={statusFilter}
            onChange={handleStatusChange}
          />
          <div className={styles.dateFilters}>
            <Input type="date" value={startDate} onChange={handleStartDateChange} />
            <Input type="date" value={endDate} onChange={handleEndDateChange} />
          </div>
        </div>
        <Table
          columns={columns}
          data={returns}
          keyExtractor={(r) => r.id}
          loading={loading}
          emptyMessage={t('returns:emptyMessage')}
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
