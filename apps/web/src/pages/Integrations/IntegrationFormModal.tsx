import { useState } from 'react';
import { Modal, Input, Button, Select } from '@stok/ui';
import { integrationsApi, Integration, CreateIntegrationInput, UpdateIntegrationInput } from '../../api/integrations.api';
import { useToast } from '../../context/ToastContext';
import styles from './IntegrationFormModal.module.css';

interface Props {
  integration: Integration | null;
  onClose: () => void;
  onSuccess: () => void;
}

const typeOptions = [
  { value: 'e_commerce', label: 'E-Ticaret' },
  { value: 'bank', label: 'Banka' },
  { value: 'payment', label: 'Odeme' },
  { value: 'crm', label: 'CRM' },
  { value: 'other', label: 'Diger' },
];

const providersByType: Record<string, Array<{ value: string; label: string }>> = {
  e_commerce: [
    { value: 'trendyol', label: 'Trendyol' },
    { value: 'hepsiburada', label: 'Hepsiburada' },
    { value: 'n11', label: 'N11' },
    { value: 'amazon', label: 'Amazon' },
    { value: 'gittigidiyor', label: 'GittiGidiyor' },
  ],
  bank: [
    { value: 'akbank', label: 'Akbank' },
    { value: 'isbank', label: 'Is Bankasi' },
    { value: 'garanti', label: 'Garanti' },
    { value: 'yapikredi', label: 'Yapi Kredi' },
    { value: 'ziraat', label: 'Ziraat' },
  ],
  payment: [
    { value: 'iyzico', label: 'iyzico' },
    { value: 'paytr', label: 'PayTR' },
    { value: 'payu', label: 'PayU' },
    { value: 'stripe', label: 'Stripe' },
  ],
  crm: [
    { value: 'salesforce', label: 'Salesforce' },
    { value: 'hubspot', label: 'HubSpot' },
    { value: 'zoho', label: 'Zoho' },
  ],
  other: [{ value: 'custom', label: 'Ozel' }],
};

const statusOptions = [
  { value: 'active', label: 'Aktif' },
  { value: 'inactive', label: 'Pasif' },
];

export function IntegrationFormModal({ integration, onClose, onSuccess }: Props) {
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
      showToast('error', 'Entegrasyon kaydedilemedi');
    } finally {
      setLoading(false);
    }
  };

  const availableProviders = providersByType[formData.type] || [];

  return (
    <Modal isOpen={true} title={isEdit ? 'Entegrasyon Duzenle' : 'Yeni Entegrasyon'} onClose={onClose}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Entegrasyon Adi"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        {!isEdit && (
          <>
            <Select
              label="Tip"
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
              label="Saglayici"
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              options={availableProviders}
            />
          </>
        )}

        {isEdit && (
          <Select
            label="Durum"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as Integration['status'] })}
            options={statusOptions}
          />
        )}

        <div className={styles.section}>
          <h3>Kimlik Bilgileri</h3>
          <Input
            label="API Key"
            value={formData.apiKey}
            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
            type="password"
          />
          <Input
            label="API Secret"
            value={formData.apiSecret}
            onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
            type="password"
          />
        </div>

        {formData.type === 'e_commerce' && (
          <div className={styles.section}>
            <h3>Yapilandirma</h3>
            <Input
              label="Satici ID"
              value={formData.supplierId}
              onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
            />
          </div>
        )}

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Iptal
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
