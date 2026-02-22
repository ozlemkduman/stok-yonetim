import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Badge, Card } from '@stok/ui';
import { returnsApi, ReturnDetail } from '../../api/returns.api';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './ReturnDetailPage.module.css';

const statusVariants: Record<string, 'success' | 'danger' | 'warning' | 'default'> = {
  completed: 'success',
  cancelled: 'danger',
  pending: 'warning',
};

export function ReturnDetailPage() {
  const { t } = useTranslation(['returns', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<ReturnDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await returnsApi.getById(id);
        setData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('returns:detail.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>{t('returns:detail.loading')}</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>{error || t('returns:detail.notFound')}</div>
        <Button onClick={() => navigate('/returns')}>{t('returns:detail.goBack')}</Button>
      </div>
    );
  }

  const subtotal = data.total_amount - data.vat_total;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Button variant="ghost" onClick={() => navigate('/returns')}>
            {t('returns:detail.backToList')}
          </Button>
          <h1 className={styles.title}>{data.return_number}</h1>
          <div className={styles.returnMeta}>
            <span>{formatDate(data.return_date)}</span>
            <Badge variant={statusVariants[data.status] || 'default'}>
              {t(`returns:detail.statusLabels.${data.status}`, { defaultValue: data.status })}
            </Badge>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.totalCard}>
            <span className={styles.totalLabel}>{t('returns:detail.totalAmount')}</span>
            <span className={styles.totalValue}>{formatCurrency(data.total_amount)}</span>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className={styles.infoGrid}>
        {/* Return Info */}
        <Card className={styles.infoCard}>
          <h3>{t('returns:detail.returnInfo')}</h3>
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('returns:detail.returnNumber')}</span>
              <span className={styles.infoValue}>{data.return_number}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('returns:detail.date')}</span>
              <span className={styles.infoValue}>{formatDate(data.return_date)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('returns:detail.status')}</span>
              <span className={styles.infoValue}>
                <Badge variant={statusVariants[data.status] || 'default'}>
                  {t(`returns:detail.statusLabels.${data.status}`, { defaultValue: data.status })}
                </Badge>
              </span>
            </div>
            {data.reason && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('returns:detail.returnReason')}</span>
                <span className={styles.infoValue}>{data.reason}</span>
              </div>
            )}
            {data.created_by_name && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('returns:detail.createdBy')}</span>
                <span className={styles.infoValue}>{data.created_by_name}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Customer Info */}
        <Card className={styles.infoCard}>
          <h3>{t('returns:detail.customerInfo')}</h3>
          <div className={styles.infoList}>
            {data.customer_name ? (
              <>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>{t('returns:detail.customer')}</span>
                  <span className={styles.infoValue}>
                    {data.customer_id ? (
                      <Link to={`/customers/${data.customer_id}`} className={styles.link}>
                        {data.customer_name}
                      </Link>
                    ) : (
                      data.customer_name
                    )}
                  </span>
                </div>
              </>
            ) : (
              <div className={styles.emptyInfo}>{t('returns:detail.noCustomerInfo')}</div>
            )}
          </div>
        </Card>

        {/* Related Sale Info */}
        <Card className={styles.infoCard}>
          <h3>{t('returns:detail.relatedSale')}</h3>
          <div className={styles.infoList}>
            {data.sale_id && data.sale_invoice_number ? (
              <>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>{t('returns:detail.invoiceNumber')}</span>
                  <span className={styles.infoValue}>
                    <span className={styles.saleNumber}>{data.sale_invoice_number}</span>
                  </span>
                </div>
                {data.sale_date && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>{t('returns:detail.saleDate')}</span>
                    <span className={styles.infoValue}>{formatDate(data.sale_date)}</span>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.emptyInfo}>{t('returns:detail.noRelatedSale')}</div>
            )}
          </div>
        </Card>
      </div>

      {/* Return Items */}
      <Card className={styles.itemsCard}>
        <h3>{t('returns:detail.returnItems')}</h3>
        {data.items && data.items.length > 0 ? (
          <div className={styles.tableContainer}>
            <table className={styles.itemsTable}>
              <thead>
                <tr>
                  <th>{t('returns:detail.product')}</th>
                  <th>{t('returns:detail.barcode')}</th>
                  <th className={styles.textRight}>{t('returns:detail.quantity')}</th>
                  <th className={styles.textRight}>{t('returns:detail.unitPrice')}</th>
                  <th className={styles.textRight}>{t('returns:detail.vat')}</th>
                  <th className={styles.textRight}>{t('returns:detail.total')}</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => (
                  <tr key={item.id}>
                    <td className={styles.productName}>{item.product_name}</td>
                    <td className={styles.barcode}>{item.barcode || '-'}</td>
                    <td className={styles.textRight}>{item.quantity}</td>
                    <td className={styles.textRight}>{formatCurrency(item.unit_price)}</td>
                    <td className={styles.textRight}>{formatCurrency(item.vat_amount)}</td>
                    <td className={styles.textRight}>{formatCurrency(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyState}>{t('returns:detail.noItems')}</div>
        )}
      </Card>

      {/* Totals */}
      <Card className={styles.totalsCard}>
        <h3>{t('returns:detail.summary')}</h3>
        <div className={styles.totalsGrid}>
          <div className={styles.totalRow}>
            <span className={styles.totalRowLabel}>{t('returns:detail.subtotal')}</span>
            <span className={styles.totalRowValue}>{formatCurrency(subtotal)}</span>
          </div>
          <div className={styles.totalRow}>
            <span className={styles.totalRowLabel}>{t('returns:detail.vatTotal')}</span>
            <span className={styles.totalRowValue}>{formatCurrency(data.vat_total)}</span>
          </div>
          <div className={`${styles.totalRow} ${styles.grandTotalRow}`}>
            <span className={styles.totalRowLabel}>{t('returns:detail.grandTotal')}</span>
            <span className={styles.grandTotalValue}>{formatCurrency(data.total_amount)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
