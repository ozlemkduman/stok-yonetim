import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Badge, Card } from '@stok/ui';
import { integrationsApi, IntegrationDetail, IntegrationLog } from '../../api/integrations.api';
import { formatDateTime } from '../../utils/formatters';
import styles from './IntegrationDetailPage.module.css';

type TabType = 'logs' | 'config';

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

const logStatusLabels: Record<string, string> = {
  started: 'Basladi',
  success: 'Basarili',
  failed: 'Basarisiz',
};

const logActionLabels: Record<string, string> = {
  sync: 'Senkronizasyon',
  push: 'Gonderim',
  pull: 'Cekme',
  webhook: 'Webhook',
  error: 'Hata',
};

export function IntegrationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<IntegrationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('logs');
  const [syncing, setSyncing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const fetchData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await integrationsApi.getIntegrationDetail(id);
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veri yuklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleSyncNow = async () => {
    if (!id || !data) return;

    setSyncing(true);
    try {
      const response = await integrationsApi.syncOrders(id);
      alert(`${response.data.syncedCount} siparis senkronize edildi`);
      fetchData();
    } catch (err) {
      alert('Senkronizasyon basarisiz');
    } finally {
      setSyncing(false);
    }
  };

  const handleTestConnection = async () => {
    if (!id) return;

    setTesting(true);
    try {
      const response = await integrationsApi.testConnection(id);
      alert(response.data?.message || (response.success ? 'Baglanti basarili' : 'Baglanti basarisiz'));
      fetchData();
    } catch (err) {
      alert('Baglanti testi basarisiz');
    } finally {
      setTesting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!id || !data) return;

    const newStatus = data.integration.status === 'active' ? 'inactive' : 'active';
    setToggling(true);
    try {
      await integrationsApi.updateIntegration(id, { status: newStatus });
      fetchData();
    } catch (err) {
      alert('Durum degistirilemedi');
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Yukleniyor...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>{error || 'Entegrasyon bulunamadi'}</div>
        <Button onClick={() => navigate('/integrations')}>Geri Don</Button>
      </div>
    );
  }

  const { integration, logs, stats } = data;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Button variant="ghost" onClick={() => navigate('/integrations')}>
            &larr; Entegrasyonlar
          </Button>
          <h1 className={styles.title}>{integration.name}</h1>
          <div className={styles.integrationMeta}>
            <span className={styles.metaItem}>
              {typeLabels[integration.type] || integration.type}
            </span>
            <span className={styles.metaItem}>
              {providerLabels[integration.provider] || integration.provider}
            </span>
            <Badge
              variant={
                integration.status === 'active'
                  ? 'success'
                  : integration.status === 'error'
                  ? 'danger'
                  : 'default'
              }
            >
              {statusLabels[integration.status]}
            </Badge>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.actions}>
            <Button
              variant="secondary"
              onClick={handleTestConnection}
              disabled={testing}
            >
              {testing ? 'Test Ediliyor...' : 'Baglanti Testi'}
            </Button>
            {integration.type === 'e_commerce' && integration.status === 'active' && (
              <Button
                variant="secondary"
                onClick={handleSyncNow}
                disabled={syncing}
              >
                {syncing ? 'Senkronize Ediliyor...' : 'Simdi Senkronize Et'}
              </Button>
            )}
            <Button
              variant={integration.status === 'active' ? 'danger' : 'primary'}
              onClick={handleToggleStatus}
              disabled={toggling}
            >
              {toggling
                ? 'Degistiriliyor...'
                : integration.status === 'active'
                ? 'Devre Disi Birak'
                : 'Etkinlestir'}
            </Button>
          </div>
        </div>
      </div>

      {integration.last_error && (
        <div className={styles.errorBanner}>
          <strong>Son Hata:</strong> {integration.last_error}
        </div>
      )}

      {/* Info Grid */}
      <div className={styles.infoGrid}>
        <Card className={styles.infoCard}>
          <h3>Entegrasyon Bilgileri</h3>
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Ad</span>
              <span className={styles.infoValue}>{integration.name}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Tip</span>
              <span className={styles.infoValue}>
                {typeLabels[integration.type] || integration.type}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Saglayici</span>
              <span className={styles.infoValue}>
                {providerLabels[integration.provider] || integration.provider}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Durum</span>
              <span className={styles.infoValue}>
                {statusLabels[integration.status]}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Olusturulma</span>
              <span className={styles.infoValue}>
                {formatDateTime(integration.created_at)}
              </span>
            </div>
            {integration.last_sync_at && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Son Senkronizasyon</span>
                <span className={styles.infoValue}>
                  {formatDateTime(integration.last_sync_at)}
                </span>
              </div>
            )}
          </div>
        </Card>

        <Card className={styles.statsCard}>
          <h3>Istatistikler</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.totalSynced}</span>
              <span className={styles.statLabel}>Basarili Senk.</span>
            </div>
            <div className={styles.statItem}>
              <span className={`${styles.statValue} ${stats.totalErrors > 0 ? styles.errorValue : ''}`}>
                {stats.totalErrors}
              </span>
              <span className={styles.statLabel}>Hata</span>
            </div>
            {integration.type === 'e_commerce' && (
              <>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{stats.syncedOrders}</span>
                  <span className={styles.statLabel}>Senk. Siparis</span>
                </div>
                <div className={styles.statItem}>
                  <span className={`${styles.statValue} ${stats.pendingOrders > 0 ? styles.warningValue : ''}`}>
                    {stats.pendingOrders}
                  </span>
                  <span className={styles.statLabel}>Bekleyen</span>
                </div>
                <div className={styles.statItem}>
                  <span className={`${styles.statValue} ${stats.errorOrders > 0 ? styles.errorValue : ''}`}>
                    {stats.errorOrders}
                  </span>
                  <span className={styles.statLabel}>Hatali</span>
                </div>
              </>
            )}
          </div>
          {stats.lastSyncAt && (
            <div className={styles.lastSync}>
              Son basarili senk: {formatDateTime(stats.lastSyncAt)}
            </div>
          )}
        </Card>
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'logs' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            Senkronizasyon Gecmisi ({logs.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'config' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('config')}
          >
            Yapilandirma
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'logs' && <LogsTab logs={logs} />}
          {activeTab === 'config' && <ConfigTab config={integration.config} />}
        </div>
      </div>
    </div>
  );
}

