import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Badge, Card } from '@stok/ui';
import { accountsApi, AccountDetail, AccountMovement, AccountTransfer } from '../../api/accounts.api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './AccountDetailPage.module.css';

type TabType = 'movements' | 'transfers';

export function AccountDetailPage() {
  const { t } = useTranslation(['accounts', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<AccountDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('movements');

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await accountsApi.getDetail(id);
        setData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('accounts:detail.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, t]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>{t('accounts:detail.loading')}</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>{error || t('accounts:detail.notFound')}</div>
        <Button onClick={() => navigate('/accounts')}>{t('accounts:detail.backButton')}</Button>
      </div>
    );
  }

  const { account, movements, transfers, stats } = data;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Button variant="ghost" onClick={() => navigate('/accounts')}>
            {t('accounts:detail.back')}
          </Button>
          <h1 className={styles.title}>{account.name}</h1>
          <div className={styles.accountMeta}>
            <Badge variant={account.account_type === 'kasa' ? 'warning' : 'info'}>
              {t(`accounts:accountTypes.${account.account_type}`)}
            </Badge>
            {account.bank_name && <span>{account.bank_name}</span>}
            {account.is_default && <Badge variant="success">{t('accounts:badges.default')}</Badge>}
            <Badge variant={account.is_active ? 'success' : 'default'}>
              {account.is_active ? t('accounts:badges.active') : t('accounts:badges.inactive')}
            </Badge>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.balanceCard}>
            <span className={styles.balanceLabel}>{t('accounts:detail.currentBalance')}</span>
            <span className={`${styles.balanceValue} ${account.current_balance < 0 ? styles.negative : styles.positive}`}>
              {formatCurrency(account.current_balance)}
            </span>
            <span className={styles.balanceNote}>{account.currency}</span>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className={styles.infoGrid}>
        <Card className={styles.infoCard}>
          <h3>{t('accounts:detail.accountInfo')}</h3>
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('accounts:detail.accountType')}</span>
              <span className={styles.infoValue}>{t(`accounts:accountTypes.${account.account_type}`)}</span>
            </div>
            {account.bank_name && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('accounts:detail.bankName')}</span>
                <span className={styles.infoValue}>{account.bank_name}</span>
              </div>
            )}
            {account.branch_name && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('accounts:detail.branch')}</span>
                <span className={styles.infoValue}>{account.branch_name}</span>
              </div>
            )}
            {account.account_number && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('accounts:detail.accountNumber')}</span>
                <span className={styles.infoValue}>{account.account_number}</span>
              </div>
            )}
            {account.iban && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('accounts:detail.iban')}</span>
                <span className={styles.infoValue}>{account.iban}</span>
              </div>
            )}
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('accounts:detail.openingBalance')}</span>
              <span className={styles.infoValue}>{formatCurrency(account.opening_balance)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('accounts:detail.createdAt')}</span>
              <span className={styles.infoValue}>{formatDate(account.created_at)}</span>
            </div>
          </div>
        </Card>

        <Card className={styles.statsCard}>
          <h3>{t('accounts:detail.statistics')}</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.movementsCount}</span>
              <span className={styles.statLabel}>{t('accounts:detail.movementCount')}</span>
            </div>
            <div className={styles.statItem}>
              <span className={`${styles.statValue} ${styles.positive}`}>{formatCurrency(stats.totalIncome)}</span>
              <span className={styles.statLabel}>{t('accounts:detail.totalIncome')}</span>
            </div>
            <div className={styles.statItem}>
              <span className={`${styles.statValue} ${styles.negative}`}>{formatCurrency(stats.totalExpense)}</span>
              <span className={styles.statLabel}>{t('accounts:detail.totalExpense')}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.transfersCount}</span>
              <span className={styles.statLabel}>{t('accounts:detail.transferCount')}</span>
            </div>
            <div className={styles.statItem}>
              <span className={`${styles.statValue} ${styles.positive}`}>{formatCurrency(stats.totalTransferIn)}</span>
              <span className={styles.statLabel}>{t('accounts:detail.incomingTransfer')}</span>
            </div>
            <div className={styles.statItem}>
              <span className={`${styles.statValue} ${styles.negative}`}>{formatCurrency(stats.totalTransferOut)}</span>
              <span className={styles.statLabel}>{t('accounts:detail.outgoingTransfer')}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'movements' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('movements')}
          >
            {t('accounts:detail.movementsTab', { count: movements.length })}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'transfers' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('transfers')}
          >
            {t('accounts:detail.transfersTab', { count: transfers.length })}
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'movements' && (
            <MovementsTab movements={movements} t={t} />
          )}
          {activeTab === 'transfers' && (
            <TransfersTab transfers={transfers} accountId={account.id} t={t} />
          )}
        </div>
      </div>
    </div>
  );
}

