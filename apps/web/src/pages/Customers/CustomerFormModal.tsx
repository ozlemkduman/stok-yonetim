import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Input } from '@stok/ui';
import { Customer, CreateCustomerData } from '../../api/customers.api';
import styles from './CustomerFormModal.module.css';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCustomerData) => Promise<void>;
  customer?: Customer | null;
}

export function CustomerFormModal({
  isOpen,
  onClose,
  onSubmit,
  customer,
}: CustomerFormModalProps) {
  const { t } = useTranslation(['customers', 'common']);
  const [formData, setFormData] = useState<CreateCustomerData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    tax_number: '',
    tax_office: '',
    notes: '',
    renewal_red_days: 30,
    renewal_yellow_days: 60,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        tax_number: customer.tax_number || '',
        tax_office: customer.tax_office || '',
        notes: customer.notes || '',
        renewal_red_days: customer.renewal_red_days || 30,
        renewal_yellow_days: customer.renewal_yellow_days || 60,
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        tax_number: '',
        tax_office: '',
        notes: '',
        renewal_red_days: 30,
        renewal_yellow_days: 60,
      });
    }
    setErrors({});
  }, [customer, isOpen]);

  const handleChange = (field: keyof CreateCustomerData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('customers:form.errors.nameRequired');
    } else if (formData.name.length < 2) {
      newErrors.name = t('customers:form.errors.nameMinLength');
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('customers:form.errors.emailInvalid');
    }

    const redDays = Number(formData.renewal_red_days || 30);
    const yellowDays = Number(formData.renewal_yellow_days || 60);
    if (redDays < 1) {
      newErrors.renewal_red_days = t('customers:form.errors.minOneDays');
    }
    if (yellowDays < 1) {
      newErrors.renewal_yellow_days = t('customers:form.errors.minOneDays');
    }
    if (redDays >= yellowDays) {
      newErrors.renewal_red_days = t('customers:form.errors.redMustBeLessThanYellow');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : t('customers:form.errors.generic'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? t('customers:form.editTitle') : t('customers:form.createTitle')}
      size="lg"
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t('customers:form.cancel')}
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {customer ? t('customers:form.update') : t('customers:form.save')}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {errors.form && <div className={styles.formError}>{errors.form}</div>}

        <div className={styles.grid}>
          <Input
            label={t('customers:form.customerName')}
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            placeholder={t('customers:form.namePlaceholder')}
            fullWidth
          />

          <Input
            label={t('customers:form.phone')}
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder={t('customers:form.phonePlaceholder')}
            fullWidth
          />

          <Input
            label={t('customers:form.email')}
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            error={errors.email}
            placeholder={t('customers:form.emailPlaceholder')}
            fullWidth
          />

          <Input
            label={t('customers:form.taxNumber')}
            value={formData.tax_number}
            onChange={(e) => handleChange('tax_number', e.target.value)}
            placeholder={t('customers:form.taxNumberPlaceholder')}
            fullWidth
          />

          <Input
            label={t('customers:form.taxOffice')}
            value={formData.tax_office}
            onChange={(e) => handleChange('tax_office', e.target.value)}
            placeholder={t('customers:form.taxOfficePlaceholder')}
            fullWidth
          />
        </div>

        <Input
          label={t('customers:form.address')}
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder={t('customers:form.addressPlaceholder')}
          fullWidth
        />

        <div className={styles.textareaWrapper}>
          <label className={styles.label}>{t('customers:form.notes')}</label>
          <textarea
            className={styles.textarea}
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder={t('customers:form.notesPlaceholder')}
            rows={3}
          />
        </div>

        <div className={styles.sectionDivider}>
          <span className={styles.sectionTitle}>{t('customers:form.renewalSettings')}</span>
          <span className={styles.sectionHint}>{t('customers:form.renewalSettingsHint')}</span>
        </div>

        <div className={styles.grid}>
          <Input
            label={t('customers:form.renewalRedDays')}
            type="number"
            value={String(formData.renewal_red_days || 30)}
            onChange={(e) => handleChange('renewal_red_days', parseInt(e.target.value) || 1)}
            error={errors.renewal_red_days}
            placeholder={t('customers:form.renewalRedDaysPlaceholder')}
            fullWidth
          />

          <Input
            label={t('customers:form.renewalYellowDays')}
            type="number"
            value={String(formData.renewal_yellow_days || 60)}
            onChange={(e) => handleChange('renewal_yellow_days', parseInt(e.target.value) || 1)}
            error={errors.renewal_yellow_days}
            placeholder={t('customers:form.renewalYellowDaysPlaceholder')}
            fullWidth
          />
        </div>
      </form>
    </Modal>
  );
}
