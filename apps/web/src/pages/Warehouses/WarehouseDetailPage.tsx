import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Badge, Card } from '@stok/ui';
import { warehousesApi, WarehouseDetail, WarehouseStock, StockMovement, StockTransfer } from '../../api/warehouses.api';
import { formatDate, formatDateTime } from '../../utils/formatters';
import styles from './WarehouseDetailPage.module.css';

type TabType = 'stocks' | 'movements' | 'transfers';

export function WarehouseDetailPage() {
  const { t } = useTranslation(['warehouses', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<WarehouseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('stocks');

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await warehousesApi.getDetail(id);
        setData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('warehouses:detail.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, t]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>{t('warehouses:detail.loading')}</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>{error || t('warehouses:detail.notFound')}</div>
        <Button onClick={() => navigate('/warehouses')}>{t('warehouses:detail.backButton')}</Button>
      </div>
    );
  }

  const { warehouse, stocks, movements, transfers, stats } = data;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Button variant="ghost" onClick={() => navigate('/warehouses')}>
            {t('warehouses:detail.back')}
          </Button>
          <h1 className={styles.title}>{warehouse.name}</h1>
          <div className={styles.warehouseMeta}>
            <span className={styles.warehouseCode}>{warehouse.code}</span>
            {warehouse.is_default && <Badge variant="success">{t('warehouses:badges.default')}</Badge>}
            <Badge variant={warehouse.is_active ? 'success' : 'default'}>
              {warehouse.is_active ? t('warehouses:badges.active') : t('warehouses:badges.inactive')}
            </Badge>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.statsCard}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.totalProducts}</span>
              <span className={styles.statLabel}>{t('warehouses:detail.productCount')}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.totalQuantity}</span>
              <span className={styles.statLabel}>{t('warehouses:detail.totalStock')}</span>
            </div>
            {stats.lowStockCount > 0 && (
              <div className={`${styles.statItem} ${styles.warning}`}>
                <span className={styles.statValue}>{stats.lowStockCount}</span>
                <span className={styles.statLabel}>{t('warehouses:detail.lowStock')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Warehouse Info */}
      <div className={styles.infoGrid}>
        <Card className={styles.infoCard}>
          <h3>{t('warehouses:detail.warehouseInfo')}</h3>
          <div className={styles.infoList}>
            {warehouse.address && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('warehouses:detail.address')}</span>
                <span className={styles.infoValue}>{warehouse.address}</span>
              </div>
            )}
            {warehouse.phone && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('warehouses:detail.phone')}</span>
                <span className={styles.infoValue}>{warehouse.phone}</span>
              </div>
            )}
            {warehouse.manager_name && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('warehouses:detail.manager')}</span>
                <span className={styles.infoValue}>{warehouse.manager_name}</span>
              </div>
            )}
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('warehouses:detail.createdAt')}</span>
              <span className={styles.infoValue}>{formatDate(warehouse.created_at)}</span>
            </div>
          </div>
        </Card>

        <Card className={styles.summaryCard}>
          <h3>{t('warehouses:detail.summary')}</h3>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryValue}>{stats.movementsCount}</span>
              <span className={styles.summaryLabel}>{t('warehouses:detail.totalMovements')}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryValue}>{stats.transfersCount}</span>
              <span className={styles.summaryLabel}>{t('warehouses:detail.totalTransfers')}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryValue}>{stats.pendingTransfers}</span>
              <span className={styles.summaryLabel}>{t('warehouses:detail.pendingTransfers')}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'stocks' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('stocks')}
          >
            {t('warehouses:detail.stocksTab', { count: stocks.length })}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'movements' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('movements')}
          >
            {t('warehouses:detail.movementsTab', { count: movements.length })}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'transfers' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('transfers')}
          >
            {t('warehouses:detail.transfersTab', { count: transfers.length })}
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'stocks' && <StocksTab stocks={stocks} t={t} />}
          {activeTab === 'movements' && <MovementsTab movements={movements} t={t} />}
          {activeTab === 'transfers' && <TransfersTab transfers={transfers} warehouseId={warehouse.id} t={t} />}
        </div>
      </div>
    </div>
  );
}

