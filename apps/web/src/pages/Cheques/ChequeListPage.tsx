import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Table, Button, Input, Badge, Pagination, type Column } from '@stok/ui';
import { chequesApi, Cheque, ChequesStats } from '../../api/cheques.api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './ChequeListPage.module.css';

type DirectionFilter = 'all' | 'incoming' | 'outgoing';
type StatusFilter = 'all' | 'in_portfolio' | 'collected' | 'cashed_out' | 'bounced' | 'returned' | 'overdue';

export function ChequeListPage() {
  const { t } = useTranslation(['cheques', 'common']);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [items, setItems] = useState<Cheque[]>([]);
  const [stats, setStats] = useState<ChequesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [direction, setDirection] = useState<DirectionFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');

  const fetch = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      if (direction !== 'all') params.direction = direction;
      if (status !== 'all' && status !== 'overdue') params.status = status;

      const [res, statsRes] = await Promise.all([
        chequesApi.getAll(params),
        chequesApi.getStats(),
      ]);

      let list = res.data;
      // overdue client-side filter: in_portfolio + due_date < today
      if (status === 'overdue') {
        const today = new Date().toISOString().split('T')[0];
        list = list.filter((c) => c.status === 'in_portfolio' && c.due_date < today);
      }

      setItems(list);
      setTotalPages(res.meta?.totalPages || 1);
      setStats(statsRes.data);
    } catch {
      showToast('error', t('cheques:toast.loadError'));
    }
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [page, search, direction, status]);

  const columns: Column<Cheque>[] = [
    {
      key: 'type',
      header: t('cheques:columns.type'),
      width: '80px',
      render: (c) => (
        <span>
          <Badge variant={c.direction === 'incoming' ? 'success' : 'warning'}>
            {t(`cheques:direction.${c.direction}`)}
          </Badge>
          <span className={styles.typeBadge}>{t(`cheques:types.${c.type}`)}</span>
        </span>
      ),
    },
    { key: 'cheque_number', header: t('cheques:columns.number'), render: (c) => c.cheque_number || '-' },
    {
      key: 'party',
      header: t('cheques:columns.party'),
      render: (c) => c.customer_name || c.supplier_name || '-',
    },
    { key: 'bank_name', header: t('cheques:columns.bank'), render: (c) => c.bank_name || '-' },
    {
      key: 'amount',
      header: t('cheques:columns.amount'),
      align: 'right',
      render: (c) => <strong>{formatCurrency(Number(c.amount))}</strong>,
    },
    {
      key: 'due_date',
      header: t('cheques:columns.dueDate'),
      render: (c) => {
        const today = new Date().toISOString().split('T')[0];
        const overdue = c.status === 'in_portfolio' && c.due_date < today;
        return <span className={overdue ? styles.overdue : ''}>{formatDate(c.due_date)}</span>;
      },
    },
    {
      key: 'status',
      header: t('cheques:columns.status'),
      render: (c) => {
        const variant =
          c.status === 'collected' || c.status === 'cashed_out' ? 'success' :
          c.status === 'bounced' ? 'danger' :
          c.status === 'returned' ? 'default' : 'warning';
        return <Badge variant={variant}>{t(`cheques:statuses.${c.status}`)}</Badge>;
      },
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('cheques:pageTitle')}</h1>
          <p className={styles.subtitle}>{t('cheques:subtitle')}</p>
        </div>
        <Button onClick={() => navigate('/cheques/new')}>{t('cheques:newCheque')}</Button>
      </div>

      {stats && (
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('cheques:stats.incomingPortfolio')}</div>
            <div className={styles.statValue}>{formatCurrency(stats.incomingPortfolio.total)}</div>
            <div className={styles.statHint}>{stats.incomingPortfolio.count} {t('cheques:stats.count')}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('cheques:stats.outgoingPortfolio')}</div>
            <div className={styles.statValue}>{formatCurrency(stats.outgoingPortfolio.total)}</div>
            <div className={styles.statHint}>{stats.outgoingPortfolio.count} {t('cheques:stats.count')}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('cheques:stats.overdue')}</div>
            <div className={`${styles.statValue} ${stats.overdueCount > 0 ? styles.statDanger : ''}`}>{stats.overdueCount}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>{t('cheques:stats.bounced')}</div>
            <div className={`${styles.statValue} ${stats.bouncedCount > 0 ? styles.statDanger : ''}`}>{stats.bouncedCount}</div>
          </div>
        </div>
      )}

      <div className={styles.filters}>
        <Input
          placeholder={t('cheques:searchPlaceholder')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <div className={styles.tabs}>
          {(['all', 'incoming', 'outgoing'] as DirectionFilter[]).map((d) => (
            <button
              key={d}
              className={`${styles.tab} ${direction === d ? styles.tabActive : ''}`}
              onClick={() => { setDirection(d); setPage(1); }}
            >
              {t(`cheques:filters.direction.${d}`)}
            </button>
          ))}
        </div>
        <div className={styles.tabs}>
          {(['all', 'in_portfolio', 'overdue', 'collected', 'cashed_out', 'bounced'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              className={`${styles.tab} ${status === s ? styles.tabActive : ''}`}
              onClick={() => { setStatus(s); setPage(1); }}
            >
              {t(`cheques:filters.status.${s}`)}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.card}>
        <Table
          columns={columns}
          data={items}
          keyExtractor={(c) => c.id}
          loading={loading}
          emptyMessage={t('cheques:empty')}
          onRowClick={(c) => navigate(`/cheques/${c.id}`)}
        />
        {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
      </div>
    </div>
  );
}
