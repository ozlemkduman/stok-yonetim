import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Badge, Card } from '@stok/ui';
import { openingStockApi, OpeningStockDetail } from '../../api/opening-stock.api';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './OpeningStockDetailPage.module.css';

export function OpeningStockDetailPage() {
  const { t } = useTranslation(['openingStock', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();

  const [data, setData] = useState<OpeningStockDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await openingStockApi.getById(id);
        setData(res.data);
      } catch (err) {
        showToast('error', err instanceof Error ? err.message : t('openingStock:toast.loadError'));
      }
      setLoading(false);
    })();
  }, [id]);

  const handleCancel = async () => {
    if (!data || !id) return;
    const confirmed = await confirm({
      message: t('openingStock:confirm.cancel', { number: data.entry_number }),
      variant: 'danger',
    });
    if (!confirmed) return;
    setCancelling(true);
    try {
      await openingStockApi.cancel(id);
      showToast('success', t('openingStock:toast.cancelled'));
      const res = await openingStockApi.getById(id);
      setData(res.data);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('openingStock:toast.cancelError'));
    }
    setCancelling(false);
  };

  if (loading) return <div className={styles.loading}>{t('common:labels.loading')}</div>;
  if (!data) return <div className={styles.error}>{t('openingStock:detail.notFound')}</div>;

  const statusVariant = data.status === 'completed' ? 'success' : 'danger';
  const totalValue = data.items.reduce((acc, it) => acc + Number(it.quantity) * Number(it.unit_cost), 0);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Button variant="ghost" onClick={() => navigate('/opening-stock')}>&larr; {t('openingStock:detail.back')}</Button>
          <h1 className={styles.title}>{data.entry_number}</h1>
          <div className={styles.meta}>
            <Badge variant={statusVariant}>{t(`openingStock:statuses.${data.status}`, { defaultValue: data.status })}</Badge>
            <span>{formatDate(data.entry_date)}</span>
          </div>
        </div>
        {data.status === 'completed' && (
          <Button variant="danger" onClick={handleCancel} disabled={cancelling}>
            {cancelling ? t('openingStock:detail.cancelling') : t('openingStock:detail.cancel')}
          </Button>
        )}
      </div>

      <Card>
        <h3>{t('openingStock:detail.info')}</h3>
        <dl className={styles.dl}>
          <dt>{t('openingStock:columns.warehouse')}</dt>
          <dd>{(data as any).warehouse_name || '-'}</dd>
          <dt>{t('openingStock:detail.createdBy')}</dt>
          <dd>{(data as any).created_by_name || '-'}</dd>
          <dt>{t('openingStock:detail.totalValue')}</dt>
          <dd><strong>{formatCurrency(totalValue)}</strong></dd>
        </dl>
      </Card>

      <Card>
        <h3>{t('openingStock:detail.items', { count: data.items.length })}</h3>
        <table className={styles.itemsTable}>
          <thead>
            <tr>
              <th>{t('openingStock:form.product')}</th>
              <th style={{ textAlign: 'right' }}>{t('openingStock:form.quantity')}</th>
              <th style={{ textAlign: 'right' }}>{t('openingStock:form.unitCost')}</th>
              <th style={{ textAlign: 'right' }}>{t('openingStock:form.lineTotal')}</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((it) => (
              <tr key={it.id}>
                <td>
                  {it.product_name || '-'}
                  {(it as any).product_is_active === false && <span className={styles.inactiveBadge}>({t('common:labels.inactive')})</span>}
                </td>
                <td style={{ textAlign: 'right' }}>{Number(it.quantity)} {it.unit || ''}</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(Number(it.unit_cost))}</td>
                <td style={{ textAlign: 'right' }}><strong>{formatCurrency(Number(it.quantity) * Number(it.unit_cost))}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {data.notes && (
        <Card>
          <h3>{t('openingStock:detail.notes')}</h3>
          <p>{data.notes}</p>
        </Card>
      )}
    </div>
  );
}
