import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, Table, Button, Input, Badge, Pagination, type Column } from '@stok/ui';
import { adminUsersApi, AdminUser } from '../../api/admin/users.api';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { useToast } from '../../context/ToastContext';
import styles from './AdminPages.module.css';

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  active: 'success',
  suspended: 'danger',
  inactive: 'default',
};

export function AdminUsersPage() {
  const { t } = useTranslation(['admin', 'common']);
  const navigate = useNavigate();
  const { confirm } = useConfirmDialog();
  const { showToast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const roleLabels: Record<string, string> = {
    super_admin: t('admin:users.roleSuperAdmin'),
    tenant_admin: t('admin:users.roleTenantAdmin'),
    user: t('admin:users.roleUser'),
  };

  const statusLabels: Record<string, string> = {
    active: t('admin:users.statusActive'),
    suspended: t('admin:users.statusSuspended'),
    inactive: t('admin:users.statusInactive'),
  };

  useEffect(() => {
    loadUsers();
  }, [page, roleFilter, statusFilter, search]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await adminUsersApi.getAll({
        page,
        limit: 20,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        search: search || undefined,
      });

      setUsers(response.data);
      setTotalPages(response.meta?.totalPages || 1);
    } catch (error) {
      showToast('error', t('admin:users.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspend = async (id: string) => {
    const confirmed = await confirm({ message: t('admin:users.suspendConfirm'), variant: 'danger' });
    if (!confirmed) return;

    try {
      await adminUsersApi.suspend(id);
      loadUsers();
    } catch (error) {
      showToast('error', t('admin:users.suspendFailed'));
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await adminUsersApi.activate(id);
      loadUsers();
    } catch (error) {
      showToast('error', t('admin:users.activateFailed'));
    }
  };

  const columns: Column<AdminUser>[] = [
    {
      key: 'name',
      header: t('admin:users.columnUser'),
      render: (user) => (
        <div>
          <div className={styles.link}>{user.name}</div>
          <div className={styles.subText}>{user.email}</div>
        </div>
      ),
    },
    {
      key: 'tenant',
      header: t('admin:users.columnOrganization'),
      render: (user) =>
        user.tenant_name ? (
          <Link to={`/admin/tenants/${user.tenant_id}`} className={styles.link}>
            {user.tenant_name}
          </Link>
        ) : (
          <span className={styles.subText}>-</span>
        ),
    },
    {
      key: 'role',
      header: t('admin:users.columnRole'),
      render: (user) => roleLabels[user.role] || user.role,
    },
    {
      key: 'status',
      header: t('admin:users.columnStatus'),
      render: (user) => (
        <Badge variant={statusColors[user.status] || 'default'}>
          {statusLabels[user.status] || user.status}
        </Badge>
      ),
    },
    {
      key: 'last_login',
      header: t('admin:users.columnLastLogin'),
      render: (user) =>
        user.last_login_at
          ? new Date(user.last_login_at).toLocaleDateString('tr-TR')
          : t('admin:users.neverLoggedIn'),
    },
    {
      key: 'actions',
      header: '',
      render: (user) => (
        <div className={styles.actions}>
          {user.role !== 'super_admin' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/admin/users/${user.id}/edit`)}
              >
                {t('admin:users.edit')}
              </Button>
              {user.status === 'active' ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSuspend(user.id)}
                >
                  {t('admin:users.suspend')}
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleActivate(user.id)}
                >
                  {t('admin:users.activate')}
                </Button>
              )}
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t('admin:users.title')}</h1>
        <Button variant="primary" onClick={() => navigate('/admin/users/new')}>
          {t('admin:users.newUser')}
        </Button>
      </div>

      <Card className={styles.filters}>
        <div className={styles.filterRow}>
          <Input
            placeholder={t('admin:users.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={styles.select}
          >
            <option value="">{t('admin:users.allRoles')}</option>
            <option value="super_admin">{t('admin:users.roleSuperAdmin')}</option>
            <option value="tenant_admin">{t('admin:users.roleTenantAdmin')}</option>
            <option value="user">{t('admin:users.roleUser')}</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.select}
          >
            <option value="">{t('admin:users.allStatuses')}</option>
            <option value="active">{t('admin:users.statusActive')}</option>
            <option value="suspended">{t('admin:users.statusSuspended')}</option>
          </select>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          data={users}
          keyExtractor={(user) => user.id}
          loading={isLoading}
          emptyMessage={t('admin:users.emptyMessage')}
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
