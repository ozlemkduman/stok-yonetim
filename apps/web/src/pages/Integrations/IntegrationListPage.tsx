import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Table, Button, Card, type Column } from '@stok/ui';
import { integrationsApi, Integration } from '../../api/integrations.api';
import { IntegrationFormModal } from './IntegrationFormModal';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import styles from './IntegrationListPage.module.css';

export function IntegrationListPage() {
  const { t } = useTranslation(['integrations', 'common']);
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
      showToast('error', t('integrations:toast.loadError'));
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
    const confirmed = await confirm({ message: t('integrations:confirm.deleteMessage'), variant: 'danger' });
    if (!confirmed) return;
    try {
      await integrationsApi.deleteIntegration(id);
      showToast('success', t('integrations:toast.deleted'));
      fetchIntegrations();
    } catch (error) {
      showToast('error', t('integrations:toast.deleteFailed'));
    }
  };

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    try {
      const response = await integrationsApi.testConnection(id);
      showToast('success', response.data.message);
      fetchIntegrations();
    } catch (error) {
      showToast('error', t('integrations:toast.connectionTestFailed'));
    } finally {
      setTestingId(null);
    }
  };

  const handleSyncOrders = async (id: string) => {
    setSyncingId(id);
    try {
      const response = await integrationsApi.syncOrders(id);
      showToast('success', t('integrations:toast.ordersSynced', { count: response.data.syncedCount }));
    } catch (error) {
      showToast('error', t('integrations:toast.syncFailed'));
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
    { key: 'name', header: t('integrations:columns.name'), width: '20%' },
    {
      key: 'type',
      header: t('integrations:columns.type'),
      width: '12%',
      render: (item) => t(`integrations:types.${item.type}`, { defaultValue: item.type }),
    },
    {
      key: 'provider',
      header: t('integrations:columns.provider'),
      width: '15%',
      render: (item) => t(`integrations:providers.${item.provider}`, { defaultValue: item.provider }),
    },
    {
      key: 'status',
      header: t('integrations:columns.status'),
      width: '10%',
      render: (item) => (
        <span className={`${styles.badge} ${styles[`badge_${item.status}`]}`}>
          {t(`integrations:statuses.${item.status}`)}
        </span>
      ),
    },
    {
      key: 'last_sync_at',
      header: t('integrations:columns.lastSync'),
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
      header: t('integrations:columns.actions'),
      width: '32%',
      render: (item) => (
        <div className={styles.actions}>
          <Button size="sm" variant="secondary" onClick={() => navigate(`/integrations/${item.id}`)}>
            {t('integrations:actions.detail')}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => handleTestConnection(item.id)} disabled={testingId === item.id}>
            {testingId === item.id ? t('integrations:actions.testing') : t('integrations:actions.test')}
          </Button>
          {item.type === 'e_commerce' && item.status === 'active' && (
            <Button size="sm" variant="secondary" onClick={() => handleSyncOrders(item.id)} disabled={syncingId === item.id}>
              {syncingId === item.id ? t('integrations:actions.syncing') : t('integrations:actions.sync')}
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => handleEdit(item)}>
            {t('integrations:actions.edit')}
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(item.id)}>
            {t('integrations:actions.delete')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>{t('integrations:pageTitle')}</h1>
        <Button onClick={handleAdd}>{t('integrations:newIntegration')}</Button>
      </div>

      <Card>
        <Table
          columns={columns}
          data={integrations}
          keyExtractor={(item) => item.id}
          loading={loading}
          emptyMessage={t('integrations:emptyMessage')}
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