function LogsTab({ logs }: { logs: IntegrationLog[] }) {
  if (logs.length === 0) {
    return <div className={styles.emptyState}>Henuz log kaydi yok</div>;
  }

  return (
    <div className={styles.logsList}>
      <table className={styles.logsTable}>
        <thead>
          <tr>
            <th>Tarih</th>
            <th>Islem</th>
            <th>Durum</th>
            <th>Mesaj</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{formatDateTime(log.created_at)}</td>
              <td>{logActionLabels[log.action] || log.action}</td>
              <td>
                <span
                  className={`${styles.logStatus} ${
                    log.status === 'success'
                      ? styles.logStatusSuccess
                      : log.status === 'failed'
                      ? styles.logStatusFailed
                      : styles.logStatusStarted
                  }`}
                >
                  {logStatusLabels[log.status] || log.status}
                </span>
              </td>
              <td>{log.message || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ConfigTab({ config }: { config: Record<string, unknown> }) {
  const configEntries = Object.entries(config);

  if (configEntries.length === 0) {
    return <div className={styles.emptyState}>Yapilandirma bilgisi yok</div>;
  }

  return (
    <div className={styles.configList}>
      {configEntries.map(([key, value]) => (
        <div key={key} className={styles.configItem}>
          <span className={styles.configKey}>{key}</span>
          <span className={styles.configValue}>
            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
          </span>
        </div>
      ))}
    </div>
  );
}
