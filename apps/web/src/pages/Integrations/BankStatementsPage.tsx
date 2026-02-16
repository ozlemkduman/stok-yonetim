import { useState, useEffect } from 'react';
import { Button, Card, Input, Select, Table, Badge, type Column } from '@stok/ui';
import { BankStatement, integrationsApi, Integration } from '../../api/integrations.api';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './BankStatementsPage.module.css';

const MATCH_STATUS_LABELS: Record<string, string> = {
  unmatched: 'Eslesmemis',
  matched: 'Eslesmis',
  ignored: 'Yoksayildi',
};

export function BankStatementsPage() {
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
      showToast('error', 'Ekstreler yuklenirken hata olustu');
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
    const confirmed = await confirm({ message: 'Bu hareketi yoksaymak istediginize emin misiniz?', variant: 'warning' });
    if (!confirmed) return;
    try {
      await integrationsApi.ignoreBankStatement(statement.id);
      showToast('success', 'Hareket yoksayildi');
      loadData();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Islem basarisiz');
    }
  };

  const columns: Column<BankStatement>[] = [
    {
      key: 'transaction_date',
      header: 'Tarih',
      width: '10%',
      render: (s) => formatDate(s.transaction_date),
    },
    {
      key: 'integration_name',
      header: 'Banka',
      width: '12%',
      render: (s) => s.integration_name || '-',
    },
    {
      key: 'description',
      header: 'Aciklama',
      width: '25%',
      render: (s) => (
        <span className={styles.description} title={s.description || ''}>
          {s.description || '-'}
        </span>
      ),
    },
    {
      key: 'type',
      header: 'Tip',
      width: '8%',
      render: (s) => (
        <Badge variant={s.type === 'credit' ? 'success' : 'danger'}>
          {s.type === 'credit' ? 'Giris' : 'Cikis'}
        </Badge>
      ),
    },
    {
      key: 'amount',
      header: 'Tutar',
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
      header: 'Bakiye',
      align: 'right',
      width: '12%',
      render: (s) => s.balance ? formatCurrency(s.balance) : '-',
    },
    {
      key: 'match_status',
      header: 'Esleme',
      width: '10%',
      render: (s) => (
        <Badge variant={
          s.match_status === 'matched' ? 'success' :
          s.match_status === 'ignored' ? 'default' : 'warning'
        }>
          {MATCH_STATUS_LABELS[s.match_status] || s.match_status}
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
              <Button size="sm" variant="ghost" onClick={() => showToast('info', 'Esleme ozelligi yakin zamanda aktif olacaktir.')}>
                Esle
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleIgnore(s)}>
                Yoksay
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
          <h1 className={styles.title}>Banka Ekstreleri</h1>
          <p className={styles.subtitle}>Banka entegrasyonlarindan gelen hesap hareketleri</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <span className={styles.statValue}>{statements.length}</span>
          <span className={styles.statLabel}>Toplam Hareket</span>
        </Card>
        <Card className={`${styles.statCard} ${styles.warning}`}>
          <span className={styles.statValue}>{unmatchedCount}</span>
          <span className={styles.statLabel}>Eslesmemis</span>
        </Card>
        <Card className={`${styles.statCard} ${styles.success}`}>
          <span className={styles.statValue}>{formatCurrency(totalCredits)}</span>
          <span className={styles.statLabel}>Toplam Giris</span>
        </Card>
        <Card className={`${styles.statCard} ${styles.danger}`}>
          <span className={styles.statValue}>{formatCurrency(totalDebits)}</span>
          <span className={styles.statLabel}>Toplam Cikis</span>
        </Card>
      </div>

      <Card className={styles.filtersCard}>
        <div className={styles.filtersGrid}>
          <div className={styles.filterGroup}>
            <label className={styles.label}>Banka</label>
            <Select
              value={integrationId}
              onChange={(e) => setIntegrationId(e.target.value)}
              options={[
                { value: '', label: 'Tum Bankalar' },
                ...integrations.map(i => ({ value: i.id, label: i.name })),
              ]}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.label}>Esleme Durumu</label>
            <Select
              value={matchStatus}
              onChange={(e) => setMatchStatus(e.target.value)}
              options={[
                { value: '', label: 'Tum Durumlar' },
                { value: 'unmatched', label: 'Eslesmemis' },
                { value: 'matched', label: 'Eslesmis' },
                { value: 'ignored', label: 'Yoksayildi' },
              ]}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.label}>Baslangic</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.label}>Bitis</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className={styles.filterActions}>
            <Button onClick={handleFilter}>Filtrele</Button>
            <Button variant="ghost" onClick={handleReset}>Sifirla</Button>
          </div>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          data={statements}
          keyExtractor={(s) => s.id}
          loading={loading}
          emptyMessage="Ekstre bulunamadi"
        />

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>
              Onceki
            </Button>
            <span>Sayfa {page} / {totalPages}</span>
            <Button size="sm" variant="secondary" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
              Sonraki
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
