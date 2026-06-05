import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Badge, Card, Modal, Select } from '@stok/ui';
import { chequesApi, Cheque } from '../../api/cheques.api';
import { accountsApi, Account } from '../../api/accounts.api';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './ChequeDetailPage.module.css';

type ActionStatus = 'collected' | 'cashed_out' | 'bounced' | 'returned' | 'in_portfolio';

export function ChequeDetailPage() {
  const { t } = useTranslation(['cheques', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();

  const [data, setData] = useState<Cheque | null>(null);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<ActionStatus | null>(null);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      chequesApi.getById(id),
      accountsApi.getAll({ limit: 100 }),
    ]).then(([cRes, aRes]) => {
      setData(cRes.data);
      setAccounts(aRes.data);
      const def = aRes.data.find((a: Account) => a.is_default);
      if (def) setSelectedAccount(def.id);
    }).catch(() => showToast('error', t('cheques:toast.loadError')))
      .finally(() => setLoading(false));
  }, [id]);

  const openAction = (action: ActionStatus) => {
    setModalAction(action);
    setModalOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!id || !modalAction || !data) return;
    const requiresAccount = modalAction === 'collected' || modalAction === 'cashed_out';
    if (requiresAccount && !selectedAccount) {
      showToast('error', t('cheques:validation.accountRequired'));
      return;
    }
    setSubmitting(true);
    try {
      const res = await chequesApi.updateStatus(id, {
        status: modalAction,
        account_id: requiresAccount ? selectedAccount : undefined,
      });
      setData(res.data);
      showToast('success', t('cheques:toast.statusUpdated'));
      setModalOpen(false);
      setModalAction(null);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('cheques:toast.saveError'));
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!id || !data) return;
    const confirmed = await confirm({
      message: t('cheques:confirm.delete'),
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await chequesApi.delete(id);
      showToast('success', t('cheques:toast.deleted'));
      navigate('/cheques');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('cheques:toast.deleteError'));
    }
  };

  if (loading) return <div className={styles.loading}>{t('common:labels.loading')}</div>;
  if (!data) return <div className={styles.error}>{t('cheques:detail.notFound')}</div>;

  const isIncoming = data.direction === 'incoming';
  const inPortfolio = data.status === 'in_portfolio';
  const statusVariant =
    data.status === 'collected' || data.status === 'cashed_out' ? 'success' :
    data.status === 'bounced' ? 'danger' :
    data.status === 'returned' ? 'default' : 'warning';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Button variant="ghost" onClick={() => navigate('/cheques')}>&larr; {t('cheques:detail.back')}</Button>
          <h1 className={styles.title}>
            {t(`cheques:types.${data.type}`)} — {data.cheque_number || '—'}
          </h1>
          <div className={styles.meta}>
            <Badge variant={isIncoming ? 'success' : 'warning'}>{t(`cheques:direction.${data.direction}`)}</Badge>
            <Badge variant={statusVariant}>{t(`cheques:statuses.${data.status}`)}</Badge>
            <span>{t('cheques:detail.dueDate')}: {formatDate(data.due_date)}</span>
          </div>
        </div>
        <div className={styles.actions}>
          {inPortfolio && isIncoming && (
            <Button variant="primary" onClick={() => openAction('collected')}>{t('cheques:actions.collect')}</Button>
          )}
          {inPortfolio && !isIncoming && (
            <Button variant="primary" onClick={() => openAction('cashed_out')}>{t('cheques:actions.cashOut')}</Button>
          )}
          {inPortfolio && (
            <>
              <Button variant="danger" onClick={() => openAction('bounced')}>{t('cheques:actions.bounce')}</Button>
              <Button variant="secondary" onClick={() => openAction('returned')}>{t('cheques:actions.return')}</Button>
            </>
          )}
          {!inPortfolio && (
            <Button variant="secondary" onClick={() => openAction('in_portfolio')}>{t('cheques:actions.revertToPortfolio')}</Button>
          )}
          <Button variant="danger" onClick={handleDelete}>{t('common:buttons.delete')}</Button>
        </div>
      </div>

      <div className={styles.grid}>
        <Card>
          <h3>{t('cheques:detail.info')}</h3>
          <dl className={styles.dl}>
            <dt>{t('cheques:columns.type')}</dt>
            <dd>{t(`cheques:types.${data.type}`)}</dd>
            <dt>{t('cheques:detail.party')}</dt>
            <dd>{data.customer_name || data.supplier_name || '-'}</dd>
            <dt>{t('cheques:columns.bank')}</dt>
            <dd>{data.bank_name || '-'}</dd>
            <dt>{t('cheques:form.drawerName')}</dt>
            <dd>{data.drawer_name || '-'}</dd>
            {data.issue_date && <><dt>{t('cheques:form.issueDate')}</dt><dd>{formatDate(data.issue_date)}</dd></>}
            <dt>{t('cheques:detail.createdBy')}</dt>
            <dd>{data.created_by_name || '-'}</dd>
          </dl>
        </Card>

        <Card>
          <h3>{t('cheques:detail.amounts')}</h3>
          <dl className={styles.dl}>
            <dt>{t('cheques:columns.amount')}</dt>
            <dd><strong className={styles.amount}>{formatCurrency(Number(data.amount))}</strong></dd>
            {data.account_name && (
              <>
                <dt>{t('cheques:detail.account')}</dt>
                <dd>{data.account_name}</dd>
              </>
            )}
            {data.status_changed_at && (
              <>
                <dt>{t('cheques:detail.statusChangedAt')}</dt>
                <dd>{formatDate(data.status_changed_at)}</dd>
              </>
            )}
          </dl>
        </Card>
      </div>

      {data.notes && (
        <Card>
          <h3>{t('cheques:detail.notes')}</h3>
          <p>{data.notes}</p>
        </Card>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalAction ? t(`cheques:actions.${modalAction === 'in_portfolio' ? 'revertToPortfolio' : modalAction === 'collected' ? 'collect' : modalAction === 'cashed_out' ? 'cashOut' : modalAction === 'bounced' ? 'bounce' : 'return'}`) : ''}
        size="sm"
      >
        <div className={styles.modalBody}>
          {(modalAction === 'collected' || modalAction === 'cashed_out') && (
            <>
              <p>{t(modalAction === 'collected' ? 'cheques:detail.collectHint' : 'cheques:detail.cashOutHint')}</p>
              <div className={styles.field}>
                <label>{t('cheques:detail.account')}</label>
                <Select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  options={[
                    { value: '', label: t('cheques:detail.selectAccount') },
                    ...accounts.map((a) => ({ value: a.id, label: `${a.name}${a.is_default ? ' ★' : ''}` })),
                  ]}
                  fullWidth
                />
              </div>
            </>
          )}
          {(modalAction === 'bounced' || modalAction === 'returned' || modalAction === 'in_portfolio') && (
            <p>{t(`cheques:detail.${modalAction === 'in_portfolio' ? 'revertHint' : modalAction === 'bounced' ? 'bounceHint' : 'returnHint'}`)}</p>
          )}
          <div className={styles.modalActions}>
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={submitting}>{t('common:buttons.cancel')}</Button>
            <Button variant="primary" onClick={handleConfirmAction} disabled={submitting}>
              {submitting ? t('common:labels.saving') : t('common:buttons.confirm')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
