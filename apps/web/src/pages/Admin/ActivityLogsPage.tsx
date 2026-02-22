import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Table, Pagination, type Column } from '@stok/ui';
import { adminLogsApi, ActivityLog } from '../../api/admin/dashboard.api';
import { useToast } from '../../context/ToastContext';
import styles from './AdminPages.module.css';

export function ActivityLogsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const { showToast } = useToast();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadActionTypes();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [page, actionFilter]);

  const loadActionTypes = async () => {
    try {
      const response = await adminLogsApi.getActionTypes();
      setActionTypes(response.data);
    } catch (error) {
      showToast('error', t('admin:activityLogs.actionTypesLoadFailed'));
    }
  };

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const response = await adminLogsApi.getAll({
        page,
        limit: 50,
        action: actionFilter || undefined,
      });

      setLogs(response.data);
      setTotalPages(response.meta?.totalPages || 1);
    } catch (error) {
      showToast('error', t('admin:activityLogs.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const columns: Column<ActivityLog>[] = [
    {
      key: 'created_at',
      header: t('admin:activityLogs.columnDate'),
      render: (log) => new Date(log.created_at).toLocaleString('tr-TR'),
    },
    {
      key: 'action',
      header: t('admin:activityLogs.columnAction'),
      render: (log) => (
        <span className={styles.actionBadge}>{log.action}</span>
      ),
    },
    {
      key: 'entity',
      header: t('admin:activityLogs.columnEntity'),
      render: (log) => (
        <div>
          {log.entity_type && <span>{log.entity_type}</span>}
          {log.entity_id && <div className={styles.subText}>{log.entity_id.slice(0, 8)}...</div>}
        </div>
      ),
    },
    {
      key: 'user',
      header: t('admin:activityLogs.columnUser'),
      render: (log) => (
        <div>
          <div>{log.user_name || t('admin:activityLogs.system')}</div>
          {log.user_email && <div className={styles.subText}>{log.user_email}</div>}
        </div>
      ),
    },
    {
      key: 'tenant',
      header: t('admin:activityLogs.columnOrganization'),
      render: (log) => log.tenant_name || '-',
    },
    {
      key: 'ip',
      header: t('admin:activityLogs.columnIP'),
      render: (log) => log.ip_address || '-',
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t('admin:activityLogs.title')}</h1>
      </div>

      <Card className={styles.filters}>
        <div className={styles.filterRow}>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className={styles.select}
          >
            <option value="">{t('admin:activityLogs.allActions')}</option>
            {actionTypes.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          data={logs}
          keyExtractor={(log) => log.id}
          loading={isLoading}
          emptyMessage={t('admin:activityLogs.emptyMessage')}
        />

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
