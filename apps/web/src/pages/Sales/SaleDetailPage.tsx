import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Badge, Card, Modal, Input, Select } from '@stok/ui';
import { salesApi, SaleDetail } from '../../api/sales.api';
import { paymentsApi } from '../../api/payments.api';
import { eDocumentsApi } from '../../api/e-documents.api';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import { useTenant } from '../../context/TenantContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { PrintModal } from './PrintModal';
import styles from './SaleDetailPage.module.css';

export function SaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['sales', 'common']);
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();
  const [data, setData] = useState<SaleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [togglingInvoice, setTogglingInvoice] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [creatingEDoc, setCreatingEDoc] = useState(false);
  const { hasFeature } = useTenant();
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'nakit' | 'kredi_karti' | 'havale'>('nakit');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await salesApi.getDetail(id);
        setData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('sales:toast.dataLoadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleCancel = async () => {
    if (!data || !id) return;
    const confirmed = await confirm({ message: t('sales:confirm.cancelSale', { invoiceNumber: data.invoice_number }), variant: 'danger' });
    if (!confirmed) return;

    setCancelling(true);
    try {
      await salesApi.cancel(id);
      showToast('success', t('sales:toast.cancelSuccess'));
      // Refresh data
      const response = await salesApi.getDetail(id);
      setData(response.data);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('sales:toast.cancelError'));
    } finally {
      setCancelling(false);
    }
  };

  const handleAddPayment = async () => {
    if (!data || !id) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('error', t('sales:payment.amountInvalid'));
      return;
    }
    if (!data.customer_id) {
      showToast('error', t('sales:payment.noCustomer'));
      return;
    }
    setSavingPayment(true);
    try {
      await paymentsApi.create({
        customer_id: data.customer_id,
        sale_id: id,
        amount,
        method: paymentMethod,
        notes: paymentNotes || undefined,
      });
      showToast('success', t('sales:payment.success'));
      setShowPaymentModal(false);
      setPaymentAmount('');
      setPaymentNotes('');
      setPaymentMethod('nakit');
      const response = await salesApi.getDetail(id);
      setData(response.data);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('sales:payment.error'));
    } finally {
      setSavingPayment(false);
    }
  };

  const handleToggleInvoice = async () => {
    if (!data || !id) return;
    setTogglingInvoice(true);
    try {
      await salesApi.updateInvoiceIssued(id, !data.invoice_issued);
      showToast('success', data.invoice_issued ? t('sales:toast.invoiceRemoved') : t('sales:toast.invoiceMarked'));
      const response = await salesApi.getDetail(id);
      setData(response.data);
    } catch (err) {
      showToast('error', t('sales:toast.invoiceUpdateError'));
    } finally {
      setTogglingInvoice(false);
    }
  };

  const handleCreateEDocument = async () => {
    if (!data) return;
    setCreatingEDoc(true);
    try {
      await eDocumentsApi.create({ document_type: 'e_fatura', reference_type: 'sale', reference_id: data.id });
      showToast('success', t('eDocuments:toast.createSuccess'));
      navigate('/e-documents');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('eDocuments:toast.actionError'));
    } finally {
      setCreatingEDoc(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>{t('common:labels.loading')}</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>{error || t('sales:detail.notFound')}</div>
        <Button onClick={() => navigate('/sales')}>{t('sales:detail.goBack')}</Button>
      </div>
    );
  }

  const statusVariant = data.status === 'completed' ? 'success' : data.status === 'cancelled' ? 'danger' : 'warning';
  const canCancel = data.status === 'completed';

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Button variant="ghost" onClick={() => navigate('/sales')}>
            &#8592; {t('sales:detail.backToSales')}
          </Button>
          <h1 className={styles.title}>{data.invoice_number}</h1>
          <div className={styles.saleMeta}>
            <Badge variant={statusVariant}>
              {t(`common:saleStatuses.${data.status}`, { defaultValue: data.status })}
            </Badge>
            <span>{formatDateTime(data.sale_date)}</span>
          </div>
        </div>
        <div className={styles.headerRight}>
          <Button variant="secondary" onClick={() => setShowPrintModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, marginRight: 8 }}>
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            {t('sales:detail.print')}
          </Button>
          {data.status === 'completed' && data.payment_method === 'veresiye' && data.customer_id && (
            <Button variant="primary" onClick={() => setShowPaymentModal(true)}>
              {t('sales:detail.addPayment')}
            </Button>
          )}
          {data.status === 'completed' && (
            <Button variant="secondary" onClick={() => navigate(`/returns/new?saleId=${data.id}`)}>
              {t('sales:detail.createReturn')}
            </Button>
          )}
          {data.status === 'completed' && hasFeature('eDocuments') && (
            <Button variant="secondary" onClick={handleCreateEDocument} disabled={creatingEDoc}>
              {t('eDocuments:actions.createInvoice')}
            </Button>
          )}
          {canCancel && (
            <Button variant="danger" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? t('sales:detail.cancelling') : t('sales:detail.cancelSale')}
            </Button>
          )}
        </div>
      </div>

      {/* Info Grid */}
      <div className={styles.infoGrid}>
        {/* Sale Info Card */}
        <Card className={styles.infoCard}>
          <h3>{t('sales:detail.saleInfo')}</h3>
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('sales:detail.labels.invoiceNo')}</span>
              <span className={styles.infoValue}>{data.invoice_number}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('sales:detail.labels.date')}</span>
              <span className={styles.infoValue}>{formatDate(data.sale_date)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('sales:detail.labels.customer')}</span>
              <span className={styles.infoValue}>
                {data.customer_name ? (
                  <button
                    className={styles.linkButton}
                    onClick={() => data.customer_id && navigate(`/customers/${data.customer_id}`)}
                  >
                    {data.customer_name}
                  </button>
                ) : (
                  t('sales:detail.retailSale')
                )}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('sales:detail.labels.saleType')}</span>
              <span className={styles.infoValue}>
                {t(`common:saleTypes.${data.sale_type === 'wholesale' ? 'wholesale' : 'retail'}`)}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('sales:detail.labels.paymentMethod')}</span>
              <span className={styles.infoValue}>
                {t(`common:paymentMethods.${data.payment_method}`, { defaultValue: data.payment_method })}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('sales:detail.labels.invoiceStatus')}</span>
              <span className={styles.infoValue}>
                <Badge variant={data.invoice_issued ? 'success' : 'warning'}>
                  {data.invoice_issued ? t('sales:detail.invoiceIssued') : t('sales:detail.invoiceNotIssued')}
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleToggleInvoice}
                  disabled={togglingInvoice}
                  style={{ marginLeft: 8 }}
                >
                  {togglingInvoice ? '...' : data.invoice_issued ? t('sales:detail.markRemove') : t('sales:detail.markIssued')}
                </Button>
              </span>
            </div>
            {data.created_by_name && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('sales:detail.labels.createdBy')}</span>
                <span className={styles.infoValue}>{data.created_by_name}</span>
              </div>
            )}
            {data.due_date && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('sales:detail.labels.dueDate')}</span>
                <span className={styles.infoValue}>{formatDate(data.due_date)}</span>
              </div>
            )}
            {data.notes && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('sales:detail.labels.notes')}</span>
                <span className={styles.infoValue}>{data.notes}</span>
              </div>
            )}
            {data.has_renewal && (
              <>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>{t('sales:detail.labels.renewalDate')}</span>
                  <span className={styles.infoValue}>{data.renewal_date ? formatDate(data.renewal_date) : '-'}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>{t('sales:detail.labels.reminderDays')}</span>
                  <span className={styles.infoValue}>{t('sales:detail.reminderDaysValue', { days: data.reminder_days_before })}</span>
                </div>
                {data.reminder_note && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>{t('sales:detail.labels.reminderNote')}</span>
                    <span className={styles.infoValue}>{data.reminder_note}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        {/* Totals Card */}
        <Card className={styles.totalsCard}>
          <h3>{t('sales:detail.amountInfo')}</h3>
          <div className={styles.totalsList}>
            <div className={styles.totalItem}>
              <span className={styles.totalLabel}>{t('sales:detail.totals.subtotal')}</span>
              <span className={styles.totalValue}>{formatCurrency(data.subtotal)}</span>
            </div>
            {data.discount_amount > 0 && (
              <div className={styles.totalItem}>
                <span className={styles.totalLabel}>
                  {data.discount_rate > 0
                    ? t('sales:detail.totals.discountWithRate', { rate: data.discount_rate })
                    : t('sales:detail.totals.discount')}
                </span>
                <span className={`${styles.totalValue} ${styles.discount}`}>
                  -{formatCurrency(data.discount_amount)}
                </span>
              </div>
            )}
            <div className={styles.totalItem}>
              <span className={styles.totalLabel}>{t('sales:detail.totals.vatTotal')}</span>
              <span className={styles.totalValue}>{formatCurrency(data.vat_total)}</span>
            </div>
            <div className={`${styles.totalItem} ${styles.grandTotal}`}>
              <span className={styles.totalLabel}>{t('sales:detail.totals.grandTotal')}</span>
              <span className={styles.totalValue}>{formatCurrency(data.grand_total)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Sale Items */}
      <Card className={styles.itemsCard}>
        <h3>{t('sales:detail.itemsCount', { count: data.items.length })}</h3>
        <div className={styles.tableWrapper}>
          <table className={styles.itemsTable}>
            <thead>
              <tr>
                <th>{t('sales:detail.itemColumns.product')}</th>
                <th>{t('sales:detail.itemColumns.barcode')}</th>
                <th className={styles.alignRight}>{t('sales:detail.itemColumns.quantity')}</th>
                <th className={styles.alignRight}>{t('sales:detail.itemColumns.unitPrice')}</th>
                <th className={styles.alignRight}>{t('sales:detail.itemColumns.discount')}</th>
                <th className={styles.alignRight}>{t('sales:detail.itemColumns.vatRate')}</th>
                <th className={styles.alignRight}>{t('sales:detail.itemColumns.vatAmount')}</th>
                <th className={styles.alignRight}>{t('sales:detail.itemColumns.total')}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.product_name || '-'}
                    {(item as any).product_is_active === false && <span className={styles.inactiveBadge}>({t('common:labels.inactive')})</span>}
                  </td>
                  <td>{item.barcode || '-'}</td>
                  <td className={styles.alignRight}>{parseFloat(String(item.quantity))}</td>
                  <td className={styles.alignRight}>{formatCurrency(item.unit_price)}</td>
                  <td className={styles.alignRight}>
                    {item.discount_rate > 0 ? `%${item.discount_rate}` : '-'}
                  </td>
                  <td className={styles.alignRight}>%{item.vat_rate}</td>
                  <td className={styles.alignRight}>{formatCurrency(item.vat_amount)}</td>
                  <td className={styles.alignRight}>{formatCurrency(item.line_total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={7}>{t('sales:detail.totals.subtotal')}</td>
                <td className={styles.alignRight}>{formatCurrency(data.subtotal)}</td>
              </tr>
              {data.discount_amount > 0 && (
                <tr>
                  <td colSpan={7}>{t('sales:detail.totals.discount')}</td>
                  <td className={styles.alignRight}>-{formatCurrency(data.discount_amount)}</td>
                </tr>
              )}
              <tr>
                <td colSpan={7}>{t('sales:detail.totals.vatTotal')}</td>
                <td className={styles.alignRight}>{formatCurrency(data.vat_total)}</td>
              </tr>
              <tr className={styles.footerGrandTotal}>
                <td colSpan={7}>{t('sales:detail.totals.grandTotal')}</td>
                <td className={styles.alignRight}>{formatCurrency(data.grand_total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Payments */}
      <Card className={styles.paymentsCard}>
        <h3>{t('sales:detail.paymentsCount', { count: data.payments.length })}</h3>
        {data.payments.length === 0 ? (
          <div className={styles.emptyState}>
            {data.payment_method === 'veresiye'
              ? t('sales:detail.emptyPaymentCredit')
              : t('sales:detail.emptyPaymentCash')}
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.paymentsTable}>
              <thead>
                <tr>
                  <th>{t('sales:detail.paymentColumns.date')}</th>
                  <th>{t('sales:detail.paymentColumns.paymentMethod')}</th>
                  <th>{t('sales:detail.paymentColumns.notes')}</th>
                  <th className={styles.alignRight}>{t('sales:detail.paymentColumns.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{formatDate(payment.payment_date)}</td>
                    <td>
                      {t(`common:paymentMethods.${payment.method}`, { defaultValue: payment.method })}
                    </td>
                    <td>{payment.notes || '-'}</td>
                    <td className={`${styles.alignRight} ${styles.paymentAmount}`}>
                      {formatCurrency(payment.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3}>{t('sales:detail.totals.totalPayment')}</td>
                  <td className={`${styles.alignRight} ${styles.paymentAmount}`}>
                    {formatCurrency(data.payments.reduce((sum, p) => sum + p.amount, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>

      {/* Print Modal */}
      <PrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        data={data}
      />

      {/* Tahsilat Ekle Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title={t('sales:payment.title')}
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14 }}>
              {t('sales:payment.amountLabel')}
            </label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder={data.grand_total ? String(data.grand_total) : '0'}
              fullWidth
              autoFocus
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14 }}>
              {t('sales:payment.methodLabel')}
            </label>
            <Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as 'nakit' | 'kredi_karti' | 'havale')}
              options={[
                { value: 'nakit', label: t('sales:stepSettings.paymentMethods.nakit') },
                { value: 'kredi_karti', label: t('sales:stepSettings.paymentMethods.kredi_karti') },
                { value: 'havale', label: t('sales:stepSettings.paymentMethods.havale') },
              ]}
              fullWidth
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 14 }}>
              {t('sales:payment.notesLabel')}
            </label>
            <Input
              type="text"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder={t('sales:payment.notesPlaceholder')}
              fullWidth
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Button variant="ghost" onClick={() => setShowPaymentModal(false)} disabled={savingPayment}>
              {t('common:buttons.cancel')}
            </Button>
            <Button variant="primary" onClick={handleAddPayment} disabled={savingPayment}>
              {savingPayment ? t('sales:payment.saving') : t('sales:payment.save')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
