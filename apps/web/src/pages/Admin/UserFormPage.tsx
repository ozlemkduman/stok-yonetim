import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input, Spinner } from '@stok/ui';
import { adminUsersApi, CreateUserData, UpdateUserData } from '../../api/admin/users.api';
import { adminTenantsApi, Tenant } from '../../api/admin/tenants.api';
import { useToast } from '../../context/ToastContext';
import styles from './AdminPages.module.css';

export function UserFormPage() {
  const { t } = useTranslation(['admin', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const { showToast } = useToast();

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
      showToast('error', t('admin:userForm.orgsLoadFailed'));
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
      showToast('error', t('admin:userForm.loadFailed'));
      setError(t('admin:userForm.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError(t('admin:userForm.nameRequired'));
      return;
    }

    if (!isEditing && !formData.email.trim()) {
      setError(t('admin:userForm.emailRequired'));
      return;
    }

    if (!isEditing && !formData.password) {
      setError(t('admin:userForm.passwordRequired'));
      return;
    }

    if (!isEditing && formData.password.length < 8) {
      setError(t('admin:userForm.passwordTooShort'));
      return;
    }

    if (!isEditing && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      setError(t('admin:userForm.passwordComplexity'));
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
      showToast('error', t('admin:userForm.saveFailed'));
      setError(err instanceof Error ? err.message : t('admin:userForm.saveFailed'));
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
            &larr; {t('admin:userForm.back')}
          </Button>
          <h1 className={styles.pageTitle}>
            {isEditing ? t('admin:userForm.editTitle') : t('admin:userForm.newTitle')}
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
              <label>{t('admin:userForm.labelName')}</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('admin:userForm.namePlaceholder')}
                required
              />
            </div>

            <div className={styles.field}>
              <label>{t('admin:userForm.labelEmail')}</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={t('admin:userForm.emailPlaceholder')}
                disabled={isEditing}
                required={!isEditing}
              />
              {isEditing && (
                <small className={styles.fieldHint}>
                  {t('admin:userForm.emailReadonly')}
                </small>
              )}
            </div>

            {!isEditing && (
              <div className={styles.field}>
                <label>{t('admin:userForm.labelPassword')}</label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={t('admin:userForm.passwordPlaceholder')}
                  required
                />
              </div>
            )}

            <div className={styles.field}>
              <label>{t('admin:userForm.labelPhone')}</label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0532 123 4567"
              />
            </div>

            <div className={styles.field}>
              <label>{t('admin:userForm.labelRole')}</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className={styles.select}
              >
                <option value="tenant_admin">{t('admin:userForm.roleOrgAdmin')}</option>
                <option value="user">{t('admin:userForm.roleUser')}</option>
              </select>
            </div>

            <div className={styles.field}>
              <label>{t('admin:userForm.labelOrganization')}</label>
              <select
                value={formData.tenantId}
                onChange={(e) => setFormData({ ...formData, tenantId: e.target.value })}
                className={styles.select}
              >
                <option value="">{t('admin:userForm.selectOrg')}</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </select>
              <small className={styles.fieldHint}>
                {t('admin:userForm.orgHint')}
              </small>
            </div>

            {isEditing && (
              <div className={styles.field}>
                <label>{t('admin:userForm.labelStatus')}</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className={styles.select}
                >
                  <option value="active">{t('admin:userForm.statusActive')}</option>
                  <option value="suspended">{t('admin:userForm.statusSuspended')}</option>
                </select>
              </div>
            )}
          </div>

          <div className={styles.formActions}>
            <Button type="button" variant="ghost" onClick={() => navigate('/admin/users')}>
              {t('admin:userForm.cancel')}
            </Button>
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? t('admin:userForm.saving') : (isEditing ? t('admin:userForm.update') : t('admin:userForm.create'))}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
