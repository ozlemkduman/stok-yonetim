import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input, Spinner } from '@stok/ui';
import { adminTenantsApi, CreateTenantData, UpdateTenantData } from '../../api/admin/tenants.api';
import { adminPlansApi, Plan } from '../../api/admin/plans.api';
import { useToast } from '../../context/ToastContext';
import styles from './AdminPages.module.css';

export function TenantFormPage() {
  const { t } = useTranslation(['admin', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateTenantData>({
    name: '',
    slug: '',
    domain: '',
    planId: '',
    billingEmail: '',
    status: 'active',
  });

  useEffect(() => {
    loadPlans();
    if (isEditing && id) {
      loadTenant(id);
    }
  }, [id, isEditing]);

  const loadPlans = async () => {
    try {
      const response = await adminPlansApi.getAll(true);
      setPlans(response.data);
    } catch (err) {
      showToast('error', t('admin:tenantForm.plansLoadFailed'));
    }
  };

  const loadTenant = async (tenantId: string) => {
    try {
      setIsLoading(true);
      const response = await adminTenantsApi.getById(tenantId);
      const tenant = response.data;
      setFormData({
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain || '',
        planId: tenant.plan_id || '',
        billingEmail: tenant.billing_email || '',
        status: tenant.status,
      });
    } catch (err) {
      showToast('error', t('admin:tenantForm.loadFailed'));
      setError(t('admin:tenantForm.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError(t('admin:tenantForm.nameRequired'));
      return;
    }

    try {
      setIsSaving(true);

      const data = {
        name: formData.name.trim(),
        slug: formData.slug?.trim() || undefined,
        domain: formData.domain?.trim() || undefined,
        planId: formData.planId || undefined,
        billingEmail: formData.billingEmail?.trim() || undefined,
        status: formData.status,
      };

      if (isEditing && id) {
        await adminTenantsApi.update(id, data as UpdateTenantData);
      } else {
        await adminTenantsApi.create(data);
      }

      navigate('/admin/tenants');
    } catch (err: any) {
      showToast('error', t('admin:tenantForm.saveFailed'));
      setError(err instanceof Error ? err.message : t('admin:tenantForm.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData((prev) => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
    }));
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
          <Button variant="ghost" onClick={() => navigate('/admin/tenants')}>
            &larr; {t('admin:tenantForm.back')}
          </Button>
          <h1 className={styles.pageTitle}>
            {isEditing ? t('admin:tenantForm.editTitle') : t('admin:tenantForm.newTitle')}
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
              <label>{t('admin:tenantForm.labelName')}</label>
              <Input
                value={formData.name}
                onChange={handleNameChange}
                placeholder={t('admin:tenantForm.namePlaceholder')}
                required
              />
            </div>

            <div className={styles.field}>
              <label>{t('admin:tenantForm.labelSlug')}</label>
              <Input
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder={t('admin:tenantForm.slugPlaceholder')}
                disabled={isEditing}
              />
              <small className={styles.fieldHint}>
                {t('admin:tenantForm.slugHint')}
              </small>
            </div>

            <div className={styles.field}>
              <label>{t('admin:tenantForm.labelDomain')}</label>
              <Input
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder={t('admin:tenantForm.domainPlaceholder')}
              />
            </div>

            <div className={styles.field}>
              <label>{t('admin:tenantForm.labelBillingEmail')}</label>
              <Input
                type="email"
                value={formData.billingEmail}
                onChange={(e) => setFormData({ ...formData, billingEmail: e.target.value })}
                placeholder="muhasebe@abcticaret.com"
              />
            </div>

            <div className={styles.field}>
              <label>{t('admin:tenantForm.labelPlan')}</label>
              <select
                value={formData.planId}
                onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                className={styles.select}
              >
                <option value="">{t('admin:tenantForm.selectPlan')}</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(plan.price)}/{plan.billing_period === 'monthly' ? t('admin:tenantForm.billingMonthly') : t('admin:tenantForm.billingYearly')}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label>{t('admin:tenantForm.labelStatus')}</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className={styles.select}
              >
                <option value="active">{t('admin:tenantForm.statusActive')}</option>
                <option value="trial">{t('admin:tenantForm.statusTrial')}</option>
                <option value="suspended">{t('admin:tenantForm.statusSuspended')}</option>
                <option value="cancelled">{t('admin:tenantForm.statusCancelled')}</option>
              </select>
            </div>
          </div>

          <div className={styles.formActions}>
            <Button type="button" variant="ghost" onClick={() => navigate('/admin/tenants')}>
              {t('admin:tenantForm.cancel')}
            </Button>
            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? t('admin:tenantForm.saving') : (isEditing ? t('admin:tenantForm.update') : t('admin:tenantForm.create'))}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
