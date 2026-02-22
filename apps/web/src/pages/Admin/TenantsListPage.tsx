import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, Table, Button, Input, Badge, Pagination, type Column } from '@stok/ui';
import { adminTenantsApi, Tenant } from '../../api/admin/tenants.api';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { useToast } from '../../context/ToastContext';
import styles from './AdminPages.module.css';

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  active: 'success',
  trial: 'warning',
  suspended: 'danger',
  cancelled: 'default',
};

export function TenantsListPage() {
  const { t } = useTranslation(['admin', 'common']);
  const navigate = useNavigate();
  const { confirm } = useConfirmDialog();
  const { showToast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const statusLabels: Record<string, string> = {
    active: t('admin:tenants.statusActive'),
    trial: t('admin:tenants.statusTrial'),
    suspended: t('admin:tenants.statusSuspended'),
    cancelled: t('admin:tenants.statusCancelled'),
  };

  useEffect(() => {
    loadTenants();
  }, [page, statusFilter, search]);

  const loadTenants = async () => {
    try {
      setIsLoading(true);
      const response = await adminTenantsApi.getAll({
        page,
        limit: 20,
        status: statusFilter || undefined,
        search: search || undefined,
      });

      setTenants(response.data);
      setTotalPages(response.meta?.totalPages || 1);
    } catch (error) {
      showToast('error', t('admin:tenants.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspend = async (id: string) => {
    const confirmed = await confirm({ message: t('admin:tenants.suspendConfirm'), variant: 'danger' });
    if (!confirmed) return;

    try {
      await adminTenantsApi.suspend(id);
      loadTenants();
    } catch (error) {
      showToast('error', t('admin:tenants.suspendFailed'));
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await adminTenantsApi.activate(id);
      loadTenants();
    } catch (error) {
      showToast('error', t('admin:tenants.activateFailed'));
    }
  };

  const columns: Column<Tenant>[] = [
    {
      key: 'name',
      header: t('admin:tenants.columnName'),
      render: (tenant) => (
        <div>
          <Link to={`/admin/tenants/${tenant.id}`} className={styles.link}>
            {tenant.name}
          </Link>
          <div className={styles.subText}>{tenant.slug}</div>
        </div>
      ),
    },
    {
      key: 'plan',
      header: t('admin:tenants.columnPlan'),
      render: (tenant) => tenant.plan_name || '-',
    },
    {
      key: 'user_count',
      header: t('admin:tenants.columnUsers'),
      render: (tenant) => tenant.user_count || 0,
    },
    {
      key: 'status',
      header: t('admin:tenants.columnStatus'),
      render: (tenant) => (
        <Badge variant={statusColors[tenant.status] || 'default'}>
          {statusLabels[tenant.status] || tenant.status}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: t('admin:tenants.columnCreatedAt'),
      render: (tenant) => new Date(tenant.created_at).toLocaleDateString('tr-TR'),
    },
    {
      key: 'actions',
      header: '',
      render: (tenant) => (
        <div className={styles.actions}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/admin/tenants/${tenant.id}`)}
          >
            {t('admin:tenants.detail')}
          </Button>
          {tenant.status === 'active' || tenant.status === 'trial' ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSuspend(tenant.id)}
            >
              {t('admin:tenants.suspend')}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleActivate(tenant.id)}
            >
              {t('admin:tenants.activate')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t('admin:tenants.title')}</h1>
        <Button variant="primary" onClick={() => navigate('/admin/tenants/new')}>
          {t('admin:tenants.newTenant')}
        </Button>
      </div>

      <Card className={styles.filters}>
        <div className={styles.filterRow}>
          <Input
            placeholder={t('admin:tenants.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.select}
          >
            <option value="">{t('admin:tenants.allStatuses')}</option>
            <option value="active">{t('admin:tenants.statusActive')}</option>
            <option value="trial">{t('admin:tenants.statusTrial')}</option>
            <option value="suspended">{t('admin:tenants.statusSuspended')}</option>
            <option value="cancelled">{t('admin:tenants.statusCancelled')}</option>
          </select>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          data={tenants}
          keyExtractor={(tenant) => tenant.id}
          loading={isLoading}
          emptyMessage={t('admin:tenants.emptyMessage')}
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
