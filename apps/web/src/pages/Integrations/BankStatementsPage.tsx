import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Input, Select, Table, Badge, type Column } from '@stok/ui';
import { BankStatement, integrationsApi, Integration } from '../../api/integrations.api';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './BankStatementsPage.module.css';

export function BankStatementsPage() {
  const { t } = useTranslation(['integrations', 'common']);
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();

  const [statements, setStatements] = useState<BankStatement[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [integrationId, setIntegrationId] = useState('');
  const [matchStatus, setMatchStatus] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [statementsRes, integrationsRes] = await Promise.all([
        integrationsApi.getBankStatements({
          page,
          limit: 50,
          integrationId: integrationId || undefined,
          matchStatus: matchStatus || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
        integrationsApi.getIntegrations('bank'),
      ]);
      setStatements(statementsRes.data);
      setIntegrations(integrationsRes.data);
      if (statementsRes.meta) {
        setTotalPages(statementsRes.meta.totalPages);
      }
    } catch (err) {
      showToast('error', t('bankStatements.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page]);

  const handleFilter = () => {
    setPage(1);
    loadData();
  };

  const handleReset = () => {
    setIntegrationId('');
    setMatchStatus('');
    setStartDate('');
    setEndDate('');
    setPage(1);
    setTimeout(loadData, 0);
  };

  const handleIgnore = async (statement: BankStatement) => {
    const confirmed = await confirm({ message: t('bankStatements.confirm.ignoreMessage'), variant: 'warning' });
    if (!confirmed) return;
    try {
      await integrationsApi.ignoreBankStatement(statement.id);
      showToast('success', t('bankStatements.toast.ignored'));
      loadData();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('bankStatements.toast.operationFailed'));
    }
  };

  const columns: Column<BankStatement>[] = [
    {
      key: 'transaction_date',
      header: t('bankStatements.columns.date'),
      width: '10%',
      render: (s) => formatDate(s.transaction_date),
    },
    {
      key: 'integration_name',
      header: t('bankStatements.columns.bank'),
      width: '12%',
      render: (s) => s.integration_name || '-',
    },
    {
      key: 'description',
      header: t('bankStatements.columns.description'),
      width: '25%',
      render: (s) => (
        <span className={styles.description} title={s.description || ''}>
          {s.description || '-'}
        </span>
      ),
    },
    {
      key: 'type',
      header: t('bankStatements.columns.type'),
      width: '8%',
      render: (s) => (
        <Badge variant={s.type === 'credit' ? 'success' : 'danger'}>
          {t(`bankStatements.transactionTypes.${s.type}`)}
        </Badge>
      ),
    },
    {
      key: 'amount',
      header: t('bankStatements.columns.amount'),
      align: 'right',
      width: '12%',
      render: (s) => (
        <span className={s.type === 'credit' ? styles.positive : styles.negative}>
          {s.type === 'credit' ? '+' : '-'}{formatCurrency(s.amount)}
        </span>
      ),
    },
    {
      key: 'balance',
      header: t('bankStatements.columns.balance'),
      align: 'right',
      width: '12%',
      render: (s) => s.balance ? formatCurrency(s.balance) : '-',
    },
    {
      key: 'match_status',
      header: t('bankStatements.columns.matching'),
      width: '10%',
      render: (s) => (
        <Badge variant={
          s.match_status === 'matched' ? 'success' :
          s.match_status === 'ignored' ? 'default' : 'warning'
        }>
          {t(`bankStatements.matchStatuses.${s.match_status}`)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '11%',
      render: (s) => (
        <div className={styles.actions}>
          {s.match_status === 'unmatched' && (
            <>
              <Button size="sm" variant="ghost" onClick={() => showToast('info', t('bankStatements.actions.matchFeatureComingSoon'))}>
                {t('bankStatements.actions.match')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleIgnore(s)}>
                {t('bankStatements.actions.ignore')}
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const unmatchedCount = statements.filter(s => s.match_status === 'unmatched').length;
  const totalCredits = statements.filter(s => s.type === 'credit').reduce((sum, s) => sum + s.amount, 0);
  const totalDebits = statements.filter(s => s.type === 'debit').reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('bankStatements.pageTitle')}</h1>
          <p className={styles.subtitle}>{t('bankStatements.subtitle')}</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <span className={styles.statValue}>{statements.length}</span>
          <span className={styles.statLabel}>{t('bankStatements.stats.totalTransactions')}</span>
        </Card>
        <Card className={`${styles.statCard} ${styles.warning}`}>
          <span className={styles.statValue}>{unmatchedCount}</span>
          <span className={styles.statLabel}>{t('bankStatements.stats.unmatched')}</span>
        </Card>
        <Card className={`${styles.statCard} ${styles.success}`}>
          <span className={styles.statValue}>{formatCurrency(totalCredits)}</span>
          <span className={styles.statLabel}>{t('bankStatements.stats.totalCredits')}</span>
        </Card>
        <Card className={`${styles.statCard} ${styles.danger}`}>
          <span className={styles.statValue}>{formatCurrency(totalDebits)}</span>
          <span className={styles.statLabel}>{t('bankStatements.stats.totalDebits')}</span>
        </Card>
      </div>

      <Card className={styles.filtersCard}>
        <div className={styles.filtersGrid}>
          <div className={styles.filterGroup}>
            <label className={styles.label}>{t('bankStatements.filters.bank')}</label>
            <Select
              value={integrationId}
              onChange={(e) => setIntegrationId(e.target.value)}
              options={[
                { value: '', label: t('bankStatements.filters.allBanks') },
                ...integrations.map(i => ({ value: i.id, label: i.name })),
              ]}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.label}>{t('bankStatements.filters.matchStatus')}</label>
            <Select
              value={matchStatus}
              onChange={(e) => setMatchStatus(e.target.value)}
              options={[
                { value: '', label: t('bankStatements.filters.allStatuses') },
                { value: 'unmatched', label: t('bankStatements.matchStatuses.unmatched') },
                { value: 'matched', label: t('bankStatements.matchStatuses.matched') },
                { value: 'ignored', label: t('bankStatements.matchStatuses.ignored') },
              ]}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.label}>{t('bankStatements.filters.startDate')}</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.label}>{t('bankStatements.filters.endDate')}</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className={styles.filterActions}>
            <Button onClick={handleFilter}>{t('bankStatements.filters.filter')}</Button>
            <Button variant="ghost" onClick={handleReset}>{t('bankStatements.filters.reset')}</Button>
          </div>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          data={statements}
          keyExtractor={(s) => s.id}
          loading={loading}
          emptyMessage={t('bankStatements.emptyMessage')}
        />

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>
              {t('bankStatements.pagination.previous')}
            </Button>
            <span>{t('bankStatements.pagination.pageOf', { page, totalPages })}</span>
            <Button size="sm" variant="secondary" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              {t('bankStatements.pagination.next')}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
