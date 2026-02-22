import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Table, Button, Badge, Input, Pagination, type Column } from '@stok/ui';
import { salesApi, Sale } from '../../api/sales.api';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import styles from './SaleListPage.module.css';

const icons = {
  sales: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  ),
  total: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  count: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  completed: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  cancelled: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
};

type VatFilter = 'all' | 'with_vat' | 'without_vat';
type InvoiceFilter = 'all' | 'issued' | 'not_issued';
type SaleTypeFilter = 'all' | 'retail' | 'wholesale';

export function SaleListPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(['sales', 'common']);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ total: 0, count: 0, completed: 0, cancelled: 0, noVatCount: 0 });
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [vatFilter, setVatFilter] = useState<VatFilter>('all');
  const [invoiceFilter, setInvoiceFilter] = useState<InvoiceFilter>('all');
  const [saleTypeFilter, setSaleTypeFilter] = useState<SaleTypeFilter>('all');
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();

  const fetchSales = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (vatFilter === 'with_vat') params.includeVat = 'true';
      if (vatFilter === 'without_vat') params.includeVat = 'false';
      if (invoiceFilter === 'issued') params.invoiceIssued = 'true';
      if (invoiceFilter === 'not_issued') params.invoiceIssued = 'false';
      if (saleTypeFilter !== 'all') params.saleType = saleTypeFilter;

      const response = await salesApi.getAll(params);
      setSales(response.data);
      setTotalPages(response.meta?.totalPages || 1);

      // Calculate stats
      const allSales = response.data;
      setStats({
        total: allSales.reduce((sum, s) => sum + parseFloat(String(s.grand_total) || '0'), 0),
        count: response.meta?.total || allSales.length,
        completed: allSales.filter(s => s.status === 'completed').length,
        cancelled: allSales.filter(s => s.status === 'cancelled').length,
        noVatCount: allSales.filter(s => !s.include_vat).length,
      });
    } catch (err) {
      showToast('error', t('sales:toast.loadError'));
    }
    setLoading(false);
  };

  useEffect(() => { fetchSales(); }, [page, search, startDate, endDate, vatFilter, invoiceFilter, saleTypeFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
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

  const handleVatFilterChange = (filter: VatFilter) => {
    setVatFilter(filter);
    setPage(1);
  };

  const handleInvoiceFilterChange = (filter: InvoiceFilter) => {
    setInvoiceFilter(filter);
    setPage(1);
  };

  const handleSaleTypeFilterChange = (filter: SaleTypeFilter) => {
    setSaleTypeFilter(filter);
    setPage(1);
  };

  const handleToggleInvoice = async (sale: Sale) => {
    try {
      await salesApi.updateInvoiceIssued(sale.id, !sale.invoice_issued);
      showToast('success', sale.invoice_issued ? t('sales:toast.invoiceRemoved') : t('sales:toast.invoiceMarked'));
      fetchSales();
    } catch (err) {
      showToast('error', t('sales:toast.invoiceUpdateError'));
    }
  };

  const handleCancel = async (sale: Sale) => {
    const confirmed = await confirm({ message: t('sales:confirm.cancelSale', { invoiceNumber: sale.invoice_number }), variant: 'danger' });
    if (!confirmed) return;
    try {
      await salesApi.cancel(sale.id);
      showToast('success', t('sales:toast.cancelSuccess'));
      fetchSales();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('sales:toast.cancelError'));
    }
  };

  const columns: Column<Sale>[] = [
    {
      key: 'invoice_number',
      header: t('sales:list.columns.invoiceNo'),
      render: (s) => (
        <button className={styles.invoiceLink} onClick={() => navigate(`/sales/${s.id}`)}>
          {s.invoice_number}
        </button>
      )
    },
    { key: 'customer_name', header: t('sales:list.columns.customer'), render: (s) => s.customer_name || t('common:saleTypes.retail') },
    {
      key: 'sale_type',
      header: t('sales:list.columns.type'),
      render: (s) => t(`common:saleTypes.${s.sale_type === 'wholesale' ? 'wholesale' : 'retail'}`)
    },
    { key: 'sale_date', header: t('sales:list.columns.date'), render: (s) => formatDateTime(s.sale_date) },
    {
      key: 'grand_total',
      header: t('sales:list.columns.total'),
      align: 'right',
      render: (s) => <span className={styles.total}>{formatCurrency(s.grand_total)}</span>
    },
    {
      key: 'payment_method',
      header: t('sales:list.columns.payment'),
      render: (s) => t(`common:paymentMethods.${s.payment_method}`, { defaultValue: s.payment_method })
    },
    {
      key: 'created_by_name',
      header: t('sales:list.columns.createdBy'),
      render: (s) => s.created_by_name || '-'
    },
    {
      key: 'invoice_issued',
      header: t('sales:list.columns.invoice'),
      render: (s) => (
        <button
          className={`${styles.invoiceToggle} ${s.invoice_issued ? styles.invoiceIssued : styles.invoiceNotIssued}`}
          onClick={(e) => { e.stopPropagation(); handleToggleInvoice(s); }}
          title={s.invoice_issued ? t('sales:list.invoiceToggle.issuedTooltip') : t('sales:list.invoiceToggle.notIssuedTooltip')}
        >
          {s.invoice_issued ? t('sales:list.invoiceToggle.issued') : t('sales:list.invoiceToggle.notIssued')}
        </button>
      )
    },
    {
      key: 'include_vat',
      header: t('sales:list.columns.vat'),
      render: (s) => s.include_vat ? t('sales:list.vatIncluded') : <span className={styles.noVatBadge}>{t('sales:list.filters.noVat')}</span>
    },
    {
      key: 'status',
      header: t('sales:list.columns.status'),
      render: (s) => (
        <Badge variant={s.status === 'completed' ? 'success' : s.status === 'cancelled' ? 'danger' : 'warning'}>
          {t(`common:saleStatuses.${s.status}`, { defaultValue: s.status })}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: '',
      width: '80px',
      render: (s) => s.status === 'completed' && (
        <Button size="sm" variant="danger" onClick={() => handleCancel(s)}>{t('common:buttons.cancel')}</Button>
      )
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>{icons.sales}</span>
            {t('sales:list.title')}
          </h1>
          <p className={styles.subtitle}>{t('sales:list.subtitle')}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="secondary" onClick={() => navigate('/sales/import')}>
            {t('sales:list.uploadInvoice')}
          </Button>
          <Button onClick={() => navigate('/sales/new')}>
            {t('sales:list.newSale')}
          </Button>
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.primary}`}>{icons.total}</div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{formatCurrency(stats.total)}</span>
            <span className={styles.statLabel}>{t('sales:list.stats.totalRevenue')}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.success}`}>{icons.count}</div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.count}</span>
            <span className={styles.statLabel}>{t('sales:list.stats.totalSales')}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.success}`}>{icons.completed}</div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.completed}</span>
            <span className={styles.statLabel}>{t('sales:list.stats.completed')}</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.danger}`}>{icons.cancelled}</div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.cancelled}</span>
            <span className={styles.statLabel}>{t('sales:list.stats.cancelled')}</span>
          </div>
        </div>
      </div>

      <div className={styles.searchBar}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <Input
            placeholder={t('sales:list.searchPlaceholder')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Button type="submit" variant="secondary">{t('common:buttons.search')}</Button>
        </form>
        <div className={styles.dateFilters}>
          <Input type="date" value={startDate} onChange={handleStartDateChange} />
          <Input type="date" value={endDate} onChange={handleEndDateChange} />
        </div>
      </div>

      <div className={styles.filtersBar}>
        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>{t('sales:list.filters.vat')}</span>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${vatFilter === 'all' ? styles.tabActive : ''}`}
              onClick={() => handleVatFilterChange('all')}
            >
              {t('sales:list.filters.all')}
            </button>
            <button
              className={`${styles.tab} ${vatFilter === 'with_vat' ? styles.tabActive : ''}`}
              onClick={() => handleVatFilterChange('with_vat')}
            >
              {t('sales:list.filters.vatIncluded')}
            </button>
            <button
              className={`${styles.tab} ${vatFilter === 'without_vat' ? styles.tabActive : ''}`}
              onClick={() => handleVatFilterChange('without_vat')}
            >
              {t('sales:list.filters.noVat')}
              {stats.noVatCount > 0 && <span className={styles.tabBadge}>{stats.noVatCount}</span>}
            </button>
          </div>
        </div>

        <div className={styles.filterDivider} />

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>{t('sales:list.filters.type')}</span>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${saleTypeFilter === 'all' ? styles.tabActive : ''}`}
              onClick={() => handleSaleTypeFilterChange('all')}
            >
              {t('sales:list.filters.all')}
            </button>
            <button
              className={`${styles.tab} ${saleTypeFilter === 'retail' ? styles.tabActive : ''}`}
              onClick={() => handleSaleTypeFilterChange('retail')}
            >
              {t('common:saleTypes.retail')}
            </button>
            <button
              className={`${styles.tab} ${saleTypeFilter === 'wholesale' ? styles.tabActive : ''}`}
              onClick={() => handleSaleTypeFilterChange('wholesale')}
            >
              {t('common:saleTypes.wholesale')}
            </button>
          </div>
        </div>

        <div className={styles.filterDivider} />

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>{t('sales:list.filters.invoice')}</span>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${invoiceFilter === 'all' ? styles.tabActive : ''}`}
              onClick={() => handleInvoiceFilterChange('all')}
            >
              {t('sales:list.filters.all')}
            </button>
            <button
              className={`${styles.tab} ${invoiceFilter === 'issued' ? styles.tabActive : ''}`}
              onClick={() => handleInvoiceFilterChange('issued')}
            >
              {t('sales:list.filters.issued')}
            </button>
            <button
              className={`${styles.tab} ${invoiceFilter === 'not_issued' ? styles.tabActive : ''}`}
              onClick={() => handleInvoiceFilterChange('not_issued')}
            >
              {t('sales:list.filters.notIssued')}
            </button>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <Table
          columns={columns}
          data={sales}
          keyExtractor={(s) => s.id}
          loading={loading}
          emptyMessage={t('sales:list.emptyMessage')}
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
