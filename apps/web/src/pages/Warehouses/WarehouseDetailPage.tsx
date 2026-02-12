import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Badge, Card } from '@stok/ui';
import { warehousesApi, WarehouseDetail, WarehouseStock, StockMovement, StockTransfer } from '../../api/warehouses.api';
import { formatDate, formatDateTime } from '../../utils/formatters';
import styles from './WarehouseDetailPage.module.css';

type TabType = 'stocks' | 'movements' | 'transfers';

const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  sale: 'Satis',
  return: 'Iade',
  transfer_in: 'Transfer Giris',
  transfer_out: 'Transfer Cikis',
  adjustment: 'Duzeltme',
  purchase: 'Alis',
};

const TRANSFER_STATUS_LABELS: Record<string, string> = {
  pending: 'Bekliyor',
  in_transit: 'Yolda',
  completed: 'Tamamlandi',
  cancelled: 'Iptal',
};

export function WarehouseDetailPage() {
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
        <div className={styles.error}>{error || 'Depo bulunamadi'}</div>
        <Button onClick={() => navigate('/warehouses')}>Geri Don</Button>
      </div>
    );
  }

  const { warehouse, stocks, movements, transfers, stats } = data;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Button variant="ghost" onClick={() => navigate('/warehouses')}>
            ← Depolar
          </Button>
          <h1 className={styles.title}>{warehouse.name}</h1>
          <div className={styles.warehouseMeta}>
            <span className={styles.warehouseCode}>{warehouse.code}</span>
            {warehouse.is_default && <Badge variant="success">Varsayilan</Badge>}
            <Badge variant={warehouse.is_active ? 'success' : 'default'}>
              {warehouse.is_active ? 'Aktif' : 'Pasif'}
            </Badge>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.statsCard}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.totalProducts}</span>
              <span className={styles.statLabel}>Urun</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.totalQuantity}</span>
              <span className={styles.statLabel}>Toplam Stok</span>
            </div>
            {stats.lowStockCount > 0 && (
              <div className={`${styles.statItem} ${styles.warning}`}>
                <span className={styles.statValue}>{stats.lowStockCount}</span>
                <span className={styles.statLabel}>Dusuk Stok</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Warehouse Info */}
      <div className={styles.infoGrid}>
        <Card className={styles.infoCard}>
          <h3>Depo Bilgileri</h3>
          <div className={styles.infoList}>
            {warehouse.address && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Adres</span>
                <span className={styles.infoValue}>{warehouse.address}</span>
              </div>
            )}
            {warehouse.phone && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Telefon</span>
                <span className={styles.infoValue}>{warehouse.phone}</span>
              </div>
            )}
            {warehouse.manager_name && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Sorumlu</span>
                <span className={styles.infoValue}>{warehouse.manager_name}</span>
              </div>
            )}
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Olusturma Tarihi</span>
              <span className={styles.infoValue}>{formatDate(warehouse.created_at)}</span>
            </div>
          </div>
        </Card>

        <Card className={styles.summaryCard}>
          <h3>Ozet</h3>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryValue}>{stats.movementsCount}</span>
              <span className={styles.summaryLabel}>Toplam Hareket</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryValue}>{stats.transfersCount}</span>
              <span className={styles.summaryLabel}>Toplam Transfer</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryValue}>{stats.pendingTransfers}</span>
              <span className={styles.summaryLabel}>Bekleyen Transfer</span>
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
            Stoklar ({stocks.length})
          </button>
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
          {activeTab === 'stocks' && <StocksTab stocks={stocks} />}
          {activeTab === 'movements' && <MovementsTab movements={movements} />}
          {activeTab === 'transfers' && <TransfersTab transfers={transfers} warehouseId={warehouse.id} />}
        </div>
      </div>
    </div>
  );
}

function StocksTab({ stocks }: { stocks: WarehouseStock[] }) {
  if (stocks.length === 0) {
    return <div className={styles.emptyState}>Bu depoda stok bulunmuyor</div>;
  }

  return (
    <div className={styles.stocksList}>
      <table className={styles.stocksTable}>
        <thead>
          <tr>
            <th>Urun</th>
            <th>Barkod</th>
            <th>Miktar</th>
            <th>Min. Stok</th>
            <th>Durum</th>
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
                    <Badge variant="warning">Dusuk Stok</Badge>
                  ) : (
                    <Badge variant="success">Normal</Badge>
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

function MovementsTab({ movements }: { movements: StockMovement[] }) {
  if (movements.length === 0) {
    return <div className={styles.emptyState}>Henuz stok hareketi bulunmuyor</div>;
  }

  return (
    <div className={styles.movementsList}>
      <table className={styles.movementsTable}>
        <thead>
          <tr>
            <th>Tarih</th>
            <th>Urun</th>
            <th>Islem</th>
            <th>Miktar</th>
            <th>Sonraki Stok</th>
            <th>Not</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((movement) => (
            <tr key={movement.id}>
              <td className={styles.movementDate}>{formatDateTime(movement.movement_date)}</td>
              <td className={styles.productName}>{movement.product_name || '-'}</td>
              <td>
                <span className={styles.movementType}>
                  {MOVEMENT_TYPE_LABELS[movement.movement_type] || movement.movement_type}
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

function TransfersTab({ transfers, warehouseId }: { transfers: StockTransfer[]; warehouseId: string }) {
  if (transfers.length === 0) {
    return <div className={styles.emptyState}>Henuz transfer bulunmuyor</div>;
  }

  return (
    <div className={styles.transfersList}>
      <table className={styles.transfersTable}>
        <thead>
          <tr>
            <th>Transfer No</th>
            <th>Tarih</th>
            <th>Yon</th>
            <th>Diger Depo</th>
            <th>Durum</th>
            <th>Not</th>
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
                    {isOutgoing ? 'Cikis' : 'Giris'}
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
                    {TRANSFER_STATUS_LABELS[transfer.status] || transfer.status}
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
