import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Input, Spinner } from '@stok/ui';
import { adminUsersApi, CreateUserData, UpdateUserData } from '../../api/admin/users.api';
import { adminTenantsApi, Tenant } from '../../api/admin/tenants.api';
import styles from './AdminPages.module.css';

const roleOptions = [
  { value: 'tenant_admin', label: 'Organizasyon Yoneticisi' },
  { value: 'manager', label: 'Yonetici' },
  { value: 'user', label: 'Kullanici' },
];

export function UserFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'user',
    tenantId: '',
    status: 'active',
  });

  useEffect(() => {
    loadTenants();
    if (isEditing && id) {
      loadUser(id);
    }
  }, [id, isEditing]);

  const loadTenants = async () => {
    try {
      const response = await adminTenantsApi.getAll({ limit: 100 });
      setTenants(response.data);
    } catch (err) {
      console.error('Failed to load tenants:', err);
    }
  };

  const loadUser = async (userId: string) => {
    try {
      setIsLoading(true);
      const response = await adminUsersApi.getById(userId);
      const user = response.data;
      setFormData({
        email: user.email,
        password: '',
        name: user.name,
        phone: user.phone || '',
        role: user.role,
        tenantId: user.tenant_id || '',
        status: user.status,
      });
    } catch (err) {
      console.error('Failed to load user:', err);
      setError('Kullanici yuklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Kullanici adi zorunludur');
      return;
    }

    if (!isEditing && !formData.email.trim()) {
      setError('E-posta adresi zorunludur');
      return;
    }

    if (!isEditing && !formData.password) {
      setError('Sifre zorunludur');
      return;
    }

    if (!isEditing && formData.password.length < 6) {
      setError('Sifre en az 6 karakter olmalidir');
      return;
    }

    try {
      setIsSaving(true);

      if (isEditing && id) {
        const updateData: UpdateUserData = {
          name: formData.name.trim(),
          phone: formData.phone?.trim() || undefined,
          role: formData.role,
          tenantId: formData.tenantId || undefined,
          status: formData.status,
        };
        await adminUsersApi.update(id, updateData);
      } else {
        const createData: CreateUserData = {
          email: formData.email.trim(),
          password: formData.password,
          name: formData.name.trim(),
          phone: formData.phone?.trim() || undefined,
          role: formData.role,
          tenantId: formData.tenantId || undefined,
        };
        await adminUsersApi.create(createData);
      }

      navigate('/admin/users');
    } catch (err: any) {
      console.error('Failed to save user:', err);
      setError(err instanceof Error ? err.message : 'Kullanici kaydedilemedi');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <Button variant="ghost" onClick={() => navigate('/admin/users')}>
            ← Geri
          </Button>
          <h1 className={styles.pageTitle}>
            {isEditing ? 'Kullaniciyi Duzenle' : 'Yeni Kullanici'}
          </h1>
        </div>
      </div>

      <Card className={styles.section}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={styles.errorAlert}>
              {error}
            </div>
          )}

          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Ad Soyad *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ornek: Ahmet Yilmaz"
                required
              />
            </div>

            <div className={styles.field}>
              <label>E-posta *</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ornek@sirket.com"
                disabled={isEditing}
                required={!isEditing}
              />
              {isEditing && (
                <small className={styles.fieldHint}>
                  E-posta adresi degistirilemez
                </small>
              )}
            </div>

            {!isEditing && (
              <div className={styles.field}>
                <label>Sifre *</label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="En az 6 karakter"
                  required
                />
              </div>
            )}

            <div className={styles.field}>
              <label>Telefon</label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0532 123 4567"
              />
            </div>

            <div className={styles.field}>
              <label>Rol</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className={styles.select}
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label>Organizasyon</label>
              <select
                value={formData.tenantId}
                onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                className={styles.select}
              >
                <option value="">Organizasyon Secin</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
              <small className={styles.fieldHint}>
                Bos birakilirsa kullanici hicbir organizasyona bagli olmaz
              </small>
            </div>

            {isEditing && (
              <div className={styles.field}>
                <label>Durum</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className={styles.select}
                >
                  <option value="active">Aktif</option>
                  <option value="suspended">Askida</option>
                </select>
              </div>
            )}
          </div>

          <div className={styles.formActions}>
            <Button type="button" variant="ghost" onClick={() => navigate('/admin/users')}>
              Iptal
            </Button>
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? 'Kaydediliyor...' : (isEditing ? 'Guncelle' : 'Olustur')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
