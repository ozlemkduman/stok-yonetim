import { useState, useEffect } from 'react';
import { Card, Table, Button, Input, Badge, Modal, Pagination, type Column } from '@stok/ui';
import { apiClient } from '../../api/client';
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

const roleLabels: Record<string, string> = {
  tenant_admin: 'Yonetici',
  manager: 'Mudur',
  user: 'Kullanici',
};

const statusColors: Record<string, 'success' | 'danger' | 'default'> = {
  active: 'success',
  suspended: 'danger',
  inactive: 'default',
};

export function UserManagementPage() {
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
      console.error('Failed to load users:', error);
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
      console.error('Failed to create user:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu kullaniciyi silmek istediginize emin misiniz?')) return;

    try {
      await apiClient.delete(`/users/${id}`);
      loadUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'Ad Soyad',
      render: (user) => (
        <div>
          <div>{user.name}</div>
          <div className={styles.subText}>{user.email}</div>
        </div>
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
          {user.status === 'active' ? 'Aktif' : 'Pasif'}
        </Badge>
      ),
    },
    {
      key: 'last_login',
      header: 'Son Giris',
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
            Sil
          </Button>
        ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Kullanıcı Yonetimi</h1>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          Yeni Kullanici
        </Button>
      </div>

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

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Yeni Kullanici"
      >
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Ad Soyad</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className={styles.field}>
            <label>E-posta</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className={styles.field}>
            <label>Sifre</label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={8}
            />
          </div>

          <div className={styles.field}>
            <label>Telefon</label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className={styles.field}>
            <label>Rol</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className={styles.select}
            >
              <option value="user">Kullanici</option>
              <option value="manager">Mudur</option>
            </select>
          </div>

          <div className={styles.formActions}>
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Iptal
            </Button>
            <Button type="submit" variant="primary">
              Olustur
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
