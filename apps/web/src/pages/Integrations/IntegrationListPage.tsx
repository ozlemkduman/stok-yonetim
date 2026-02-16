import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Card, type Column } from '@stok/ui';
import { integrationsApi, Integration } from '../../api/integrations.api';
import { IntegrationFormModal } from './IntegrationFormModal';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import styles from './IntegrationListPage.module.css';

const typeLabels: Record<string, string> = {
  e_commerce: 'E-Ticaret',
  bank: 'Banka',
  payment: 'Odeme',
  crm: 'CRM',
  other: 'Diger',
};

const statusLabels: Record<string, string> = {
  active: 'Aktif',
  inactive: 'Pasif',
  error: 'Hata',
};

const providerLabels: Record<string, string> = {
  trendyol: 'Trendyol',
  hepsiburada: 'Hepsiburada',
  n11: 'N11',
  amazon: 'Amazon',
  gittigidiyor: 'GittiGidiyor',
  akbank: 'Akbank',
  isbank: 'Is Bankasi',
  garanti: 'Garanti',
  yapikredi: 'Yapi Kredi',
  ziraat: 'Ziraat',
  iyzico: 'iyzico',
  paytr: 'PayTR',
  payu: 'PayU',
  stripe: 'Stripe',
  salesforce: 'Salesforce',
  hubspot: 'HubSpot',
  zoho: 'Zoho',
  custom: 'Ozel',
};

export function IntegrationListPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const fetchIntegrations = async () => {
    try {
      const response = await integrationsApi.getIntegrations();
      setIntegrations(response.data);
    } catch (error) {
      showToast('error', 'Entegrasyonlar yuklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleAdd = () => {
    setSelectedIntegration(null);
    setModalOpen(true);
  };

  const handleEdit = (integration: Integration) => {
    setSelectedIntegration(integration);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({ message: 'Bu entegrasyonu silmek istediginize emin misiniz?', variant: 'danger' });
    if (!confirmed) return;
    try {
      await integrationsApi.deleteIntegration(id);
      showToast('success', 'Entegrasyon silindi');
      fetchIntegrations();
    } catch (error) {
      showToast('error', 'Entegrasyon silinemedi');
    }
  };

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    try {
      const response = await integrationsApi.testConnection(id);
      showToast('success', response.data.message);
      fetchIntegrations();
    } catch (error) {
      showToast('error', 'Baglanti testi basarisiz');
    } finally {
      setTestingId(null);
    }
  };

  const handleSyncOrders = async (id: string) => {
    setSyncingId(id);
    try {
      const response = await integrationsApi.syncOrders(id);
      showToast('success', `${response.data.syncedCount} siparis senkronize edildi`);
    } catch (error) {
      showToast('error', 'Senkronizasyon basarisiz');
    } finally {
      setSyncingId(null);
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedIntegration(null);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    fetchIntegrations();
  };

  const columns: Column<Integration>[] = [
    { key: 'name', header: 'Ad', width: '20%' },
    {
      key: 'type',
      header: 'Tip',
      width: '12%',
      render: (item) => typeLabels[item.type] || item.type,
    },
    {
      key: 'provider',
      header: 'Saglayici',
      width: '15%',
      render: (item) => providerLabels[item.provider] || item.provider,
    },
    {
      key: 'status',
      header: 'Durum',
      width: '10%',
      render: (item) => (
        <span className={`${styles.badge} ${styles[`badge_${item.status}`]}`}>
          {statusLabels[item.status]}
        </span>
      ),
    },
    {
      key: 'last_sync_at',
      header: 'Son Senk.',
      width: '15%',
      render: (item) =>
        item.last_sync_at
          ? new Date(item.last_sync_at).toLocaleDateString('tr-TR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '-',
    },
    {
      key: 'actions',
      header: 'Islemler',
      width: '32%',
      render: (item) => (
        <div className={styles.actions}>
          <Button size="sm" variant="secondary" onClick={() => navigate(`/integrations/${item.id}`)}>
            Detay
          </Button>
          <Button size="sm" variant="secondary" onClick={() => handleTestConnection(item.id)} disabled={testingId === item.id}>
            {testingId === item.id ? 'Test...' : 'Test'}
          </Button>
          {item.type === 'e_commerce' && item.status === 'active' && (
            <Button size="sm" variant="secondary" onClick={() => handleSyncOrders(item.id)} disabled={syncingId === item.id}>
              {syncingId === item.id ? 'Senk...' : 'Senk'}
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => handleEdit(item)}>
            Duzenle
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(item.id)}>
            Sil
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Entegrasyonlar</h1>
        <Button onClick={handleAdd}>Yeni Entegrasyon</Button>
      </div>

      <Card>
        <Table
          columns={columns}
          data={integrations}
          keyExtractor={(item) => item.id}
          loading={loading}
          emptyMessage="Entegrasyon bulunamadi"
        />
      </Card>

      {modalOpen && (
        <IntegrationFormModal
          integration={selectedIntegration}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
