import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Badge, Card, Select } from '@stok/ui';
import { Quote, QuoteItem, quotesApi, ConvertToSaleData } from '../../api/quotes.api';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './QuoteDetailPage.module.css';

export function QuoteDetailPage() {
  const { t } = useTranslation(['quotes', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertPaymentMethod, setConvertPaymentMethod] = useState<ConvertToSaleData['payment_method']>('nakit');

  const PAYMENT_METHOD_OPTIONS = [
    { value: 'nakit', label: t('common:paymentMethods.nakit') },
    { value: 'kredi_karti', label: t('common:paymentMethods.kredi_karti') },
    { value: 'havale', label: t('common:paymentMethods.havale') },
    { value: 'veresiye', label: t('common:paymentMethods.veresiye') },
  ];

  useEffect(() => {
    if (!id) return;

    const fetchQuote = async () => {
      try {
        setLoading(true);
        const response = await quotesApi.getById(id);
        setQuote(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('quotes:toast.loadSingleError'));
      } finally {
        setLoading(false);
      }
    };

    fetchQuote();
  }, [id, t]);

  const handleSend = async () => {
    if (!quote) return;
    setActionLoading(true);
    try {
      const response = await quotesApi.send(quote.id);
      setQuote({ ...quote, ...response.data });
      showToast('success', t('quotes:toast.sent'));
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('quotes:toast.operationFailed'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!quote) return;
    setActionLoading(true);
    try {
      const response = await quotesApi.accept(quote.id);
      setQuote({ ...quote, ...response.data });
      showToast('success', t('quotes:toast.accepted'));
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('quotes:toast.operationFailed'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!quote) return;
    const confirmed = await confirm({ message: t('quotes:confirm.rejectMessage'), variant: 'warning' });
    if (!confirmed) return;
    setActionLoading(true);
    try {
      const response = await quotesApi.reject(quote.id);
      setQuote({ ...quote, ...response.data });
      showToast('success', t('quotes:toast.rejected'));
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('quotes:toast.operationFailed'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToSale = async () => {
    if (!quote) return;
    setActionLoading(true);
    try {
      await quotesApi.convertToSale(quote.id, { payment_method: convertPaymentMethod });
      showToast('success', t('quotes:toast.converted'));
      setShowConvertModal(false);
      // Refresh quote data
      const response = await quotesApi.getById(quote.id);
      setQuote(response.data);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('quotes:toast.operationFailed'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!quote) return;
    const confirmed = await confirm({ message: t('quotes:confirm.deleteMessage', { number: quote.quote_number }), variant: 'danger' });
    if (!confirmed) return;
    setActionLoading(true);
    try {
      await quotesApi.delete(quote.id);
      showToast('success', t('quotes:toast.deleted'));
      navigate('/quotes');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('quotes:toast.deleteFailed'));
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'converted':
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'expired':
        return 'warning';
      case 'sent':
        return 'info';
      default:
        return 'default';
    }
  };

  const getValidityStatus = () => {
    if (!quote) return null;
    if (['converted', 'rejected', 'expired'].includes(quote.status)) return null;

    const validUntil = new Date(quote.valid_until);
    const today = new Date();
    const diffDays = Math.ceil((validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: t('quotes:detail.expired'), variant: 'danger' as const };
    if (diffDays === 0) return { text: t('quotes:detail.lastDay'), variant: 'warning' as const };
    if (diffDays <= 3) return { text: t('quotes:detail.daysLeft', { count: diffDays }), variant: 'warning' as const };
    return { text: t('quotes:detail.daysLeft', { count: diffDays }), variant: 'default' as const };
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>{t('quotes:detail.loading')}</div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>{error || t('quotes:detail.notFound')}</div>
        <Button onClick={() => navigate('/quotes')}>{t('quotes:detail.goBack')}</Button>
      </div>
    );
  }

  const validityStatus = getValidityStatus();
  const canSend = quote.status === 'draft';
  const canAcceptReject = ['draft', 'sent'].includes(quote.status);
  const canConvert = ['draft', 'sent', 'accepted'].includes(quote.status);
  const canDelete = quote.status !== 'converted';

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Button variant="ghost" onClick={() => navigate('/quotes')}>
            {t('quotes:form.backToQuotes')}
          </Button>
          <h1 className={styles.title}>{quote.quote_number}</h1>
          <div className={styles.quoteMeta}>
            <Badge variant={getStatusBadgeVariant(quote.status)}>
              {t(`quotes:statuses.${quote.status}`, { defaultValue: quote.status })}
            </Badge>
            {quote.customer_name && <span className={styles.customerName}>{quote.customer_name}</span>}
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.totalCard}>
            <span className={styles.totalLabel}>{t('quotes:detail.totalAmount')}</span>
            <span className={styles.totalValue}>{formatCurrency(quote.grand_total)}</span>
            {validityStatus && (
              <span className={styles.validityBadge}>
                <Badge variant={validityStatus.variant}>
                  {validityStatus.text}
                </Badge>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quote Info */}
      <div className={styles.infoGrid}>
        <Card className={styles.infoCard}>
          <h3>{t('quotes:detail.quoteInfo')}</h3>
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('quotes:detail.quoteNo')}</span>
              <span className={styles.infoValue}>{quote.quote_number}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('quotes:detail.date')}</span>
              <span className={styles.infoValue}>{formatDate(quote.quote_date)}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('quotes:detail.validityDate')}</span>
              <span className={`${styles.infoValue} ${validityStatus?.variant === 'danger' ? styles.expired : validityStatus?.variant === 'warning' ? styles.warning : ''}`}>
                {formatDate(quote.valid_until)}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('quotes:detail.customer')}</span>
              <span className={styles.infoValue}>{quote.customer_name || t('quotes:detail.customerNotSpecified')}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('quotes:detail.vatIncluded')}</span>
              <span className={styles.infoValue}>{quote.include_vat ? t('quotes:detail.yes') : t('quotes:detail.no')}</span>
            </div>
            {quote.notes && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('quotes:detail.notes')}</span>
                <span className={styles.infoValue}>{quote.notes}</span>
              </div>
            )}
            {quote.created_by_name && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('quotes:detail.createdBy')}</span>
                <span className={styles.infoValue}>{quote.created_by_name}</span>
              </div>
            )}
          </div>
        </Card>

        <Card className={styles.actionsCard}>
          <h3>{t('quotes:detail.operations')}</h3>
          <div className={styles.actionButtons}>
            {canSend && (
              <Button onClick={handleSend} disabled={actionLoading}>
                {t('quotes:actions.send')}
              </Button>
            )}
            {canAcceptReject && (
              <>
                <Button variant="secondary" onClick={handleAccept} disabled={actionLoading}>
                  {t('quotes:actions.acceptFull')}
                </Button>
                <Button variant="ghost" onClick={handleReject} disabled={actionLoading}>
                  {t('quotes:actions.rejectFull')}
                </Button>
              </>
            )}
            {canConvert && (
              <Button variant="primary" onClick={() => setShowConvertModal(true)} disabled={actionLoading}>
                {t('quotes:actions.convertToSale')}
              </Button>
            )}
            {canDelete && (
              <Button variant="ghost" onClick={handleDelete} disabled={actionLoading} className={styles.deleteButton}>
                {t('quotes:actions.delete')}
              </Button>
            )}
          </div>
          {quote.converted_sale_id && (
            <div className={styles.convertedInfo}>
              <span className={styles.convertedLabel}>{t('quotes:detail.convertedToSale')}</span>
              <Button variant="ghost" size="sm" onClick={() => navigate(`/sales/${quote.converted_sale_id}`)}>
                {t('quotes:actions.viewSale')}
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* Quote Items */}
      <Card className={styles.itemsCard}>
        <h3>{t('quotes:detail.quoteItems')}</h3>
        <div className={styles.itemsTableContainer}>
          <table className={styles.itemsTable}>
            <thead>
              <tr>
                <th>{t('quotes:detail.productColumn')}</th>
                <th className={styles.alignRight}>{t('quotes:detail.quantityColumn')}</th>
                <th className={styles.alignRight}>{t('quotes:detail.unitPriceColumn')}</th>
                <th className={styles.alignRight}>{t('quotes:detail.discountColumn')}</th>
                <th className={styles.alignRight}>{t('quotes:detail.vatColumn')}</th>
                <th className={styles.alignRight}>{t('quotes:detail.totalColumn')}</th>
              </tr>
            </thead>
            <tbody>
              {quote.items && quote.items.length > 0 ? (
                quote.items.map((item: QuoteItem) => (
                  <tr key={item.id}>
                    <td className={styles.productCell}>
                      <span className={styles.productName}>{item.product_name}</span>
                    </td>
                    <td className={styles.alignRight}>{item.quantity}</td>
                    <td className={styles.alignRight}>{formatCurrency(item.unit_price)}</td>
                    <td className={styles.alignRight}>
                      {item.discount_rate > 0 ? `%${item.discount_rate}` : '-'}
                    </td>
                    <td className={styles.alignRight}>%{item.vat_rate}</td>
                    <td className={styles.alignRight}>{formatCurrency(item.line_total)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className={styles.emptyItems}>
                    {t('quotes:detail.noItems')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className={styles.totalsSection}>
          <div className={styles.totalsGrid}>
            <div className={styles.totalRow}>
              <span className={styles.totalRowLabel}>{t('quotes:detail.subtotal')}</span>
              <span className={styles.totalRowValue}>{formatCurrency(quote.subtotal)}</span>
            </div>
            {(quote.discount_amount > 0 || quote.discount_rate > 0) && (
              <div className={styles.totalRow}>
                <span className={styles.totalRowLabel}>
                  {t('quotes:detail.discountLabel')} {quote.discount_rate > 0 && `(%${quote.discount_rate})`}
                </span>
                <span className={styles.totalRowValue}>-{formatCurrency(quote.discount_amount)}</span>
              </div>
            )}
            <div className={styles.totalRow}>
              <span className={styles.totalRowLabel}>{t('quotes:detail.vatTotal')}</span>
              <span className={styles.totalRowValue}>{formatCurrency(quote.vat_total)}</span>
            </div>
            <div className={`${styles.totalRow} ${styles.grandTotalRow}`}>
              <span className={styles.totalRowLabel}>{t('quotes:detail.grandTotal')}</span>
              <span className={styles.totalRowValue}>{formatCurrency(quote.grand_total)}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Convert to Sale Modal */}
      {showConvertModal && (
        <div className={styles.modalOverlay} onClick={() => setShowConvertModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>{t('quotes:convertModal.title')}</h3>
            <p className={styles.modalDescription}>
              {t('quotes:convertModal.description')}
            </p>
            <div className={styles.modalField}>
              <label className={styles.modalLabel}>{t('quotes:convertModal.paymentMethod')}</label>
              <Select
                options={PAYMENT_METHOD_OPTIONS}
                value={convertPaymentMethod}
                onChange={(e) => setConvertPaymentMethod(e.target.value as ConvertToSaleData['payment_method'])}
              />
            </div>
            <div className={styles.modalActions}>
              <Button variant="ghost" onClick={() => setShowConvertModal(false)} disabled={actionLoading}>
                {t('quotes:convertModal.cancel')}
              </Button>
              <Button variant="primary" onClick={handleConvertToSale} disabled={actionLoading}>
                {actionLoading ? t('quotes:detail.converting') : t('quotes:detail.convert')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
