import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Input } from '@stok/ui';
import { customersApi, Customer, CreateCustomerData } from '../../api/customers.api';
import { suppliersApi, Supplier, CreateSupplierData } from '../../api/suppliers.api';
import { useToast } from '../../context/ToastContext';
import styles from './InlineEntityForm.module.css';

export type EntityType = 'customer' | 'supplier';

interface InlineEntityFormProps {
  type: EntityType;
  isOpen: boolean;
  onClose: () => void;
  onCreated: (entity: Customer | Supplier) => void;
}

const EMPTY = { name: '', phone: '', email: '', address: '', tax_number: '', tax_office: '', notes: '' };

/**
 * Form içinden ayrılmadan hızlı müşteri/tedarikçi oluşturma modalı.
 * Tek bileşen iki entity'yi de karşılar (alanları ortak).
 */
export function InlineEntityForm({ type, isOpen, onClose, onCreated }: InlineEntityFormProps) {
  const { t } = useTranslation('common');
  const { showToast } = useToast();
  const isCustomer = type === 'customer';

  const [form, setForm] = useState({ ...EMPTY });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const close = () => {
    setForm({ ...EMPTY });
    setErrors({});
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = t('inlineEntity.nameRequired');
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = t('inlineEntity.invalidEmail');
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const res = isCustomer
        ? await customersApi.create(form as CreateCustomerData)
        : await suppliersApi.create(form as CreateSupplierData);
      const created = (res.data ?? (res as unknown)) as Customer | Supplier;
      showToast('success', t(isCustomer ? 'inlineEntity.customerCreated' : 'inlineEntity.supplierCreated'));
      onCreated(created);
      close();
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : t('inlineEntity.errorOccurred') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={t(isCustomer ? 'inlineEntity.newCustomer' : 'inlineEntity.newSupplier')}
      size="md"
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" onClick={close} disabled={loading}>{t('inlineEntity.cancel')}</Button>
          <Button onClick={handleSubmit} loading={loading}>{t('inlineEntity.save')}</Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {errors.form && <div className={styles.formError}>{errors.form}</div>}
        <div className={styles.grid}>
          <Input label={t('inlineEntity.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} fullWidth />
          <Input label={t('inlineEntity.phone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} fullWidth />
          <Input label={t('inlineEntity.email')} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} fullWidth />
          <Input label={t('inlineEntity.taxNumber')} value={form.tax_number} onChange={(e) => setForm({ ...form, tax_number: e.target.value })} fullWidth />
          <Input label={t('inlineEntity.taxOffice')} value={form.tax_office} onChange={(e) => setForm({ ...form, tax_office: e.target.value })} fullWidth />
          <Input label={t('inlineEntity.address')} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} fullWidth />
        </div>
      </form>
    </Modal>
  );
}
