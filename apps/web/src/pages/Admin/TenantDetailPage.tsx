import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Spinner } from '@stok/ui';
import { adminTenantsApi, Tenant, TenantStats } from '../../api/admin/tenants.api';
import { useTenant } from '../../context/TenantContext';
import styles from './AdminPages.module.css';

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  active: 'success',
  trial: 'warning',
  suspended: 'danger',
  cancelled: 'default',
};

const statusLabels: Record<string, string> = {
  active: 'Aktif',
  trial: 'Deneme',
  suspended: 'Askida',
  cancelled: 'Iptal',
};

export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { impersonate } = useTenant();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleViewPanel = () => {
    if (!tenant) return;
    impersonate({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
    });
    navigate('/dashboard');
  };

  useEffect(() => {
    if (id) {
      loadTenant();
    }
  }, [id]);

  const loadTenant = async () => {
    if (!id) return;

    try {
      setIsLoading(true);
      const [tenantRes, statsRes] = await Promise.all([
        adminTenantsApi.getById(id),
        adminTenantsApi.getStats(id),
      ]);

      setTenant(tenantRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to load tenant:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!id || !confirm('Bu organizasyonu askiya almak istediginize emin misiniz?')) return;

    try {
      await adminTenantsApi.suspend(id);
      loadTenant();
    } catch (error) {
      console.error('Failed to suspend tenant:', error);
    }
  };

  const handleActivate = async () => {
    if (!id) return;

    try {
      await adminTenantsApi.activate(id);
      loadTenant();
    } catch (error) {
      console.error('Failed to activate tenant:', error);
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('Bu organizasyonu silmek istediginize emin misiniz? Bu islem geri alinamaz!')) return;

    try {
      await adminTenantsApi.delete(id);
      navigate('/admin/tenants');
    } catch (error) {
      console.error('Failed to delete tenant:', error);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <Spinner size="lg" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className={styles.page}>
        <Card>
          <p>Organizasyon bulunamadi.</p>
          <Button onClick={() => navigate('/admin/tenants')}>Geri Don</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <Button variant="ghost" onClick={() => navigate('/admin/tenants')}>
            ← Geri
          </Button>
          <h1 className={styles.pageTitle}>{tenant.name}</h1>
        </div>
        <div className={styles.actions}>
          <Button variant="primary" onClick={handleViewPanel}>
            Paneli Gor
          </Button>
          <Button variant="secondary" onClick={() => navigate(`/admin/tenants/${id}/edit`)}>
            Duzenle
          </Button>
          {tenant.status === 'active' || tenant.status === 'trial' ? (
            <Button variant="ghost" onClick={handleSuspend}>
              Askiya Al
            </Button>
          ) : (
            <Button variant="ghost" onClick={handleActivate}>
              Aktif Et
            </Button>
          )}
          <Button variant="danger" onClick={handleDelete}>
            Sil
          </Button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{stats?.userCount || 0}</div>
          <div className={styles.statLabel}>Kullanici</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{stats?.productCount || 0}</div>
          <div className={styles.statLabel}>Urun</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{stats?.customerCount || 0}</div>
          <div className={styles.statLabel}>Musteri</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{stats?.saleCount || 0}</div>
          <div className={styles.statLabel}>Satis</div>
        </Card>
      </div>

      <div className={styles.twoColumn}>
        <Card className={styles.section}>
          <h2 className={styles.sectionTitle}>Genel Bilgiler</h2>
          <dl className={styles.detailList}>
            <dt>Slug</dt>
            <dd>{tenant.slug}</dd>

            <dt>Domain</dt>
            <dd>{tenant.domain || '-'}</dd>

            <dt>Durum</dt>
            <dd>
              <Badge variant={statusColors[tenant.status] || 'default'}>
                {statusLabels[tenant.status] || tenant.status}
              </Badge>
            </dd>

            <dt>Plan</dt>
            <dd>{tenant.plan_name || 'Plansiz'}</dd>

            <dt>Fatura E-posta</dt>
            <dd>{tenant.billing_email || '-'}</dd>

            <dt>Kayit Tarihi</dt>
            <dd>{new Date(tenant.created_at).toLocaleDateString('tr-TR')}</dd>
          </dl>
        </Card>

        <Card className={styles.section}>
          <h2 className={styles.sectionTitle}>Abonelik Bilgileri</h2>
          <dl className={styles.detailList}>
            <dt>Deneme Bitis</dt>
            <dd>
              {tenant.trial_ends_at
                ? new Date(tenant.trial_ends_at).toLocaleDateString('tr-TR')
                : '-'}
            </dd>

            <dt>Abonelik Baslangic</dt>
            <dd>
              {tenant.subscription_starts_at
                ? new Date(tenant.subscription_starts_at).toLocaleDateString('tr-TR')
                : '-'}
            </dd>

            <dt>Abonelik Bitis</dt>
            <dd>
              {tenant.subscription_ends_at
                ? new Date(tenant.subscription_ends_at).toLocaleDateString('tr-TR')
                : '-'}
            </dd>
          </dl>
        </Card>
      </div>
    </div>
  );
}
