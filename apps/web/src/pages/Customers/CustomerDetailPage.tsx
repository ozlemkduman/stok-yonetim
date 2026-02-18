import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Badge, Card } from '@stok/ui';
import { customersApi, CustomerDetail, CustomerSale, CustomerReturn, CustomerPayment, ProductPurchase } from '../../api/customers.api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './CustomerDetailPage.module.css';

type TabType = 'sales' | 'returns' | 'payments' | 'products';

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('products');

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await customersApi.getDetail(id);
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
        <div className={styles.error}>{error || 'Musteri bulunamadi'}</div>
        <Button onClick={() => navigate('/customers')}>Geri Don</Button>
      </div>
    );
  }

  const { customer, sales, returns, payments, stats, productPurchases } = data;

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

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Button variant="ghost" onClick={() => navigate('/customers')}>
            ← Musteriler
          </Button>
          <h1 className={styles.title}>{customer.name}</h1>
          <div className={styles.customerMeta}>
            {customer.phone && <span>{customer.phone}</span>}
            {customer.email && <span>{customer.email}</span>}
            <Badge variant={customer.is_active ? 'success' : 'default'}>
              {customer.is_active ? 'Aktif' : 'Pasif'}
            </Badge>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.balanceCard}>
            <span className={styles.balanceLabel}>Cari Bakiye</span>
            <span className={`${styles.balanceValue} ${customer.balance < 0 ? styles.negative : customer.balance > 0 ? styles.positive : ''}`}>
              {formatCurrency(customer.balance)}
            </span>
            {customer.balance < 0 && <span className={styles.balanceNote}>Borclu</span>}
            {customer.balance > 0 && <span className={styles.balanceNote}>Alacakli</span>}
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className={styles.infoGrid}>
        <Card className={styles.infoCard}>
          <h3>Musteri Bilgileri</h3>
          <div className={styles.infoList}>
            {customer.address && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Adres</span>
                <span className={styles.infoValue}>{customer.address}</span>
              </div>
            )}
            {customer.tax_number && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Vergi No</span>
                <span className={styles.infoValue}>{customer.tax_number}</span>
              </div>
            )}
            {customer.tax_office && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Vergi Dairesi</span>
                <span className={styles.infoValue}>{customer.tax_office}</span>
              </div>
            )}
            {customer.notes && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Notlar</span>
                <span className={styles.infoValue}>{customer.notes}</span>
              </div>
            )}
            {customer.created_by_name && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Kaydeden</span>
                <span className={styles.infoValue}>{customer.created_by_name}</span>
              </div>
            )}
          </div>
        </Card>

        <Card className={styles.statsCard}>
          <h3>Istatistikler</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.salesCount}</span>
              <span className={styles.statLabel}>Satis</span>
              <span className={styles.statTotal}>{formatCurrency(stats.totalSales)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.returnsCount}</span>
              <span className={styles.statLabel}>Iade</span>
              <span className={styles.statTotal}>{formatCurrency(stats.totalReturns)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.paymentsCount}</span>
              <span className={styles.statLabel}>Odeme</span>
              <span className={styles.statTotal}>{formatCurrency(stats.totalPayments)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'products' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('products')}
          >
            Urun Istatistikleri ({productPurchases?.length || 0})
          </button>
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
            className={`${styles.tab} ${activeTab === 'payments' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            Odemeler ({payments.length})
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'products' && (
            <ProductsTab productPurchases={productPurchases || []} />
          )}
          {activeTab === 'sales' && (
            <SalesTab sales={sales} paymentMethodLabels={paymentMethodLabels} statusLabels={statusLabels} />
          )}
          {activeTab === 'returns' && (
            <ReturnsTab returns={returns} statusLabels={statusLabels} />
          )}
          {activeTab === 'payments' && (
            <PaymentsTab payments={payments} paymentMethodLabels={paymentMethodLabels} />
          )}
        </div>
      </div>
    </div>
  );
}

function SalesTab({ sales, paymentMethodLabels, statusLabels }: { sales: CustomerSale[]; paymentMethodLabels: Record<string, string>; statusLabels: Record<string, string> }) {
  const [expandedSale, setExpandedSale] = useState<string | null>(null);

  if (sales.length === 0) {
    return <div className={styles.emptyState}>Henuz satis yapilmamis</div>;
  }

  return (
    <div className={styles.salesList}>
      {sales.map((sale) => (
        <div key={sale.id} className={styles.saleCard}>
          <div
            className={styles.saleHeader}
            onClick={() => setExpandedSale(expandedSale === sale.id ? null : sale.id)}
          >
            <div className={styles.saleInfo}>
              <span className={styles.invoiceNumber}>{sale.invoice_number}</span>
              <span className={styles.saleDate}>{formatDate(sale.sale_date)}</span>
            </div>
            <div className={styles.saleMeta}>
              <Badge variant={sale.status === 'completed' ? 'success' : sale.status === 'cancelled' ? 'danger' : 'warning'}>
                {statusLabels[sale.status] || sale.status}
              </Badge>
              <span className={styles.paymentMethod}>{paymentMethodLabels[sale.payment_method] || sale.payment_method}</span>
              <span className={styles.saleTotal}>{formatCurrency(sale.grand_total)}</span>
              <span className={styles.expandIcon}>{expandedSale === sale.id ? '▼' : '▶'}</span>
            </div>
          </div>

          {expandedSale === sale.id && sale.items && (
            <div className={styles.saleItems}>
              <table className={styles.itemsTable}>
                <thead>
                  <tr>
                    <th>Urun</th>
                    <th>Barkod</th>
                    <th>Miktar</th>
                    <th>Birim Fiyat</th>
                    <th>KDV</th>
                    <th>Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.product_name}</td>
                      <td>{item.barcode || '-'}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.unit_price)}</td>
                      <td>%{item.vat_rate}</td>
                      <td>{formatCurrency(item.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5}>Ara Toplam</td>
                    <td>{formatCurrency(sale.subtotal)}</td>
                  </tr>
                  {sale.discount_amount > 0 && (
                    <tr>
                      <td colSpan={5}>Iskonto</td>
                      <td>-{formatCurrency(sale.discount_amount)}</td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={5}>KDV Toplam</td>
                    <td>{formatCurrency(sale.vat_total)}</td>
                  </tr>
                  <tr className={styles.grandTotal}>
                    <td colSpan={5}>Genel Toplam</td>
                    <td>{formatCurrency(sale.grand_total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ReturnsTab({ returns, statusLabels }: { returns: CustomerReturn[]; statusLabels: Record<string, string> }) {
  const [expandedReturn, setExpandedReturn] = useState<string | null>(null);

  if (returns.length === 0) {
    return <div className={styles.emptyState}>Henuz iade yapilmamis</div>;
  }

  return (
    <div className={styles.salesList}>
      {returns.map((ret) => (
        <div key={ret.id} className={styles.saleCard}>
          <div
            className={styles.saleHeader}
            onClick={() => setExpandedReturn(expandedReturn === ret.id ? null : ret.id)}
          >
            <div className={styles.saleInfo}>
              <span className={styles.invoiceNumber}>{ret.return_number}</span>
              <span className={styles.saleDate}>{formatDate(ret.return_date)}</span>
            </div>
            <div className={styles.saleMeta}>
              <Badge variant={ret.status === 'completed' ? 'success' : ret.status === 'cancelled' ? 'danger' : 'warning'}>
                {statusLabels[ret.status] || ret.status}
              </Badge>
              {ret.reason && <span className={styles.returnReason}>{ret.reason}</span>}
              <span className={styles.saleTotal}>{formatCurrency(ret.total_amount)}</span>
              <span className={styles.expandIcon}>{expandedReturn === ret.id ? '▼' : '▶'}</span>
            </div>
          </div>

          {expandedReturn === ret.id && ret.items && (
            <div className={styles.saleItems}>
              <table className={styles.itemsTable}>
                <thead>
                  <tr>
                    <th>Urun</th>
                    <th>Barkod</th>
                    <th>Miktar</th>
                    <th>Birim Fiyat</th>
                    <th>KDV</th>
                    <th>Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {ret.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.product_name}</td>
                      <td>{item.barcode || '-'}</td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrency(item.unit_price)}</td>
                      <td>{formatCurrency(item.vat_amount)}</td>
                      <td>{formatCurrency(item.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ProductsTab({ productPurchases }: { productPurchases: ProductPurchase[] }) {
  if (productPurchases.length === 0) {
    return <div className={styles.emptyState}>Henuz urun satisi yapilmamis</div>;
  }

  const totalQuantity = productPurchases.reduce((sum, p) => sum + Number(p.total_quantity), 0);
  const totalAmount = productPurchases.reduce((sum, p) => sum + Number(p.total_amount), 0);

  return (
    <div className={styles.paymentsList}>
      <table className={styles.paymentsTable}>
        <thead>
          <tr>
            <th>Urun</th>
            <th>Barkod</th>
            <th>Toplam Adet</th>
            <th>Toplam Tutar</th>
          </tr>
        </thead>
        <tbody>
          {productPurchases.map((pp) => (
            <tr key={pp.product_id}>
              <td>{pp.product_name}</td>
              <td>{pp.barcode || '-'}</td>
              <td><strong>{Number(pp.total_quantity)}</strong></td>
              <td>{formatCurrency(Number(pp.total_amount))}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className={styles.grandTotal}>
            <td colSpan={2}>Toplam</td>
            <td><strong>{totalQuantity}</strong></td>
            <td>{formatCurrency(totalAmount)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function PaymentsTab({ payments, paymentMethodLabels }: { payments: CustomerPayment[]; paymentMethodLabels: Record<string, string> }) {
  if (payments.length === 0) {
    return <div className={styles.emptyState}>Henuz odeme yapilmamis</div>;
  }

  return (
    <div className={styles.paymentsList}>
      <table className={styles.paymentsTable}>
        <thead>
          <tr>
            <th>Tarih</th>
            <th>Odeme Yontemi</th>
            <th>Notlar</th>
            <th>Tutar</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td>{formatDate(payment.payment_date)}</td>
              <td>{paymentMethodLabels[payment.method] || payment.method}</td>
              <td>{payment.notes || '-'}</td>
              <td className={styles.paymentAmount}>{formatCurrency(payment.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
