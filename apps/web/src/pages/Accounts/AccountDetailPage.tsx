import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Badge, Card } from '@stok/ui';
import { accountsApi, AccountDetail, AccountMovement, AccountTransfer } from '../../api/accounts.api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './AccountDetailPage.module.css';

type TabType = 'movements' | 'transfers';

export function AccountDetailPage() {
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
        setError(err instanceof Error ? err.message : 'Veri yuklenemedi');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Yukleniyor...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>{error || 'Hesap bulunamadi'}</div>
        <Button onClick={() => navigate('/accounts')}>Geri Don</Button>
      </div>
    );
  }

  const { account, movements, transfers, stats } = data;

  const accountTypeLabels: Record<string, string> = {
    kasa: 'Kasa',
    banka: 'Banka',
  };

  const movementTypeLabels: Record<string, string> = {
    gelir: 'Gelir',
    gider: 'Gider',
    transfer_in: 'Transfer Girisi',
    transfer_out: 'Transfer Cikisi',
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Button variant="ghost" onClick={() => navigate('/accounts')}>
            ← Hesaplar
          </Button>
          <h1 className={styles.title}>{account.name}</h1>
          <div className={styles.accountMeta}>
            <Badge variant={account.account_type === 'kasa' ? 'warning' : 'info'}>
              {accountTypeLabels[account.account_type] || account.account_type}
            </Badge>
            {account.bank_name && <span>{account.bank_name}</span>}
            {account.is_default && <Badge variant="success">Varsayilan</Badge>}
            <Badge variant={account.is_active ? 'success' : 'default'}>
              {account.is_active ? 'Aktif' : 'Pasif'}
            </Badge>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.balanceCard}>
            <span className={styles.balanceLabel}>Guncel Bakiye</span>
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
          <h3>Hesap Bilgileri</h3>
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Hesap Turu</span>
              <span className={styles.infoValue}>{accountTypeLabels[account.account_type] || account.account_type}</span>
            </div>
            {account.bank_name && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Banka Adi</span>
                <span className={styles.infoValue}>{account.bank_name}</span>
              </div>
            )}
            {account.branch_name && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Sube</span>
                <span className={styles.infoValue}>{account.branch_name}</span>
              </div>
            )}
            {account.account_number && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Hesap Numarasi</span>
                <span className={styles.infoValue}>{account.account_number}</span>
              </div>
            )}
            {account.iban && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>IBAN</span>
                <span className={styles.infoValue}>{account.iban}</span>
              </div>
            )}
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Acilis Bakiyesi</span>
              <span className={styles.infoValue}>{formatCurrency(account.opening_balance)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Olusturulma Tarihi</span>
              <span className={styles.infoValue}>{formatDate(account.created_at)}</span>
            </div>
          </div>
        </Card>

        <Card className={styles.statsCard}>
          <h3>Istatistikler</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.movementsCount}</span>
              <span className={styles.statLabel}>Hareket</span>
            </div>
            <div className={styles.statItem}>
              <span className={`${styles.statValue} ${styles.positive}`}>{formatCurrency(stats.totalIncome)}</span>
              <span className={styles.statLabel}>Toplam Gelir</span>
            </div>
            <div className={styles.statItem}>
              <span className={`${styles.statValue} ${styles.negative}`}>{formatCurrency(stats.totalExpense)}</span>
              <span className={styles.statLabel}>Toplam Gider</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.transfersCount}</span>
              <span className={styles.statLabel}>Transfer</span>
            </div>
            <div className={styles.statItem}>
              <span className={`${styles.statValue} ${styles.positive}`}>{formatCurrency(stats.totalTransferIn)}</span>
              <span className={styles.statLabel}>Gelen Transfer</span>
            </div>
            <div className={styles.statItem}>
              <span className={`${styles.statValue} ${styles.negative}`}>{formatCurrency(stats.totalTransferOut)}</span>
              <span className={styles.statLabel}>Giden Transfer</span>
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
            Hareketler ({movements.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'transfers' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('transfers')}
          >
            Transferler ({transfers.length})
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'movements' && (
            <MovementsTab movements={movements} movementTypeLabels={movementTypeLabels} />
          )}
          {activeTab === 'transfers' && (
            <TransfersTab transfers={transfers} accountId={account.id} />
          )}
        </div>
      </div>
    </div>
  );
}

function MovementsTab({ movements, movementTypeLabels }: { movements: AccountMovement[]; movementTypeLabels: Record<string, string> }) {
  if (movements.length === 0) {
    return <div className={styles.emptyState}>Henuz hesap hareketi yok</div>;
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
            <th>Tarih</th>
            <th>Tur</th>
            <th>Kategori</th>
            <th>Aciklama</th>
            <th>Tutar</th>
            <th>Bakiye</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((movement) => (
            <tr key={movement.id}>
              <td>{formatDate(movement.movement_date)}</td>
              <td>
                <Badge variant={getMovementBadgeVariant(movement.movement_type)}>
                  {movementTypeLabels[movement.movement_type] || movement.movement_type}
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

function TransfersTab({ transfers, accountId }: { transfers: AccountTransfer[]; accountId: string }) {
  if (transfers.length === 0) {
    return <div className={styles.emptyState}>Henuz transfer islemi yok</div>;
  }

  return (
    <div className={styles.transfersList}>
      <table className={styles.transfersTable}>
        <thead>
          <tr>
            <th>Tarih</th>
            <th>Yon</th>
            <th>Hesap</th>
            <th>Aciklama</th>
            <th>Tutar</th>
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
                    {isIncoming ? 'Gelen' : 'Giden'}
                  </Badge>
                </td>
                <td>
                  {isIncoming ? (
                    <span>{otherAccountName || '-'} → Bu Hesap</span>
                  ) : (
                    <span>Bu Hesap → {otherAccountName || '-'}</span>
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
