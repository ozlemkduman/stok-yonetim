import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Badge, Card } from '@stok/ui';
import { customersApi, CustomerDetail, CustomerSale, CustomerReturn, CustomerPayment, ProductPurchase } from '../../api/customers.api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './CustomerDetailPage.module.css';

type TabType = 'sales' | 'returns' | 'payments' | 'products';

export function CustomerDetailPage() {
  const { t } = useTranslation(['customers', 'common']);
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
        setError(err instanceof Error ? err.message : t('customers:detail.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>{t('customers:detail.loading')}</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>{error || t('customers:detail.notFound')}</div>
        <Button onClick={() => navigate('/customers')}>{t('customers:detail.backButton')}</Button>
      </div>
    );
  }

  const { customer, sales, returns, payments, stats, productPurchases } = data;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Button variant="ghost" onClick={() => navigate('/customers')}>
            {t('customers:detail.backToList')}
          </Button>
          <h1 className={styles.title}>{customer.name}</h1>
          <div className={styles.customerMeta}>
            {customer.phone && <span>{customer.phone}</span>}
            {customer.email && <span>{customer.email}</span>}
            <Badge variant={customer.is_active ? 'success' : 'default'}>
              {customer.is_active ? t('customers:status.active') : t('customers:status.inactive')}
            </Badge>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.balanceCard}>
            <span className={styles.balanceLabel}>{t('customers:detail.currentBalance')}</span>
            <span className={`${styles.balanceValue} ${customer.balance < 0 ? styles.negative : customer.balance > 0 ? styles.positive : ''}`}>
              {formatCurrency(customer.balance)}
            </span>
            {customer.balance < 0 && <span className={styles.balanceNote}>{t('customers:detail.debtor')}</span>}
            {customer.balance > 0 && <span className={styles.balanceNote}>{t('customers:detail.creditor')}</span>}
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className={styles.infoGrid}>
        <Card className={styles.infoCard}>
          <h3>{t('customers:detail.info.title')}</h3>
          <div className={styles.infoList}>
            {customer.address && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('customers:detail.info.address')}</span>
                <span className={styles.infoValue}>{customer.address}</span>
              </div>
            )}
            {customer.tax_number && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('customers:detail.info.taxNumber')}</span>
                <span className={styles.infoValue}>{customer.tax_number}</span>
              </div>
            )}
            {customer.tax_office && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('customers:detail.info.taxOffice')}</span>
                <span className={styles.infoValue}>{customer.tax_office}</span>
              </div>
            )}
            {customer.notes && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('customers:detail.info.notes')}</span>
                <span className={styles.infoValue}>{customer.notes}</span>
              </div>
            )}
            {customer.created_by_name && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('customers:detail.info.createdBy')}</span>
                <span className={styles.infoValue}>{customer.created_by_name}</span>
              </div>
            )}
            {(customer.renewal_red_days || customer.renewal_yellow_days) && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('customers:detail.info.renewalThresholds')}</span>
                <span className={styles.infoValue}>
                  {t('customers:detail.info.renewalThresholdsValue', {
                    red: customer.renewal_red_days || 30,
                    yellow: customer.renewal_yellow_days || 60,
                  })}
                </span>
              </div>
            )}
          </div>
        </Card>

        <Card className={styles.statsCard}>
          <h3>{t('customers:detail.stats.title')}</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.salesCount}</span>
              <span className={styles.statLabel}>{t('customers:detail.stats.sales')}</span>
              <span className={styles.statTotal}>{formatCurrency(stats.totalSales)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.returnsCount}</span>
              <span className={styles.statLabel}>{t('customers:detail.stats.returns')}</span>
              <span className={styles.statTotal}>{formatCurrency(stats.totalReturns)}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.paymentsCount}</span>
              <span className={styles.statLabel}>{t('customers:detail.stats.payments')}</span>
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
            {t('customers:detail.tabs.productStats', { count: productPurchases?.length || 0 })}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'sales' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('sales')}
          >
            {t('customers:detail.tabs.sales', { count: sales.length })}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'returns' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('returns')}
          >
            {t('customers:detail.tabs.returns', { count: returns.length })}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'payments' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('payments')}
          >
            {t('customers:detail.tabs.payments', { count: payments.length })}
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'products' && (
            <ProductsTab productPurchases={productPurchases || []} />
          )}
          {activeTab === 'sales' && (
            <SalesTab sales={sales} />
          )}
          {activeTab === 'returns' && (
            <ReturnsTab returns={returns} />
          )}
          {activeTab === 'payments' && (
            <PaymentsTab payments={payments} />
          )}
        </div>
      </div>
    </div>
  );
}