function MovementsTab({ movements, t }: { movements: AccountMovement[]; t: (key: string) => string }) {
  if (movements.length === 0) {
    return <div className={styles.emptyState}>{t('accounts:empty.movements')}</div>;
  }

  const getMovementBadgeVariant = (type: string) => {
    switch (type) {
      case 'gelir':
      case 'transfer_in':
        return 'success';
      case 'gider':
      case 'transfer_out':
        return 'danger';
      default:
        return 'default';
    }
  };

  return (
    <div className={styles.movementsList}>
      <table className={styles.movementsTable}>
        <thead>
          <tr>
            <th>{t('accounts:columns.date')}</th>
            <th>{t('accounts:columns.movementType')}</th>
            <th>{t('accounts:columns.category')}</th>
            <th>{t('accounts:columns.description')}</th>
            <th>{t('accounts:columns.amount')}</th>
            <th>{t('accounts:columns.balance')}</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((movement) => (
            <tr key={movement.id}>
              <td>{formatDate(movement.movement_date)}</td>
              <td>
                <Badge variant={getMovementBadgeVariant(movement.movement_type)}>
                  {t(`accounts:movementTypes.${movement.movement_type}`)}
                </Badge>
              </td>
              <td>{movement.category || '-'}</td>
              <td>{movement.description || '-'}</td>
              <td className={movement.movement_type === 'gelir' || movement.movement_type === 'transfer_in' ? styles.amountPositive : styles.amountNegative}>
                {movement.movement_type === 'gelir' || movement.movement_type === 'transfer_in' ? '+' : '-'}
                {formatCurrency(movement.amount)}
              </td>
              <td className={styles.balanceCell}>{formatCurrency(movement.balance_after)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TransfersTab({ transfers, accountId, t }: { transfers: AccountTransfer[]; accountId: string; t: (key: string) => string }) {
  if (transfers.length === 0) {
    return <div className={styles.emptyState}>{t('accounts:empty.transfers')}</div>;
  }

  return (
    <div className={styles.transfersList}>
      <table className={styles.transfersTable}>
        <thead>
          <tr>
            <th>{t('accounts:columns.date')}</th>
            <th>{t('accounts:columns.direction')}</th>
            <th>{t('accounts:columns.targetAccount')}</th>
            <th>{t('accounts:columns.description')}</th>
            <th>{t('accounts:columns.amount')}</th>
          </tr>
        </thead>
        <tbody>
          {transfers.map((transfer) => {
            const isIncoming = transfer.to_account_id === accountId;
            const otherAccountName = isIncoming ? transfer.from_account_name : transfer.to_account_name;

            return (
              <tr key={transfer.id}>
                <td>{formatDate(transfer.transfer_date)}</td>
                <td>
                  <Badge variant={isIncoming ? 'success' : 'warning'}>
                    {isIncoming ? t('accounts:transferDirections.incoming') : t('accounts:transferDirections.outgoing')}
                  </Badge>
                </td>
                <td>
                  {isIncoming ? (
                    <span>{otherAccountName || '-'} → {t('accounts:transferDirections.thisAccount')}</span>
                  ) : (
                    <span>{t('accounts:transferDirections.thisAccount')} → {otherAccountName || '-'}</span>
                  )}
                </td>
                <td>{transfer.description || '-'}</td>
                <td className={isIncoming ? styles.amountPositive : styles.amountNegative}>
                  {isIncoming ? '+' : '-'}{formatCurrency(transfer.amount)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
