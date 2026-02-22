import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Button, Input, Spinner } from '@stok/ui';
import { useTenant } from '../../context/TenantContext';
import { apiClient } from '../../api/client';
import styles from './SettingsPages.module.css';

export function TenantSettingsPage() {
  const { t } = useTranslation(['settings', 'common']);
  const { settings, usage, refreshSettings, isLoading } = useTenant();
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    billingEmail: '',
    address: '',
    phone: '',
    taxOffice: '',
    taxNumber: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (settings) {
      setFormData({
        name: settings.name || '',
        domain: settings.domain || '',
        billingEmail: settings.billing_email || '',
        address: settings.settings?.address || '',
        phone: settings.settings?.phone || '',
        taxOffice: settings.settings?.taxOffice || '',
        taxNumber: settings.settings?.taxNumber || '',
      });
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      await apiClient.patch('/settings', {
        name: formData.name,
        domain: formData.domain,
        billingEmail: formData.billingEmail,
        settings: {
          ...settings?.settings,
          address: formData.address,
          phone: formData.phone,
          taxOffice: formData.taxOffice,
          taxNumber: formData.taxNumber,
        },
      });
      await refreshSettings();
      setMessage(t('settings:tenant.saveSuccess'));
    } catch (error) {
      setMessage(t('settings:tenant.saveFailed'));
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
      <h1 className={styles.pageTitle}>{t('settings:tenant.title')}</h1>

      <div className={styles.grid}>
        <Card className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('settings:tenant.generalInfo')}</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label>{t('settings:tenant.companyName')}</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className={styles.field}>
              <label>{t('settings:tenant.domain')}</label>
              <Input
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder={t('settings:tenant.domainPlaceholder')}
              />
            </div>

            <div className={styles.field}>
              <label>{t('settings:tenant.billingEmail')}</label>
              <Input
                type="email"
                value={formData.billingEmail}
                onChange={(e) => setFormData({ ...formData, billingEmail: e.target.value })}
              />
            </div>

            <div className={styles.field}>
              <label>{t('settings:tenant.address')}</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder={t('settings:tenant.addressPlaceholder')}
              />
            </div>

            <div className={styles.field}>
              <label>{t('settings:tenant.phone')}</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder={t('settings:tenant.phonePlaceholder')}
              />
            </div>

            <div className={styles.field}>
              <label>{t('settings:tenant.taxOffice')}</label>
              <Input
                value={formData.taxOffice}
                onChange={(e) => setFormData({ ...formData, taxOffice: e.target.value })}
                placeholder={t('settings:tenant.taxOfficePlaceholder')}
              />
            </div>

            <div className={styles.field}>
              <label>{t('settings:tenant.taxNumber')}</label>
              <Input
                value={formData.taxNumber}
                onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                placeholder={t('settings:tenant.taxNumberPlaceholder')}
              />
            </div>

            {message && <p className={styles.message}>{message}</p>}

            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? t('settings:tenant.saving') : t('settings:tenant.save')}
            </Button>
          </form>
        </Card>

        <Card className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('settings:tenant.planAndUsage')}</h2>

          <div className={styles.planInfo}>
            <div className={styles.planName}>{settings?.plan_name || t('settings:tenant.noPlan')}</div>
            <div className={styles.planStatus}>
              {t('settings:tenant.status')}: <strong>{settings?.status === 'trial' ? t('settings:tenant.statusTrial') : settings?.status === 'active' ? t('settings:tenant.statusActive') : settings?.status}</strong>
            </div>
            {settings?.status === 'trial' && settings?.trial_ends_at && (
              <div className={styles.planStatus}>
                {t('settings:tenant.trialPeriod')}: <strong>{t('settings:tenant.daysRemaining', { days: Math.max(0, Math.ceil((new Date(settings.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) })}</strong>
              </div>
            )}
          </div>

          {settings?.plan_code !== 'plus' && (
            <div style={{ marginTop: '1rem' }}>
              <Button variant="primary" onClick={() => window.open('mailto:destek@stoksayac.com?subject=Plan%20Yükseltme', '_blank')}>
                {t('settings:tenant.upgradePlan')}
              </Button>
            </div>
          )}

          <h3 className={styles.subsectionTitle}>{t('settings:tenant.usage')}</h3>

          {usage && (
            <div className={styles.usageList}>
              <UsageBar
                label={t('settings:tenant.usageUsers')}
                current={usage.users.current}
                limit={usage.users.limit}
                unlimitedLabel={t('settings:tenant.unlimited')}
              />
              <UsageBar
                label={t('settings:tenant.usageProducts')}
                current={usage.products.current}
                limit={usage.products.limit}
                unlimitedLabel={t('settings:tenant.unlimited')}
              />
              <UsageBar
                label={t('settings:tenant.usageCustomers')}
                current={usage.customers.current}
                limit={usage.customers.limit}
                unlimitedLabel={t('settings:tenant.unlimited')}
              />
              <UsageBar
                label={t('settings:tenant.usageWarehouses')}
                current={usage.warehouses.current}
                limit={usage.warehouses.limit}
                unlimitedLabel={t('settings:tenant.unlimited')}
              />
              <UsageBar
                label={t('settings:tenant.usageIntegrations')}
                current={usage.integrations.current}
                limit={usage.integrations.limit}
                unlimitedLabel={t('settings:tenant.unlimited')}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function UsageBar({ label, current, limit, unlimitedLabel }: { label: string; current: number; limit: number; unlimitedLabel: string }) {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : (current / limit) * 100;
  const isOverLimit = !isUnlimited && current >= limit;

  return (
    <div className={styles.usageItem}>
      <div className={styles.usageHeader}>
        <span>{label}</span>
        <span>
          {current} / {isUnlimited ? unlimitedLabel : limit}
        </span>
      </div>
      {!isUnlimited && (
        <div className={styles.usageBar}>
          <div
            className={`${styles.usageFill} ${isOverLimit ? styles.overLimit : ''}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
