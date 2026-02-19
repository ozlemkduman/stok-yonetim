import { useState, useEffect } from 'react';
import { Card, Button, Input, Spinner } from '@stok/ui';
import { useTenant } from '../../context/TenantContext';
import { apiClient } from '../../api/client';
import styles from './SettingsPages.module.css';

export function TenantSettingsPage() {
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
      setMessage('Ayarlar kaydedildi.');
    } catch (error) {
      setMessage('Ayarlar kaydedilemedi.');
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
      <h1 className={styles.pageTitle}>Sirket Ayarlari</h1>

      <div className={styles.grid}>
        <Card className={styles.section}>
          <h2 className={styles.sectionTitle}>Genel Bilgiler</h2>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label>Sirket Adi</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className={styles.field}>
              <label>Domain</label>
              <Input
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="ornek.stokpro.com"
              />
            </div>

            <div className={styles.field}>
              <label>Fatura E-posta</label>
              <Input
                type="email"
                value={formData.billingEmail}
                onChange={(e) => setFormData({ ...formData, billingEmail: e.target.value })}
              />
            </div>

            <div className={styles.field}>
              <label>Adres</label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Sirket adresi"
              />
            </div>

            <div className={styles.field}>
              <label>Telefon</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(XXX) XXX XX XX"
              />
            </div>

            <div className={styles.field}>
              <label>Vergi Dairesi</label>
              <Input
                value={formData.taxOffice}
                onChange={(e) => setFormData({ ...formData, taxOffice: e.target.value })}
                placeholder="Vergi dairesi"
              />
            </div>

            <div className={styles.field}>
              <label>Vergi No</label>
              <Input
                value={formData.taxNumber}
                onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                placeholder="Vergi numarasi"
              />
            </div>

            {message && <p className={styles.message}>{message}</p>}

            <Button type="submit" variant="primary" disabled={isSaving}>
              {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </form>
        </Card>

        <Card className={styles.section}>
          <h2 className={styles.sectionTitle}>Plan ve Kullanim</h2>

          <div className={styles.planInfo}>
            <div className={styles.planName}>{settings?.plan_name || 'Plan Yok'}</div>
            <div className={styles.planStatus}>
              Durum: <strong>{settings?.status === 'trial' ? 'Deneme' : settings?.status === 'active' ? 'Aktif' : settings?.status}</strong>
            </div>
            {settings?.status === 'trial' && settings?.trial_ends_at && (
              <div className={styles.planStatus}>
                Deneme suresi: <strong>{Math.max(0, Math.ceil((new Date(settings.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} gun kaldi</strong>
              </div>
            )}
          </div>

          {settings?.plan_code !== 'plus' && (
            <div style={{ marginTop: '1rem' }}>
              <Button variant="primary" onClick={() => window.open('mailto:destek@stoksayac.com?subject=Plan%20Yükseltme', '_blank')}>
                Plani Yukselt
              </Button>
            </div>
          )}

          <h3 className={styles.subsectionTitle}>Kullanim</h3>

          {usage && (
            <div className={styles.usageList}>
              <UsageBar
                label="Kullanicilar"
                current={usage.users.current}
                limit={usage.users.limit}
              />
              <UsageBar
                label="Urunler"
                current={usage.products.current}
                limit={usage.products.limit}
              />
              <UsageBar
                label="Musteriler"
                current={usage.customers.current}
                limit={usage.customers.limit}
              />
              <UsageBar
                label="Depolar"
                current={usage.warehouses.current}
                limit={usage.warehouses.limit}
              />
              <UsageBar
                label="Entegrasyonlar"
                current={usage.integrations.current}
                limit={usage.integrations.limit}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function UsageBar({ label, current, limit }: { label: string; current: number; limit: number }) {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : (current / limit) * 100;
  const isOverLimit = !isUnlimited && current >= limit;

  return (
    <div className={styles.usageItem}>
      <div className={styles.usageHeader}>
        <span>{label}</span>
        <span>
          {current} / {isUnlimited ? 'Sinirsiz' : limit}
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
