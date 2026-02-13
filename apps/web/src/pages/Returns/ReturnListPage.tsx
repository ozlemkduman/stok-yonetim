import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Table, Button, Badge, Pagination, type Column } from '@stok/ui';
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
  customer_name?: string;
  return_date: string;
  total_amount: number;
  reason: string | null;
  status: string;
}

export function ReturnListPage() {
  const navigate = useNavigate();
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const { showToast } = useToast();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const response = await apiClient.get<Return[]>('/returns', { page, limit: 20 });
        setReturns(response.data);
        setTotalPages(response.meta?.totalPages || 1);
        setTotal(response.meta?.total || 0);
      } catch {
        showToast('error', 'Iadeler yuklenemedi');
      }
      setLoading(false);
    })();
  }, [page]);

  const columns: Column<Return>[] = [
    {
      key: 'return_number',
      header: 'Iade No',
      render: (r) => (
        <Link to={`/returns/${r.id}`} className={styles.returnNumber}>
          {r.return_number}
        </Link>
      )
    },
    { key: 'customer_name', header: 'Musteri', render: (r) => r.customer_name || '-' },
    { key: 'return_date', header: 'Tarih', render: (r) => formatDateTime(r.return_date) },
    {
      key: 'total_amount',
      header: 'Toplam',
      align: 'right',
      render: (r) => <span className={styles.total}>{formatCurrency(r.total_amount)}</span>
    },
    { key: 'reason', header: 'Neden', render: (r) => r.reason || '-' },
    {
      key: 'status',
      header: 'Durum',
      render: (r) => <Badge variant="success">{r.status}</Badge>
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>{icons.returns}</span>
            Iadeler
          </h1>
          <p className={styles.subtitle}>Toplam {total} iade kaydi</p>
        </div>
        <Button onClick={() => navigate('/returns/new')}>
          + Yeni Iade
        </Button>
      </div>

      <div className={styles.card}>
        <Table
          columns={columns}
          data={returns}
          keyExtractor={(r) => r.id}
          loading={loading}
          emptyMessage="Iade bulunamadi"
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