function SalesTab({ sales }: { sales: CustomerSale[] }) {
  const { t } = useTranslation(['customers']);
  const [expandedSale, setExpandedSale] = useState<string | null>(null);

  if (sales.length === 0) {
    return <div className={styles.emptyState}>{t('customers:detail.empty.sales')}</div>;
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
                {t(`customers:detail.statusLabels.${sale.status}`, { defaultValue: sale.status })}
              </Badge>
              <span className={styles.paymentMethod}>{t(`customers:detail.paymentMethods.${sale.payment_method}`, { defaultValue: sale.payment_method })}</span>
              <span className={styles.saleTotal}>{formatCurrency(sale.grand_total)}</span>
              <span className={styles.expandIcon}>{expandedSale === sale.id ? '▼' : '▶'}</span>
            </div>
          </div>

          {expandedSale === sale.id && sale.items && (
            <div className={styles.saleItems}>
              <table className={styles.itemsTable}>
                <thead>
                  <tr>
                    <th>{t('customers:detail.table.product')}</th>
                    <th>{t('customers:detail.table.barcode')}</th>
                    <th>{t('customers:detail.table.quantity')}</th>
                    <th>{t('customers:detail.table.unitPrice')}</th>
                    <th>{t('customers:detail.table.vat')}</th>
                    <th>{t('customers:detail.table.total')}</th>
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
                    <td colSpan={5}>{t('customers:detail.table.subtotal')}</td>
                    <td>{formatCurrency(sale.subtotal)}</td>
                  </tr>
                  {sale.discount_amount > 0 && (
                    <tr>
                      <td colSpan={5}>{t('customers:detail.table.discount')}</td>
                      <td>-{formatCurrency(sale.discount_amount)}</td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={5}>{t('customers:detail.table.vatTotal')}</td>
                    <td>{formatCurrency(sale.vat_total)}</td>
                  </tr>
                  <tr className={styles.grandTotal}>
                    <td colSpan={5}>{t('customers:detail.table.overallTotal')}</td>
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

function ReturnsTab({ returns }: { returns: CustomerReturn[] }) {
  const { t } = useTranslation(['customers']);
  const [expandedReturn, setExpandedReturn] = useState<string | null>(null);

  if (returns.length === 0) {
    return <div className={styles.emptyState}>{t('customers:detail.empty.returns')}</div>;
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
                {t(`customers:detail.statusLabels.${ret.status}`, { defaultValue: ret.status })}
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
                    <th>{t('customers:detail.table.product')}</th>
                    <th>{t('customers:detail.table.barcode')}</th>
                    <th>{t('customers:detail.table.quantity')}</th>
                    <th>{t('customers:detail.table.unitPrice')}</th>
                    <th>{t('customers:detail.table.vat')}</th>
                    <th>{t('customers:detail.table.total')}</th>
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
  const { t } = useTranslation(['customers']);

  if (productPurchases.length === 0) {
    return <div className={styles.emptyState}>{t('customers:detail.empty.products')}</div>;
  }

  const totalQuantity = productPurchases.reduce((sum, p) => sum + Number(p.total_quantity), 0);
  const totalAmount = productPurchases.reduce((sum, p) => sum + Number(p.total_amount), 0);

  return (
    <div className={styles.paymentsList}>
      <table className={styles.paymentsTable}>
        <thead>
          <tr>
            <th>{t('customers:detail.table.product')}</th>
            <th>{t('customers:detail.table.barcode')}</th>
            <th>{t('customers:detail.table.totalQuantity')}</th>
            <th>{t('customers:detail.table.totalAmount')}</th>
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
            <td colSpan={2}>{t('customers:detail.table.grandTotal')}</td>
            <td><strong>{totalQuantity}</strong></td>
            <td>{formatCurrency(totalAmount)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function PaymentsTab({ payments }: { payments: CustomerPayment[] }) {
  const { t } = useTranslation(['customers']);

  if (payments.length === 0) {
    return <div className={styles.emptyState}>{t('customers:detail.empty.payments')}</div>;
  }

  return (
    <div className={styles.paymentsList}>
      <table className={styles.paymentsTable}>
        <thead>
          <tr>
            <th>{t('customers:detail.table.date')}</th>
            <th>{t('customers:detail.table.paymentMethod')}</th>
            <th>{t('customers:detail.table.notes')}</th>
            <th>{t('customers:detail.table.amount')}</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td>{formatDate(payment.payment_date)}</td>
              <td>{t(`customers:detail.paymentMethods.${payment.method}`, { defaultValue: payment.method })}</td>
              <td>{payment.notes || '-'}</td>
              <td className={styles.paymentAmount}>{formatCurrency(payment.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
