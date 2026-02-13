import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Table, Button, Input, Badge, Pagination, type Column } from '@stok/ui';
import { adminUsersApi, AdminUser } from '../../api/admin/users.api';
import styles from './AdminPages.module.css';

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  tenant_admin: 'Tenant Admin',
  manager: 'Yonetici',
  user: 'Kullanici',
};

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  active: 'success',
  suspended: 'danger',
  inactive: 'default',
};

const statusLabels: Record<string, string> = {
  active: 'Aktif',
  suspended: 'Askida',
  inactive: 'Pasif',
};

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspend = async (id: string) => {
    if (!confirm('Bu kullaniciyi askiya almak istediginize emin misiniz?')) return;

    try {
      await adminUsersApi.suspend(id);
      loadUsers();
    } catch (error) {
      console.error('Failed to suspend user:', error);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await adminUsersApi.activate(id);
      loadUsers();
    } catch (error) {
      console.error('Failed to activate user:', error);
    }
  };

  const columns: Column<AdminUser>[] = [
    {
      key: 'name',
      header: 'Kullanici',
      render: (user) => (
        <div>
          <div className={styles.link}>{user.name}</div>
          <div className={styles.subText}>{user.email}</div>
        </div>
      ),
    },
    {
      key: 'tenant',
      header: 'Sirket',
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
      header: 'Rol',
      render: (user) => roleLabels[user.role] || user.role,
    },
    {
      key: 'status',
      header: 'Durum',
      render: (user) => (
        <Badge variant={statusColors[user.status] || 'default'}>
          {statusLabels[user.status] || user.status}
        </Badge>
      ),
    },
    {
      key: 'last_login',
      header: 'Son Giris',
      render: (user) =>
        user.last_login_at
          ? new Date(user.last_login_at).toLocaleDateString('tr-TR')
          : 'Hic giris yapmadi',
    },
    {
      key: 'actions',
      header: '',
      render: (user) =>
        user.role !== 'super_admin' && (
          <div className={styles.actions}>
            {user.status === 'active' ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleSuspend(user.id)}
              >
                Askiya Al
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleActivate(user.id)}
              >
                Aktif Et
              </Button>
            )}
          </div>
        ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Kullanıcılar</h1>
      </div>

      <Card className={styles.filters}>
        <div className={styles.filterRow}>
          <Input
            placeholder="Ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={styles.select}
          >
            <option value="">Tum Roller</option>
            <option value="super_admin">Super Admin</option>
            <option value="tenant_admin">Tenant Admin</option>
            <option value="manager">Yonetici</option>
            <option value="user">Kullanici</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.select}
          >
            <option value="">Tum Durumlar</option>
            <option value="active">Aktif</option>
            <option value="suspended">Askida</option>
          </select>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          data={users}
          keyExtractor={(user) => user.id}
          loading={isLoading}
          emptyMessage="Kullanici bulunamadi"
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
