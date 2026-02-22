import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Badge, Card } from '@stok/ui';
import { integrationsApi, IntegrationDetail, IntegrationLog } from '../../api/integrations.api';
import { formatDateTime } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import styles from './IntegrationDetailPage.module.css';

type TabType = 'logs' | 'config';

export function IntegrationDetailPage() {
  const { t } = useTranslation(['integrations', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
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
      setError(err instanceof Error ? err.message : t('integrations:toast.dataLoadError'));
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
      showToast('success', t('integrations:toast.ordersSynced', { count: response.data.syncedCount }));
      fetchData();
    } catch (err) {
      showToast('error', t('integrations:toast.syncFailed'));
    } finally {
      setSyncing(false);
    }
  };

  const handleTestConnection = async () => {
    if (!id) return;

    setTesting(true);
    try {
      const response = await integrationsApi.testConnection(id);
      showToast('success', response.data?.message || (response.success ? t('integrations:toast.connectionSuccess') : t('integrations:toast.connectionFailed')));
      fetchData();
    } catch (err) {
      showToast('error', t('integrations:toast.connectionTestFailed'));
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
      showToast('error', t('integrations:toast.statusChangeFailed'));
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>{t('integrations:detail.loading')}</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>{error || t('integrations:detail.notFound')}</div>
        <Button onClick={() => navigate('/integrations')}>{t('integrations:detail.goBack')}</Button>
      </div>
    );
  }

  const { integration, logs, stats } = data;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Button variant="ghost" onClick={() => navigate('/integrations')}>
            &larr; {t('integrations:detail.backToList')}
          </Button>
          <h1 className={styles.title}>{integration.name}</h1>
          <div className={styles.integrationMeta}>
            <span className={styles.metaItem}>
              {t(`integrations:types.${integration.type}`, { defaultValue: integration.type })}
            </span>
            <span className={styles.metaItem}>
              {t(`integrations:providers.${integration.provider}`, { defaultValue: integration.provider })}
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
              {t(`integrations:statuses.${integration.status}`)}
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
              {testing ? t('integrations:detail.testingConnection') : t('integrations:detail.testConnection')}
            </Button>
            {integration.type === 'e_commerce' && integration.status === 'active' && (
              <Button
                variant="secondary"
                onClick={handleSyncNow}
                disabled={syncing}
              >
                {syncing ? t('integrations:detail.syncing') : t('integrations:detail.syncNow')}
              </Button>
            )}
            <Button
              variant={integration.status === 'active' ? 'danger' : 'primary'}
              onClick={handleToggleStatus}
              disabled={toggling}
            >
              {toggling
                ? t('integrations:detail.toggling')
                : integration.status === 'active'
                ? t('integrations:detail.deactivate')
                : t('integrations:detail.activate')}
            </Button>
          </div>
        </div>
      </div>

      {integration.last_error && (
        <div className={styles.errorBanner}>
          <strong>{t('integrations:detail.lastError')}</strong> {integration.last_error}
        </div>
      )}

      {/* Info Grid */}
      <div className={styles.infoGrid}>
        <Card className={styles.infoCard}>
          <h3>{t('integrations:detail.integrationInfo')}</h3>
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('integrations:detail.name')}</span>
              <span className={styles.infoValue}>{integration.name}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('integrations:detail.type')}</span>
              <span className={styles.infoValue}>
                {t(`integrations:types.${integration.type}`, { defaultValue: integration.type })}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('integrations:detail.provider')}</span>
              <span className={styles.infoValue}>
                {t(`integrations:providers.${integration.provider}`, { defaultValue: integration.provider })}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('integrations:detail.status')}</span>
              <span className={styles.infoValue}>
                {t(`integrations:statuses.${integration.status}`)}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('integrations:detail.createdAt')}</span>
              <span className={styles.infoValue}>
                {formatDateTime(integration.created_at)}
              </span>
            </div>
            {integration.last_sync_at && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('integrations:detail.lastSync')}</span>
                <span className={styles.infoValue}>
                  {formatDateTime(integration.last_sync_at)}
                </span>
              </div>
            )}
          </div>
        </Card>

        <Card className={styles.statsCard}>
          <h3>{t('integrations:detail.statistics')}</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.totalSynced}</span>
              <span className={styles.statLabel}>{t('integrations:detail.successfulSyncs')}</span>
            </div>
            <div className={styles.statItem}>
              <span className={`${styles.statValue} ${stats.totalErrors > 0 ? styles.errorValue : ''}`}>
                {stats.totalErrors}
              </span>
              <span className={styles.statLabel}>{t('integrations:detail.errors')}</span>
            </div>
            {integration.type === 'e_commerce' && (
              <>
                <div className={styles.statItem}>
                  <span className={styles.statValue}>{stats.syncedOrders}</span>
                  <span className={styles.statLabel}>{t('integrations:detail.syncedOrders')}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={`${styles.statValue} ${stats.pendingOrders > 0 ? styles.warningValue : ''}`}>
                    {stats.pendingOrders}
                  </span>
                  <span className={styles.statLabel}>{t('integrations:detail.pending')}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={`${styles.statValue} ${stats.errorOrders > 0 ? styles.errorValue : ''}`}>
                    {stats.errorOrders}
                  </span>
                  <span className={styles.statLabel}>{t('integrations:detail.withErrors')}</span>
                </div>
              </>
            )}
          </div>
          {stats.lastSyncAt && (
            <div className={styles.lastSync}>
              {t('integrations:detail.lastSuccessfulSync', { date: formatDateTime(stats.lastSyncAt) })}
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
            {t('integrations:detail.syncHistory')} ({logs.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'config' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('config')}
          >
            {t('integrations:detail.configuration')}
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'logs' && <LogsTab logs={logs} t={t} />}
          {activeTab === 'config' && <ConfigTab config={integration.config} t={t} />}
        </div>
      </div>
    </div>
  );
}

function LogsTab({ logs, t }: { logs: IntegrationLog[]; t: (key: string, options?: Record<string, unknown>) => string }) {
  if (logs.length === 0) {
    return <div className={styles.emptyState}>{t('integrations:detail.noLogs')}</div>;
  }

  return (
    <div className={styles.logsList}>
      <table className={styles.logsTable}>
        <thead>
          <tr>
            <th>{t('integrations:logColumns.date')}</th>
            <th>{t('integrations:logColumns.action')}</th>
            <th>{t('integrations:logColumns.status')}</th>
            <th>{t('integrations:logColumns.message')}</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{formatDateTime(log.created_at)}</td>
              <td>{t(`integrations:logActions.${log.action}`, { defaultValue: log.action })}</td>
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
                  {t(`integrations:logStatuses.${log.status}`, { defaultValue: log.status })}
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

function ConfigTab({ config, t }: { config: Record<string, unknown>; t: (key: string, options?: Record<string, unknown>) => string }) {
  const configEntries = Object.entries(config);

  if (configEntries.length === 0) {
    return <div className={styles.emptyState}>{t('integrations:detail.noConfig')}</div>;
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