function StocksTab({ stocks, t }: { stocks: WarehouseStock[]; t: (key: string) => string }) {
  if (stocks.length === 0) {
    return <div className={styles.emptyState}>{t('warehouses:empty.stocks')}</div>;
  }

  return (
    <div className={styles.stocksList}>
      <table className={styles.stocksTable}>
        <thead>
          <tr>
            <th>{t('warehouses:columns.product')}</th>
            <th>{t('warehouses:columns.barcode')}</th>
            <th>{t('warehouses:columns.quantity')}</th>
            <th>{t('warehouses:columns.minStock')}</th>
            <th>{t('warehouses:columns.status')}</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock) => {
            const isLowStock = stock.quantity <= stock.min_stock_level;
            return (
              <tr key={stock.id} className={isLowStock ? styles.lowStockRow : ''}>
                <td className={styles.productName}>{stock.product_name || '-'}</td>
                <td className={styles.barcode}>{stock.product_barcode || '-'}</td>
                <td className={styles.quantity}>{stock.quantity}</td>
                <td className={styles.minStock}>{stock.min_stock_level}</td>
                <td>
                  {isLowStock ? (
                    <Badge variant="warning">{t('warehouses:badges.lowStock')}</Badge>
                  ) : (
                    <Badge variant="success">{t('warehouses:badges.normal')}</Badge>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function MovementsTab({ movements, t }: { movements: StockMovement[]; t: (key: string) => string }) {
  if (movements.length === 0) {
    return <div className={styles.emptyState}>{t('warehouses:empty.detailMovements')}</div>;
  }

  return (
    <div className={styles.movementsList}>
      <table className={styles.movementsTable}>
        <thead>
          <tr>
            <th>{t('warehouses:columns.date')}</th>
            <th>{t('warehouses:columns.product')}</th>
            <th>{t('warehouses:columns.operation')}</th>
            <th>{t('warehouses:columns.quantity')}</th>
            <th>{t('warehouses:columns.stockAfter')}</th>
            <th>{t('warehouses:columns.notes')}</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((movement) => (
            <tr key={movement.id}>
              <td className={styles.movementDate}>{formatDateTime(movement.movement_date)}</td>
              <td className={styles.productName}>{movement.product_name || '-'}</td>
              <td>
                <span className={styles.movementType}>
                  {t(`warehouses:movementTypes.${movement.movement_type}`)}
                </span>
              </td>
              <td>
                <span className={`${styles.movementQuantity} ${movement.quantity > 0 ? styles.positive : styles.negative}`}>
                  {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                </span>
              </td>
              <td className={styles.stockAfter}>{movement.stock_after}</td>
              <td className={styles.movementNotes}>{movement.notes || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TransfersTab({ transfers, warehouseId, t }: { transfers: StockTransfer[]; warehouseId: string; t: (key: string) => string }) {
  if (transfers.length === 0) {
    return <div className={styles.emptyState}>{t('warehouses:empty.detailTransfers')}</div>;
  }

  return (
    <div className={styles.transfersList}>
      <table className={styles.transfersTable}>
        <thead>
          <tr>
            <th>{t('warehouses:columns.transferNo')}</th>
            <th>{t('warehouses:columns.date')}</th>
            <th>{t('warehouses:columns.direction')}</th>
            <th>{t('warehouses:columns.otherWarehouse')}</th>
            <th>{t('warehouses:columns.status')}</th>
            <th>{t('warehouses:columns.notes')}</th>
          </tr>
        </thead>
        <tbody>
          {transfers.map((transfer) => {
            const isOutgoing = transfer.from_warehouse_id === warehouseId;
            const otherWarehouse = isOutgoing ? transfer.to_warehouse_name : transfer.from_warehouse_name;

            return (
              <tr key={transfer.id}>
                <td className={styles.transferNumber}>{transfer.transfer_number}</td>
                <td className={styles.transferDate}>{formatDate(transfer.transfer_date)}</td>
                <td>
                  <span className={`${styles.transferDirection} ${isOutgoing ? styles.outgoing : styles.incoming}`}>
                    {isOutgoing ? t('warehouses:transferDirection.outgoing') : t('warehouses:transferDirection.incoming')}
                  </span>
                </td>
                <td className={styles.otherWarehouse}>{otherWarehouse || '-'}</td>
                <td>
                  <Badge
                    variant={
                      transfer.status === 'completed' ? 'success' :
                      transfer.status === 'cancelled' ? 'danger' :
                      transfer.status === 'in_transit' ? 'warning' : 'default'
                    }
                  >
                    {t(`warehouses:transferStatus.${transfer.status}`)}
                  </Badge>
                </td>
                <td className={styles.transferNotes}>{transfer.notes || '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
