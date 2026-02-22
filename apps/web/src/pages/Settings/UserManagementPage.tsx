import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Table, Button, Input, Badge, Modal, Pagination, type Column } from '@stok/ui';
import { apiClient } from '../../api/client';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { useToast } from '../../context/ToastContext';
import styles from './SettingsPages.module.css';

interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  permissions: string[];
  status: string;
  last_login_at: string | null;
  created_at: string;
}

interface CreateUserData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: string;
  permissions: string[];
}

const statusColors: Record<string, 'success' | 'danger' | 'default'> = {
  active: 'success',
  suspended: 'danger',
  inactive: 'default',
};

export function UserManagementPage() {
  const { t } = useTranslation(['settings', 'common']);
  const { confirm } = useConfirmDialog();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [formData, setFormData] = useState<CreateUserData>({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'user',
    permissions: [],
  });

  useEffect(() => {
    loadUsers();
  }, [page]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<User[]>('/users', { page, limit: 20 });
      setUsers(response.data);
      setTotalPages(response.meta?.totalPages || 1);
    } catch (error) {
      showToast('error', t('settings:users.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await apiClient.post('/users', formData);
      setIsModalOpen(false);
      setFormData({
        email: '',
        password: '',
        name: '',
        phone: '',
        role: 'user',
        permissions: [],
      });
      loadUsers();
    } catch (error) {
      showToast('error', t('settings:users.createFailed'));
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({ message: t('settings:users.deleteConfirm'), variant: 'danger' });
    if (!confirmed) return;

    try {
      await apiClient.delete(`/users/${id}`);
      loadUsers();
    } catch (error) {
      showToast('error', t('settings:users.deleteFailed'));
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: t('settings:users.columnName'),
      render: (user) => (
        <div>
          <div>{user.name}</div>
          <div className={styles.subText}>{user.email}</div>
        </div>
      ),
    },
    {
      key: 'role',
      header: t('settings:users.columnRole'),
      render: (user) => user.role === 'tenant_admin' ? t('settings:users.roleAdmin') : user.role === 'user' ? t('settings:users.roleUser') : user.role,
    },
    {
      key: 'status',
      header: t('settings:users.columnStatus'),
      render: (user) => (
        <Badge variant={statusColors[user.status] || 'default'}>
          {user.status === 'active' ? t('settings:users.statusActive') : t('settings:users.statusInactive')}
        </Badge>
      ),
    },
    {
      key: 'last_login',
      header: t('settings:users.columnLastLogin'),
      render: (user) =>
        user.last_login_at
          ? new Date(user.last_login_at).toLocaleDateString('tr-TR')
          : '-',
    },
    {
      key: 'actions',
      header: '',
      render: (user) =>
        user.role !== 'tenant_admin' && (
          <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id)}>
            {t('settings:users.delete')}
          </Button>
        ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t('settings:users.title')}</h1>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          {t('settings:users.newUser')}
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          data={users}
          keyExtractor={(user) => user.id}
          loading={isLoading}
          emptyMessage={t('settings:users.emptyMessage')}
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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('settings:users.modalTitle')}
      >
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>{t('settings:users.labelFullName')}</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className={styles.field}>
            <label>{t('settings:users.labelEmail')}</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className={styles.field}>
            <label>{t('settings:users.labelPassword')}</label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={8}
            />
          </div>

          <div className={styles.field}>
            <label>{t('settings:users.labelPhone')}</label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className={styles.field}>
            <label>{t('settings:users.labelRole')}</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className={styles.select}
            >
              <option value="user">{t('settings:users.roleUser')}</option>
            </select>
          </div>

          <div className={styles.formActions}>
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              {t('settings:users.cancel')}
            </Button>
            <Button type="submit" variant="primary">
              {t('settings:users.create')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
