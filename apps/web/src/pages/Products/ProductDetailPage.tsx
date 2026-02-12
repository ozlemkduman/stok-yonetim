import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Badge, Card } from '@stok/ui';
import { productsApi, ProductDetail, ProductSale, ProductReturn, StockMovement } from '../../api/products.api';
import { formatCurrency, formatDate, formatDateTime, formatNumber } from '../../utils/formatters';
import styles from './ProductDetailPage.module.css';

type TabType = 'sales' | 'returns' | 'movements';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('sales');

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await productsApi.getDetail(id);
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
        <div className={styles.error}>{error || 'Urun bulunamadi'}</div>
        <Button onClick={() => navigate('/products')}>Geri Don</Button>
      </div>
    );
  }

  const { product, sales, returns, movements, stats } = data;

  const paymentMethodLabels: Record<string, string> = {
    cash: 'Nakit',
    credit_card: 'Kredi Karti',
    bank_transfer: 'Havale/EFT',
    credit: 'Veresiye',
  };

  const statusLabels: Record<string, string> = {
    completed: 'Tamamlandi',
    cancelled: 'Iptal Edildi',
    pending: 'Beklemede',
  };

  const movementTypeLabels: Record<string, string> = {
    sale: 'Satis',
    return: 'Iade',
    transfer_in: 'Transfer Giris',
    transfer_out: 'Transfer Cikis',
    adjustment: 'Duzeltme',
    purchase: 'Alis',
  };

  const isLowStock = product.stock_quantity <= product.min_stock_level;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Button variant="ghost" onClick={() => navigate('/products')}>
            ← Urunler
          </Button>
          <h1 className={styles.title}>{product.name}</h1>
          <div className={styles.productMeta}>
            {product.barcode && <span className={styles.barcode}>{product.barcode}</span>}
            {product.category && <span className={styles.category}>{product.category}</span>}
            <Badge variant={product.is_active ? 'success' : 'default'}>
              {product.is_active ? 'Aktif' : 'Pasif'}
            </Badge>
            {isLowStock && (
              <Badge variant="danger">Dusuk Stok</Badge>
            )}
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.stockCard}>
            <span className={styles.stockLabel}>Mevcut Stok</span>
            <span className={`${styles.stockValue} ${isLowStock ? styles.lowStock : ''}`}>
              {formatNumber(product.stock_quantity)} {product.unit}
            </span>
            <span className={styles.stockNote}>Min: {formatNumber(product.min_stock_level)} {product.unit}</span>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className={styles.infoGrid}>
        <Card className={styles.infoCard}>
          <h3>Urun Bilgileri</h3>
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Satis Fiyati</span>
              <span className={styles.infoValue}>{formatCurrency(product.sale_price)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Alis Fiyati</span>
              <span className={styles.infoValue}>{formatCurrency(product.purchase_price)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>KDV Orani</span>
              <span className={styles.infoValue}>%{product.vat_rate}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Birim</span>
              <span className={styles.infoValue}>{product.unit}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Olusturulma</span>
              <span className={styles.infoValue}>{formatDate(product.created_at)}</span>
            </div>
          </div>
        </Card>

        <Card className={styles.statsCard}>
          <h3>Istatistikler</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{formatNumber(stats.totalSold)}</span>
              <span className={styles.statLabel}>Satilan</span>
              <span className={styles.statTotal}>{stats.salesCount} satis</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{formatNumber(stats.totalReturned)}</span>
              <span className={styles.statLabel}>Iade Edilen</span>
              <span className={styles.statTotal}>{stats.returnsCount} iade</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{formatCurrency(stats.totalRevenue)}</span>
              <span className={styles.statLabel}>Toplam Gelir</span>
              <span className={styles.statTotal}>Net: {formatNumber(stats.totalSold - stats.totalReturned)} adet</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'sales' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('sales')}
          >
            Satislar ({sales.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'returns' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('returns')}
          >
            Iadeler ({returns.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'movements' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('movements')}
          >
            Stok Hareketleri ({movements.length})
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'sales' && (
            <SalesTab
              sales={sales}
              paymentMethodLabels={paymentMethodLabels}
              statusLabels={statusLabels}
              unit={product.unit}
            />
          )}
          {activeTab === 'returns' && (
            <ReturnsTab
              returns={returns}
              statusLabels={statusLabels}
              unit={product.unit}
            />
          )}
          {activeTab === 'movements' && (
            <MovementsTab
              movements={movements}
              movementTypeLabels={movementTypeLabels}
              unit={product.unit}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function SalesTab({
  sales,
  paymentMethodLabels,
  statusLabels,
  unit
}: {
  sales: ProductSale[];
  paymentMethodLabels: Record<string, string>;
  statusLabels: Record<string, string>;
  unit: string;
}) {
  if (sales.length === 0) {
    return <div className={styles.emptyState}>Bu urun henuz satilmamis</div>;
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>Fatura No</th>
            <th>Tarih</th>
            <th>Musteri</th>
            <th>Miktar</th>
            <th>Birim Fiyat</th>
            <th>KDV</th>
            <th>Toplam</th>
            <th>Odeme</th>
            <th>Durum</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => (
            <tr key={sale.id}>
              <td className={styles.invoiceNumber}>{sale.invoice_number}</td>
              <td>{formatDate(sale.sale_date)}</td>
              <td>{sale.customer_name || '-'}</td>
              <td>{sale.quantity} {unit}</td>
              <td>{formatCurrency(sale.unit_price)}</td>
              <td>%{sale.vat_rate}</td>
              <td className={styles.amount}>{formatCurrency(sale.line_total)}</td>
              <td>
                <span className={styles.paymentBadge}>
                  {paymentMethodLabels[sale.payment_method] || sale.payment_method}
                </span>
              </td>
              <td>
                <Badge variant={sale.status === 'completed' ? 'success' : sale.status === 'cancelled' ? 'danger' : 'warning'}>
                  {statusLabels[sale.status] || sale.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReturnsTab({
  returns,
  statusLabels,
  unit
}: {
  returns: ProductReturn[];
  statusLabels: Record<string, string>;
  unit: string;
}) {
  if (returns.length === 0) {
    return <div className={styles.emptyState}>Bu urun icin iade yapilmamis</div>;
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>Iade No</th>
            <th>Tarih</th>
            <th>Musteri</th>
            <th>Miktar</th>
            <th>Birim Fiyat</th>
            <th>KDV</th>
            <th>Toplam</th>
            <th>Sebep</th>
            <th>Durum</th>
          </tr>
        </thead>
        <tbody>
          {returns.map((ret) => (
            <tr key={ret.id}>
              <td className={styles.invoiceNumber}>{ret.return_number}</td>
              <td>{formatDate(ret.return_date)}</td>
              <td>{ret.customer_name || '-'}</td>
              <td>{ret.quantity} {unit}</td>
              <td>{formatCurrency(ret.unit_price)}</td>
              <td>{formatCurrency(ret.vat_amount)}</td>
              <td className={styles.amount}>{formatCurrency(ret.line_total)}</td>
              <td>{ret.reason || '-'}</td>
              <td>
                <Badge variant={ret.status === 'completed' ? 'success' : ret.status === 'cancelled' ? 'danger' : 'warning'}>
                  {statusLabels[ret.status] || ret.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MovementsTab({
  movements,
  movementTypeLabels,
  unit
}: {
  movements: StockMovement[];
  movementTypeLabels: Record<string, string>;
  unit: string;
}) {
  if (movements.length === 0) {
    return <div className={styles.emptyState}>Stok hareketi bulunmuyor</div>;
  }

  const getMovementVariant = (type: string): 'success' | 'danger' | 'warning' | 'default' => {
    if (['return', 'transfer_in', 'purchase'].includes(type)) return 'success';
    if (['sale', 'transfer_out'].includes(type)) return 'danger';
    return 'default';
  };

  return (
    <div className={styles.tableContainer}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>Tarih</th>
            <th>Hareket Tipi</th>
            <th>Miktar</th>
            <th>Sonraki Stok</th>
            <th>Depo</th>
            <th>Notlar</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((movement) => (
            <tr key={movement.id}>
              <td>{formatDateTime(movement.movement_date)}</td>
              <td>
                <Badge variant={getMovementVariant(movement.movement_type)}>
                  {movementTypeLabels[movement.movement_type] || movement.movement_type}
                </Badge>
              </td>
              <td className={movement.quantity > 0 ? styles.positive : styles.negative}>
                {movement.quantity > 0 ? '+' : ''}{movement.quantity} {unit}
              </td>
              <td>{formatNumber(movement.stock_after)} {unit}</td>
              <td>{movement.warehouse_name || '-'}</td>
              <td>{movement.notes || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
