import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Input } from '@stok/ui';
import { Customer, CreateCustomerData, customersApi } from '../../../api/customers.api';
import { useToast } from '../../../context/ToastContext';
import styles from '../SaleFormPage.module.css';

interface InlineCustomerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (customer: Customer) => void;
}

export function InlineCustomerForm({ isOpen, onClose, onCreated }: InlineCustomerFormProps) {
  const { t } = useTranslation(['sales', 'common']);
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateCustomerData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    tax_number: '',
    tax_office: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({ name: '', phone: '', email: '', address: '', tax_number: '', tax_office: '', notes: '' });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = t('sales:inlineCustomer.errors.nameRequired');
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('sales:inlineCustomer.errors.invalidEmail');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await customersApi.create(formData);
      const customer = response.data ?? response as unknown as Customer;
      showToast('success', t('sales:toast.customerCreated'));
      onCreated(customer);
      handleClose();
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : t('sales:toast.errorOccurred') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('sales:inlineCustomer.title')}
      size="lg"
      footer={
        <div className={styles.modalFooter}>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>{t('sales:inlineCustomer.cancel')}</Button>
          <Button onClick={handleSubmit} loading={loading}>{t('sales:inlineCustomer.save')}</Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className={styles.inlineForm}>
        {errors.form && <div className={styles.formError}>{errors.form}</div>}
        <div className={styles.inlineFormGrid}>
          <Input label={t('sales:inlineCustomer.customerName')} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} error={errors.name} fullWidth />
          <Input label={t('sales:inlineCustomer.phone')} value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} fullWidth />
          <Input label={t('sales:inlineCustomer.email')} type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} error={errors.email} fullWidth />
          <Input label={t('sales:inlineCustomer.taxNumber')} value={formData.tax_number || ''} onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })} fullWidth />
          <Input label={t('sales:inlineCustomer.taxOffice')} value={formData.tax_office || ''} onChange={(e) => setFormData({ ...formData, tax_office: e.target.value })} fullWidth />
        </div>
        <Input label={t('sales:inlineCustomer.address')} value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} fullWidth />
        <div className={styles.textareaWrapper}>
          <label className={styles.label}>{t('sales:inlineCustomer.notes')}</label>
          <textarea className={styles.textarea} value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} />
        </div>
      </form>
    </Modal>
  );
}
