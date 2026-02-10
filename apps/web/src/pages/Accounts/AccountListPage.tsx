import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Badge, Pagination, type Column } from '@stok/ui';
import { Account, AccountSummary, CreateAccountData, CreateMovementData, CreateTransferData, accountsApi } from '../../api/accounts.api';
import { AccountFormModal } from './AccountFormModal';
import { MovementFormModal } from './MovementFormModal';
import { TransferFormModal } from './TransferFormModal';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import styles from './AccountListPage.module.css';

const icons = {
  accounts: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  kasa: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  banka: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  ),
  total: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
};

type TabType = 'all' | 'kasa' | 'banka';

export function AccountListPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const { showToast } = useToast();

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: { page: number; limit: number; accountType?: string; isActive: boolean } = {
        page,
        limit: 20,
        isActive: true,
      };

      if (activeTab !== 'all') {
        params.accountType = activeTab;
      }

      const response = await accountsApi.getAll(params);
      setAccounts(response.data);
      setTotal(response.meta?.total || 0);
      setTotalPages(response.meta?.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hesaplar yuklenirken hata olustu');
    } finally {
      setLoading(false);
    }
  }, [page, activeTab]);

  const fetchSummary = useCallback(async () => {
    try {
      const response = await accountsApi.getSummary();
      setSummary(response.data);
    } catch (err) {
      console.error('Summary fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleCreateAccount = () => {
    setEditingAccount(null);
    setIsAccountModalOpen(true);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setIsAccountModalOpen(true);
  };

  const handleAddMovement = (account: Account) => {
    setSelectedAccount(account);
    setIsMovementModalOpen(true);
  };

  const handleDeleteAccount = async (account: Account) => {
    if (!confirm(`"${account.name}" hesabini silmek istediginizden emin misiniz?`)) {
      return;
    }

    try {
      await accountsApi.delete(account.id);
      showToast('success', 'Hesap basariyla silindi');
      fetchAccounts();
      fetchSummary();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Silme islemi basarisiz');
    }
  };

  const handleAccountSubmit = async (data: CreateAccountData) => {
    if (editingAccount) {
      await accountsApi.update(editingAccount.id, data);
      showToast('success', 'Hesap basariyla guncellendi');
    } else {
      await accountsApi.create(data);
      showToast('success', 'Hesap basariyla eklendi');
    }
    fetchAccounts();
    fetchSummary();
  };

  const handleMovementSubmit = async (data: CreateMovementData) => {
    if (!selectedAccount) return;
    await accountsApi.addMovement(selectedAccount.id, data);
    showToast('success', 'Hareket basariyla eklendi');
    fetchAccounts();
    fetchSummary();
  };

  const handleTransferSubmit = async (data: CreateTransferData) => {
    await accountsApi.createTransfer(data);
    showToast('success', 'Transfer basariyla yapildi');
    fetchAccounts();
    fetchSummary();
  };

  const columns: Column<Account>[] = [
    {
      key: 'name',
      header: 'Hesap',
      render: (account) => (
        <div className={styles.accountInfo}>
          <span className={styles.accountName}>{account.name}</span>
          {account.account_type === 'banka' && account.bank_name && (
            <span className={styles.accountDetails}>
              {account.bank_name} {account.branch_name ? `- ${account.branch_name}` : ''}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'account_type',
      header: 'Tur',
      render: (account) => (
        <Badge variant={account.account_type === 'kasa' ? 'primary' : 'info'}>
          {account.account_type === 'kasa' ? 'Kasa' : 'Banka'}
        </Badge>
      ),
    },
    {
      key: 'current_balance',
      header: 'Guncel Bakiye',
      align: 'right',
      render: (account) => (
        <span className={`${styles.balance} ${Number(account.current_balance) >= 0 ? styles.positive : styles.negative}`}>
          {formatCurrency(account.current_balance)}
        </span>
      ),
    },
    {
      key: 'is_default',
      header: 'Varsayilan',
      render: (account) => (
        account.is_default ? <Badge variant="success">Varsayilan</Badge> : null
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '200px',
      render: (account) => (
        <div className={styles.actions}>
          <Button size="sm" variant="ghost" onClick={() => handleAddMovement(account)}>
            Hareket
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleEditAccount(account)}>
            Duzenle
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleDeleteAccount(account)}>
            Sil
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>{icons.accounts}</span>
            Kasa / Banka Hesaplari
          </h1>
          <p className={styles.subtitle}>Toplam {total} hesap</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="secondary" onClick={() => setIsTransferModalOpen(true)}>
            Transfer
          </Button>
          <Button onClick={handleCreateAccount}>+ Yeni Hesap</Button>
        </div>
      </div>

      {summary && (
        <div className={styles.summaryCards}>
          <div className={styles.summaryCard}>
            <div className={`${styles.summaryIcon} ${styles.kasa}`}>{icons.kasa}</div>
            <div className={styles.summaryContent}>
              <p className={styles.summaryLabel}>Toplam Kasa</p>
              <p className={`${styles.summaryValue} ${styles.kasa}`}>
                {formatCurrency(summary.totalKasa)}
              </p>
            </div>
          </div>
          <div className={styles.summaryCard}>
            <div className={`${styles.summaryIcon} ${styles.banka}`}>{icons.banka}</div>
            <div className={styles.summaryContent}>
              <p className={styles.summaryLabel}>Toplam Banka</p>
              <p className={`${styles.summaryValue} ${styles.banka}`}>
                {formatCurrency(summary.totalBanka)}
              </p>
            </div>
          </div>
          <div className={styles.summaryCard}>
            <div className={`${styles.summaryIcon} ${styles.total}`}>{icons.total}</div>
            <div className={styles.summaryContent}>
              <p className={styles.summaryLabel}>Genel Toplam</p>
              <p className={`${styles.summaryValue} ${styles.total}`}>
                {formatCurrency(summary.totalBalance)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={styles.card}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
            onClick={() => handleTabChange('all')}
          >
            Tumu
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'kasa' ? styles.active : ''}`}
            onClick={() => handleTabChange('kasa')}
          >
            Kasalar
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'banka' ? styles.active : ''}`}
            onClick={() => handleTabChange('banka')}
          >
            Banka Hesaplari
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <Table
          columns={columns}
          data={accounts}
          keyExtractor={(account) => account.id}
          loading={loading}
          emptyMessage="Hesap bulunamadi"
          onRowClick={handleEditAccount}
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

      <AccountFormModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSubmit={handleAccountSubmit}
        account={editingAccount}
      />

      <MovementFormModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        onSubmit={handleMovementSubmit}
        accountName={selectedAccount?.name || ''}
      />

      <TransferFormModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSubmit={handleTransferSubmit}
      />
    </div>
  );
}
