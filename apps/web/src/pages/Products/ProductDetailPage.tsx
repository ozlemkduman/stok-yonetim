import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Badge, Card } from '@stok/ui';
import { productsApi, ProductDetail, ProductSale, ProductReturn, StockMovement } from '../../api/products.api';
import { formatCurrency, formatDate, formatDateTime, formatNumber } from '../../utils/formatters';
import styles from './ProductDetailPage.module.css';

type TabType = 'sales' | 'returns' | 'movements';

export function ProductDetailPage() {
  const { t } = useTranslation(['products', 'common']);
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
        setError(err instanceof Error ? err.message : t('products:detail.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>{t('products:detail.loading')}</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>{error || t('products:detail.notFound')}</div>
        <Button onClick={() => navigate('/products')}>{t('products:detail.goBack')}</Button>
      </div>
    );
  }

  const { product, sales, returns, movements, stats, warehouseStocks } = data;

  const isLowStock = product.stock_quantity <= product.min_stock_level;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Button variant="ghost" onClick={() => navigate('/products')}>
            {t('products:detail.backToProducts')}
          </Button>
          <h1 className={styles.title}>{product.name}</h1>
          <div className={styles.productMeta}>
            {product.barcode && <span className={styles.barcode}>{product.barcode}</span>}
            {product.category && <span className={styles.category}>{product.category}</span>}
            <Badge variant={product.is_active ? 'success' : 'default'}>
              {product.is_active ? t('products:detail.active') : t('products:detail.inactive')}
            </Badge>
            {isLowStock && (
              <Badge variant="danger">{t('products:detail.lowStock')}</Badge>
            )}
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.stockCard}>
            <span className={styles.stockLabel}>{t('products:detail.currentStock')}</span>
            <span className={`${styles.stockValue} ${isLowStock ? styles.lowStock : ''}`}>
              {formatNumber(product.stock_quantity)} {product.unit}
            </span>
            <span className={styles.stockNote}>{t('products:detail.minStock', { value: formatNumber(product.min_stock_level), unit: product.unit })}</span>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className={styles.infoGrid}>
        <Card className={styles.infoCard}>
          <h3>{t('products:detail.productInfo')}</h3>
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('products:detail.salePrice')}</span>
              <span className={styles.infoValue}>{formatCurrency(product.sale_price)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('products:detail.wholesalePrice')}</span>
              <span className={styles.infoValue}>{formatCurrency(product.wholesale_price)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('products:detail.purchasePrice')}</span>
              <span className={styles.infoValue}>{formatCurrency(product.purchase_price)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('products:detail.vatRate')}</span>
              <span className={styles.infoValue}>%{product.vat_rate}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('products:detail.unit')}</span>
              <span className={styles.infoValue}>{product.unit}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('products:detail.createdAt')}</span>
              <span className={styles.infoValue}>{formatDate(product.created_at)}</span>
            </div>
            {product.created_by_name && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('products:detail.createdBy')}</span>
                <span className={styles.infoValue}>{product.created_by_name}</span>
              </div>
            )}
          </div>
        </Card>

        <Card className={styles.statsCard}>
          <h3>{t('products:detail.statistics')}</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{formatNumber(stats.totalSold)}</span>
              <span className={styles.statLabel}>{t('products:detail.totalSold')}</span>
              <span className={styles.statTotal}>{t('products:detail.salesCount', { count: stats.salesCount })}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{formatNumber(stats.totalReturned)}</span>
              <span className={styles.statLabel}>{t('products:detail.totalReturned')}</span>
              <span className={styles.statTotal}>{t('products:detail.returnsCount', { count: stats.returnsCount })}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{formatCurrency(stats.totalRevenue)}</span>
              <span className={styles.statLabel}>{t('products:detail.totalRevenue')}</span>
              <span className={styles.statTotal}>{t('products:detail.netQuantity', { count: stats.totalSold - stats.totalReturned })}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Warehouse Stocks */}
      {warehouseStocks && warehouseStocks.length > 0 && (
        <Card className={styles.warehouseStocksCard}>
          <h3>{t('products:detail.warehouseStocks')}</h3>
          <div className={styles.tableContainer}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>{t('products:detail.warehouseStocksColumns.warehouse')}</th>
                  <th>{t('products:detail.warehouseStocksColumns.stockQuantity')}</th>
                </tr>
              </thead>
              <tbody>
                {warehouseStocks.map((ws) => (
                  <tr key={ws.warehouse_id}>
                    <td>{ws.warehouse_name}</td>
                    <td>{formatNumber(ws.quantity)} {product.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'sales' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('sales')}
          >
            {t('products:tabs.sales', { count: sales.length })}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'returns' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('returns')}
          >
            {t('products:tabs.returns', { count: returns.length })}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'movements' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('movements')}
          >
            {t('products:tabs.movements', { count: movements.length })}
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'sales' && (
            <SalesTab
              sales={sales}
              unit={product.unit}
            />
          )}
          {activeTab === 'returns' && (
            <ReturnsTab
              returns={returns}
              unit={product.unit}
            />
          )}
          {activeTab === 'movements' && (
            <MovementsTab
              movements={movements}
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
  unit
}: {
  sales: ProductSale[];
  unit: string;
}) {
  const { t } = useTranslation(['products', 'common']);

  if (sales.length === 0) {
    return <div className={styles.emptyState}>{t('products:salesTab.empty')}</div>;
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>{t('products:salesTab.invoiceNo')}</th>
            <th>{t('products:salesTab.date')}</th>
            <th>{t('products:salesTab.customer')}</th>
            <th>{t('products:salesTab.quantity')}</th>
            <th>{t('products:salesTab.unitPrice')}</th>
            <th>{t('products:salesTab.vat')}</th>
            <th>{t('products:salesTab.total')}</th>
            <th>{t('products:salesTab.payment')}</th>
            <th>{t('products:salesTab.status')}</th>
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
                  {t(`products:paymentMethods.${sale.payment_method}`, { defaultValue: sale.payment_method })}
                </span>
              </td>
              <td>
                <Badge variant={sale.status === 'completed' ? 'success' : sale.status === 'cancelled' ? 'danger' : 'warning'}>
                  {t(`products:statuses.${sale.status}`, { defaultValue: sale.status })}
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
  unit
}: {
  returns: ProductReturn[];
  unit: string;
}) {
  const { t } = useTranslation(['products', 'common']);

  if (returns.length === 0) {
    return <div className={styles.emptyState}>{t('products:returnsTab.empty')}</div>;
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>{t('products:returnsTab.returnNo')}</th>
            <th>{t('products:returnsTab.date')}</th>
            <th>{t('products:returnsTab.customer')}</th>
            <th>{t('products:returnsTab.quantity')}</th>
            <th>{t('products:returnsTab.unitPrice')}</th>
            <th>{t('products:returnsTab.vat')}</th>
            <th>{t('products:returnsTab.total')}</th>
            <th>{t('products:returnsTab.reason')}</th>
            <th>{t('products:returnsTab.status')}</th>
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
                  {t(`products:statuses.${ret.status}`, { defaultValue: ret.status })}
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
  unit
}: {
  movements: StockMovement[];
  unit: string;
}) {
  const { t } = useTranslation(['products', 'common']);

  if (movements.length === 0) {
    return <div className={styles.emptyState}>{t('products:movementsTab.empty')}</div>;
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
            <th>{t('products:movementsTab.date')}</th>
            <th>{t('products:movementsTab.movementType')}</th>
            <th>{t('products:movementsTab.quantity')}</th>
            <th>{t('products:movementsTab.stockAfter')}</th>
            <th>{t('products:movementsTab.warehouse')}</th>
            <th>{t('products:movementsTab.notes')}</th>
          </tr>
        </thead>
        <tbody>
          {movements.map((movement) => (
            <tr key={movement.id}>
              <td>{formatDateTime(movement.movement_date)}</td>
              <td>
                <Badge variant={getMovementVariant(movement.movement_type)}>
                  {t(`products:movementTypes.${movement.movement_type}`, { defaultValue: movement.movement_type })}
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
