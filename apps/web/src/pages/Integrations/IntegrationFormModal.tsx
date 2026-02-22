import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Input, Button, Select } from '@stok/ui';
import { integrationsApi, Integration, CreateIntegrationInput, UpdateIntegrationInput } from '../../api/integrations.api';
import { useToast } from '../../context/ToastContext';
import styles from './IntegrationFormModal.module.css';

interface Props {
  integration: Integration | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function IntegrationFormModal({ integration, onClose, onSuccess }: Props) {
  const { t } = useTranslation(['integrations', 'common']);
  const isEdit = !!integration;
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: integration?.name || '',
    type: integration?.type || 'e_commerce',
    provider: integration?.provider || 'trendyol',
    status: integration?.status || 'inactive',
    apiKey: (integration?.credentials?.apiKey as string) || '',
    apiSecret: (integration?.credentials?.apiSecret as string) || '',
    supplierId: (integration?.config?.supplierId as string) || '',
  });

  const typeOptions = [
    { value: 'e_commerce', label: t('integrations:types.e_commerce') },
    { value: 'bank', label: t('integrations:types.bank') },
    { value: 'payment', label: t('integrations:types.payment') },
    { value: 'crm', label: t('integrations:types.crm') },
    { value: 'other', label: t('integrations:types.other') },
  ];

  const providersByType: Record<string, Array<{ value: string; label: string }>> = {
    e_commerce: [
      { value: 'trendyol', label: t('integrations:providers.trendyol') },
      { value: 'hepsiburada', label: t('integrations:providers.hepsiburada') },
      { value: 'n11', label: t('integrations:providers.n11') },
      { value: 'amazon', label: t('integrations:providers.amazon') },
      { value: 'gittigidiyor', label: t('integrations:providers.gittigidiyor') },
    ],
    bank: [
      { value: 'akbank', label: t('integrations:providers.akbank') },
      { value: 'isbank', label: t('integrations:providers.isbank') },
      { value: 'garanti', label: t('integrations:providers.garanti') },
      { value: 'yapikredi', label: t('integrations:providers.yapikredi') },
      { value: 'ziraat', label: t('integrations:providers.ziraat') },
    ],
    payment: [
      { value: 'iyzico', label: t('integrations:providers.iyzico') },
      { value: 'paytr', label: t('integrations:providers.paytr') },
      { value: 'payu', label: t('integrations:providers.payu') },
      { value: 'stripe', label: t('integrations:providers.stripe') },
    ],
    crm: [
      { value: 'salesforce', label: t('integrations:providers.salesforce') },
      { value: 'hubspot', label: t('integrations:providers.hubspot') },
      { value: 'zoho', label: t('integrations:providers.zoho') },
    ],
    other: [{ value: 'custom', label: t('integrations:providers.custom') }],
  };

  const statusOptions = [
    { value: 'active', label: t('integrations:statuses.active') },
    { value: 'inactive', label: t('integrations:statuses.inactive') },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        const updateData: UpdateIntegrationInput = {
          name: formData.name,
          status: formData.status as 'active' | 'inactive',
          credentials: {
            apiKey: formData.apiKey,
            apiSecret: formData.apiSecret,
          },
          config: {
            supplierId: formData.supplierId,
          },
        };
        await integrationsApi.updateIntegration(integration.id, updateData);
      } else {
        const createData: CreateIntegrationInput = {
          name: formData.name,
          type: formData.type as CreateIntegrationInput['type'],
          provider: formData.provider,
          credentials: {
            apiKey: formData.apiKey,
            apiSecret: formData.apiSecret,
          },
          config: {
            supplierId: formData.supplierId,
          },
        };
        await integrationsApi.createIntegration(createData);
      }
      onSuccess();
    } catch (error) {
      showToast('error', t('integrations:toast.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  const availableProviders = providersByType[formData.type] || [];

  return (
    <Modal isOpen={true} title={isEdit ? t('integrations:form.editTitle') : t('integrations:form.newTitle')} onClose={onClose}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label={t('integrations:form.integrationName')}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        {!isEdit && (
          <>
            <Select
              label={t('integrations:form.type')}
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as Integration['type'],
                  provider: providersByType[e.target.value]?.[0]?.value || 'custom',
                })
              }
              options={typeOptions}
            />

            <Select
              label={t('integrations:form.provider')}
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              options={availableProviders}
            />
          </>
        )}

        {isEdit && (
          <Select
            label={t('integrations:form.status')}
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as Integration['status'] })}
            options={statusOptions}
          />
        )}

        <div className={styles.section}>
          <h3>{t('integrations:form.credentials')}</h3>
          <Input
            label={t('integrations:form.apiKey')}
            value={formData.apiKey}
            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
            type="password"
          />
          <Input
            label={t('integrations:form.apiSecret')}
            value={formData.apiSecret}
            onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
            type="password"
          />
        </div>

        {formData.type === 'e_commerce' && (
          <div className={styles.section}>
            <h3>{t('integrations:form.configuration')}</h3>
            <Input
              label={t('integrations:form.supplierId')}
              value={formData.supplierId}
              onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
            />
          </div>
        )}

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('integrations:form.cancel')}
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? t('integrations:form.saving') : t('integrations:form.save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
