import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Badge, Card } from '@stok/ui';
import { purchasesApi, PurchaseDetail } from '../../api/purchases.api';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './PurchaseDetailPage.module.css';

export function PurchaseDetailPage() {
  const { t } = useTranslation(['purchases', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();

  const [data, setData] = useState<PurchaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await purchasesApi.getById(id);
        setData(res.data);
      } catch (err) {
        showToast('error', err instanceof Error ? err.message : t('purchases:toast.loadError'));
      }
      setLoading(false);
    })();
  }, [id]);

  const handleCancel = async () => {
    if (!data || !id) return;
    const confirmed = await confirm({
      message: t('purchases:confirm.cancel', { number: data.purchase_number }),
      variant: 'danger',
    });
    if (!confirmed) return;
    setCancelling(true);
    try {
      await purchasesApi.cancel(id);
      showToast('success', t('purchases:toast.cancelled'));
      const res = await purchasesApi.getById(id);
      setData(res.data);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('purchases:toast.cancelError'));
    }
    setCancelling(false);
  };

  if (loading) return <div className={styles.loading}>{t('common:labels.loading')}</div>;
  if (!data) return <div className={styles.error}>{t('purchases:detail.notFound')}</div>;

  const statusVariant = data.status === 'completed' ? 'success' : data.status === 'cancelled' ? 'danger' : 'warning';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Button variant="ghost" onClick={() => navigate('/purchases')}>&larr; {t('purchases:detail.back')}</Button>
          <h1 className={styles.title}>{data.purchase_number}</h1>
          <div className={styles.meta}>
            <Badge variant={statusVariant}>{t(`purchases:statuses.${data.status}`, { defaultValue: data.status })}</Badge>
            <span>{formatDate(data.purchase_date)}</span>
          </div>
        </div>
        {data.status === 'completed' && (
          <Button variant="danger" onClick={handleCancel} disabled={cancelling}>
            {cancelling ? t('purchases:detail.cancelling') : t('purchases:detail.cancel')}
          </Button>
        )}
      </div>

      <div className={styles.grid}>
        <Card>
          <h3>{t('purchases:detail.info')}</h3>
          <dl className={styles.dl}>
            <dt>{t('purchases:columns.supplier')}</dt>
            <dd>{(data as any).supplier_name || '-'}</dd>
            <dt>{t('purchases:detail.supplierInvoiceNo')}</dt>
            <dd>{data.supplier_invoice_no || '-'}</dd>
            <dt>{t('purchases:detail.paymentMethod')}</dt>
            <dd>{t(`purchases:paymentMethods.${data.payment_method}`, { defaultValue: data.payment_method })}</dd>
            {data.due_date && (
              <>
                <dt>{t('purchases:detail.dueDate')}</dt>
                <dd>{formatDate(data.due_date)}</dd>
              </>
            )}
            <dt>{t('purchases:detail.createdBy')}</dt>
            <dd>{(data as any).created_by_name || '-'}</dd>
          </dl>
        </Card>

        <Card>
          <h3>{t('purchases:detail.amounts')}</h3>
          <dl className={styles.dl}>
            <dt>{t('purchases:form.subtotal')}</dt>
            <dd>{formatCurrency(Number(data.subtotal))}</dd>
            {Number(data.discount_amount) > 0 && (
              <>
                <dt>{t('purchases:detail.discount')}</dt>
                <dd>-{formatCurrency(Number(data.discount_amount))}</dd>
              </>
            )}
            <dt>{t('purchases:form.vatTotal')}</dt>
            <dd>{formatCurrency(Number(data.vat_total))}</dd>
            <dt><strong>{t('purchases:form.grandTotal')}</strong></dt>
            <dd><strong>{formatCurrency(Number(data.grand_total))}</strong></dd>
          </dl>
        </Card>
      </div>

      <Card>
        <h3>{t('purchases:detail.items', { count: data.items.length })}</h3>
        <table className={styles.itemsTable}>
          <thead>
            <tr>
              <th>{t('purchases:form.product')}</th>
              <th style={{ textAlign: 'right' }}>{t('purchases:form.quantity')}</th>
              <th style={{ textAlign: 'right' }}>{t('purchases:form.unitPrice')}</th>
              <th style={{ textAlign: 'right' }}>{t('purchases:form.vatRate')}</th>
              <th style={{ textAlign: 'right' }}>{t('purchases:form.lineTotal')}</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((it) => (
              <tr key={it.id}>
                <td>
                  {it.product_name || '-'}
                  {(it as any).product_is_active === false && <span className={styles.inactiveBadge}>({t('common:labels.inactive')})</span>}
                </td>
                <td style={{ textAlign: 'right' }}>{Number(it.quantity)}</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(Number(it.unit_price))}</td>
                <td style={{ textAlign: 'right' }}>%{Number(it.vat_rate)}</td>
                <td style={{ textAlign: 'right' }}><strong>{formatCurrency(Number(it.line_total))}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {data.notes && (
        <Card>
          <h3>{t('purchases:detail.notes')}</h3>
          <p>{data.notes}</p>
        </Card>
      )}
    </div>
  );
}
