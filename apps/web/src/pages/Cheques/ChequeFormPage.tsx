import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Input, Select } from '@stok/ui';
import { chequesApi, CreateChequeData } from '../../api/cheques.api';
import { customersApi, Customer } from '../../api/customers.api';
import { suppliersApi, Supplier } from '../../api/suppliers.api';
import { InlineEntityForm, SelectWithAdd } from '../../components/inline';
import { useToast } from '../../context/ToastContext';
import styles from './ChequeFormPage.module.css';

export function ChequeFormPage() {
  const { t } = useTranslation(['cheques', 'common']);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPartyModal, setShowPartyModal] = useState(false);

  const [form, setForm] = useState<CreateChequeData>({
    type: 'cek',
    direction: 'incoming',
    amount: 0,
    due_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  });

  useEffect(() => {
    (async () => {
      const [cRes, sRes] = await Promise.allSettled([
        customersApi.getAll({ limit: 1000 }),
        suppliersApi.getAll({ limit: 1000, isActive: 'true' }),
      ]);
      if (cRes.status === 'fulfilled') setCustomers(cRes.value.data);
      if (sRes.status === 'fulfilled') setSuppliers(sRes.value.data);
      setLoading(false);
    })();
  }, []);

  const handleSubmit = async () => {
    if (!form.customer_id && !form.supplier_id) {
      showToast('error', t('cheques:validation.partyRequired'));
      return;
    }
    if (form.amount <= 0) {
      showToast('error', t('cheques:validation.amountRequired'));
      return;
    }
    if (!form.due_date) {
      showToast('error', t('cheques:validation.dueDateRequired'));
      return;
    }

    setSaving(true);
    try {
      const res = await chequesApi.create(form);
      showToast('success', t('cheques:toast.created'));
      navigate(`/cheques/${res.data.id}`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('cheques:toast.saveError'));
    }
    setSaving(false);
  };

  if (loading) return <div className={styles.loading}>{t('common:labels.loading')}</div>;

  // Direction'a göre party tipini sınırla
  const isIncoming = form.direction === 'incoming';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Button variant="ghost" onClick={() => navigate('/cheques')}>&larr; {t('cheques:form.back')}</Button>
        <h1 className={styles.title}>{t('cheques:form.title')}</h1>
      </div>

      <div className={styles.card}>
        <h3>{t('cheques:form.basicInfo')}</h3>

        <div className={styles.row}>
          <div className={styles.field}>
            <label>{t('cheques:form.type')}</label>
            <Select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as 'cek' | 'senet' })}
              options={[
                { value: 'cek', label: t('cheques:types.cek') },
                { value: 'senet', label: t('cheques:types.senet') },
              ]}
              fullWidth
            />
          </div>
          <div className={styles.field}>
            <label>{t('cheques:form.direction')}</label>
            <Select
              value={form.direction}
              onChange={(e) => setForm({ ...form, direction: e.target.value as 'incoming' | 'outgoing', customer_id: undefined, supplier_id: undefined })}
              options={[
                { value: 'incoming', label: t('cheques:direction.incoming') },
                { value: 'outgoing', label: t('cheques:direction.outgoing') },
              ]}
              fullWidth
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label>{isIncoming ? t('cheques:form.fromCustomer') : t('cheques:form.toSupplier')}</label>
            {isIncoming ? (
              <SelectWithAdd
                value={form.customer_id || ''}
                onChange={(e) => setForm({ ...form, customer_id: e.target.value || undefined, supplier_id: undefined })}
                options={[{ value: '', label: t('cheques:form.selectCustomer') }, ...customers.map((c) => ({ value: c.id, label: c.name }))]}
                onAdd={() => setShowPartyModal(true)}
                addTitle={t('common:inlineEntity.addCustomer')}
              />
            ) : (
              <SelectWithAdd
                value={form.supplier_id || ''}
                onChange={(e) => setForm({ ...form, supplier_id: e.target.value || undefined, customer_id: undefined })}
                options={[{ value: '', label: t('cheques:form.selectSupplier') }, ...suppliers.map((s) => ({ value: s.id, label: s.name }))]}
                onAdd={() => setShowPartyModal(true)}
                addTitle={t('common:inlineEntity.addSupplier')}
              />
            )}
            <InlineEntityForm
              type={isIncoming ? 'customer' : 'supplier'}
              isOpen={showPartyModal}
              onClose={() => setShowPartyModal(false)}
              onCreated={(entity) => {
                if (isIncoming) {
                  setCustomers((prev) => [...prev, entity as Customer]);
                  setForm((f) => ({ ...f, customer_id: entity.id, supplier_id: undefined }));
                } else {
                  setSuppliers((prev) => [...prev, entity as Supplier]);
                  setForm((f) => ({ ...f, supplier_id: entity.id, customer_id: undefined }));
                }
              }}
            />
          </div>
          <div className={styles.field}>
            <label>{t('cheques:form.amount')}</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
              fullWidth
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label>{t('cheques:form.chequeNumber')}</label>
            <Input
              value={form.cheque_number || ''}
              onChange={(e) => setForm({ ...form, cheque_number: e.target.value })}
              placeholder={t('cheques:form.chequeNumberPlaceholder')}
              fullWidth
            />
          </div>
          <div className={styles.field}>
            <label>{t('cheques:form.bankName')}</label>
            <Input
              value={form.bank_name || ''}
              onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
              placeholder={t('cheques:form.bankPlaceholder')}
              fullWidth
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label>{t('cheques:form.drawerName')}</label>
            <Input
              value={form.drawer_name || ''}
              onChange={(e) => setForm({ ...form, drawer_name: e.target.value })}
              placeholder={t('cheques:form.drawerPlaceholder')}
              fullWidth
            />
          </div>
          <div className={styles.field}>
            <label>{t('cheques:form.issueDate')}</label>
            <Input
              type="date"
              value={form.issue_date || ''}
              onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
              fullWidth
            />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label>{t('cheques:form.dueDate')}</label>
            <Input
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              fullWidth
            />
          </div>
          <div className={styles.field}></div>
        </div>

        <div className={styles.field} style={{ marginTop: 12 }}>
          <label>{t('cheques:form.notes')}</label>
          <Input
            value={form.notes || ''}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder={t('cheques:form.notesPlaceholder')}
            fullWidth
          />
        </div>
      </div>

      <div className={styles.actions}>
        <Button variant="ghost" onClick={() => navigate('/cheques')} disabled={saving}>{t('common:buttons.cancel')}</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={saving}>
          {saving ? t('common:labels.saving') : t('cheques:form.save')}
        </Button>
      </div>
    </div>
  );
}
