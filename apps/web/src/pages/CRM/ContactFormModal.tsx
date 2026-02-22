import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Input, Button, Select } from '@stok/ui';
import { crmApi, CrmContact, CreateContactInput } from '../../api/crm.api';
import { useToast } from '../../context/ToastContext';
import styles from './ContactFormModal.module.css';

interface Props {
  contact: CrmContact | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ContactFormModal({ contact, onClose, onSuccess }: Props) {
  const { t } = useTranslation(['crm', 'common']);
  const isEdit = !!contact;
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateContactInput>({
    name: contact?.name || '',
    title: contact?.title || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    mobile: contact?.mobile || '',
    status: contact?.status || 'lead',
    source: contact?.source || undefined,
    notes: contact?.notes || '',
    next_follow_up: contact?.next_follow_up?.split('T')[0] || '',
  });

  const statusOptions = [
    { value: 'lead', label: t('crm:status.lead') },
    { value: 'prospect', label: t('crm:status.prospect') },
    { value: 'customer', label: t('crm:status.customer') },
    { value: 'inactive', label: t('crm:status.inactive') },
  ];

  const sourceOptions = [
    { value: '', label: t('crm:form.sourceSelect') },
    { value: 'website', label: t('crm:source.website') },
    { value: 'referral', label: t('crm:source.referral') },
    { value: 'social', label: t('crm:source.social') },
    { value: 'cold_call', label: t('crm:source.cold_call') },
    { value: 'event', label: t('crm:source.event') },
    { value: 'other', label: t('crm:source.other') },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        source: formData.source || undefined,
        next_follow_up: formData.next_follow_up || undefined,
      };

      if (isEdit) {
        await crmApi.updateContact(contact.id, data);
      } else {
        await crmApi.createContact(data);
      }
      onSuccess();
    } catch (error) {
      showToast('error', t('crm:toast.saveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} title={isEdit ? t('crm:form.editTitle') : t('crm:form.createTitle')} onClose={onClose}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.row}>
          <Input
            label={t('crm:form.nameLabel')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label={t('crm:form.titleLabel')}
            value={formData.title || ''}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        <div className={styles.row}>
          <Input
            label={t('crm:form.emailLabel')}
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label={t('crm:form.phoneLabel')}
            value={formData.phone || ''}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div className={styles.row}>
          <Input
            label={t('crm:form.mobileLabel')}
            value={formData.mobile || ''}
            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
          />
          <Select
            label={t('crm:form.statusLabel')}
            value={formData.status || 'lead'}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value as CrmContact['status'] })
            }
            options={statusOptions}
          />
        </div>

        <div className={styles.row}>
          <Select
            label={t('crm:form.sourceLabel')}
            value={formData.source || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                source: e.target.value as CrmContact['source'] | undefined,
              })
            }
            options={sourceOptions}
          />
          <Input
            label={t('crm:form.nextFollowUpLabel')}
            type="date"
            value={formData.next_follow_up || ''}
            onChange={(e) => setFormData({ ...formData, next_follow_up: e.target.value })}
          />
        </div>

        <div className={styles.textareaGroup}>
          <label className={styles.label}>{t('crm:form.notesLabel')}</label>
          <textarea
            className={styles.textarea}
            value={formData.notes || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('crm:buttons.cancel')}
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? t('crm:buttons.saving') : t('crm:buttons.save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
