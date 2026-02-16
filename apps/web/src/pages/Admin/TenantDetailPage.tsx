import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Badge, Spinner, Input } from '@stok/ui';
import { adminTenantsApi, Tenant, TenantStats } from '../../api/admin/tenants.api';
import { adminInvitationsApi } from '../../api/admin/invitations.api';
import { useTenant } from '../../context/TenantContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { useToast } from '../../context/ToastContext';
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
  const { confirm } = useConfirmDialog();
  const { showToast } = useToast();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Davet modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviteError, setInviteError] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [createdInviteLink, setCreatedInviteLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

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
      showToast('error', 'Organizasyon yuklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!id) return;
    const confirmed = await confirm({ message: 'Bu organizasyonu askiya almak istediginize emin misiniz?', variant: 'danger' });
    if (!confirmed) return;

    try {
      await adminTenantsApi.suspend(id);
      showToast('success', 'Organizasyon askiya alindi');
      loadTenant();
    } catch (error) {
      showToast('error', 'Organizasyon askiya alinamadi');
    }
  };

  const handleActivate = async () => {
    if (!id) return;

    try {
      await adminTenantsApi.activate(id);
      showToast('success', 'Organizasyon aktif edildi');
      loadTenant();
    } catch (error) {
      showToast('error', 'Organizasyon aktif edilemedi');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    const confirmed = await confirm({ message: 'Bu organizasyonu silmek istediginize emin misiniz? Bu islem geri alinamaz!', variant: 'danger' });
    if (!confirmed) return;

    try {
      await adminTenantsApi.delete(id);
      navigate('/admin/tenants');
    } catch (error) {
      showToast('error', 'Organizasyon silinemedi');
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');

    const emailTrimmed = inviteEmail.trim();
    if (!emailTrimmed) {
      setInviteError('E-posta adresi gerekli');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setInviteError('Gecerli bir e-posta adresi girin');
      return;
    }

    setIsInviting(true);

    try {
      const response = await adminInvitationsApi.create({
        email: emailTrimmed,
        role: inviteRole,
        tenantId: id,
      });

      const link = response.data?.invitationLink;
      if (link) {
        setCreatedInviteLink(link);
        setInviteEmail('');
        setInviteRole('user');
      } else {
        setInviteError('Davet olusturuldu ancak link alinamadi');
      }
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : 'Davet gonderilemedi');
    } finally {
      setIsInviting(false);
    }
  };

  const copyInviteLink = () => {
    if (createdInviteLink) {
      navigator.clipboard.writeText(createdInviteLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const closeInviteModal = () => {
    setShowInviteModal(false);
    setCreatedInviteLink(null);
    setInviteEmail('');
    setInviteRole('user');
    setInviteError('');
    setLinkCopied(false);
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
          <Button variant="primary" onClick={() => setShowInviteModal(true)}>
            Kullanici Davet Et
          </Button>
          <Button variant="secondary" onClick={handleViewPanel}>
            Paneli Gor
          </Button>
          <Button variant="ghost" onClick={() => navigate(`/admin/tenants/${id}/edit`)}>
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

      {/* Davet Modal */}
      {showInviteModal && (
        <div className={styles.modalOverlay} onClick={closeInviteModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            {createdInviteLink ? (
              <>
                <h2>Davet Olusturuldu</h2>
                <p style={{ marginBottom: '1rem', color: '#059669' }}>
                  Davet basariyla olusturuldu. Asagidaki linki kopyalayip kullaniciya gonderin.
                </p>
                <div className={styles.formField}>
                  <label>Davet Linki</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={createdInviteLink}
                      readOnly
                      style={{ flex: 1 }}
                    />
                    <Button variant="primary" onClick={copyInviteLink}>
                      {linkCopied ? 'Kopyalandi!' : 'Kopyala'}
                    </Button>
                  </div>
                </div>
                <div className={styles.modalActions}>
                  <Button variant="secondary" onClick={closeInviteModal}>
                    Kapat
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2>Kullanici Davet Et</h2>
                <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
                  {tenant?.name} organizasyonuna kullanici davet edin.
                </p>

                {inviteError && <div className={styles.error}>{inviteError}</div>}

                <form onSubmit={handleInviteUser}>
                  <div className={styles.formField}>
                    <label>E-posta *</label>
                    <Input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="kullanici@sirket.com"
                      required
                    />
                  </div>

                  <div className={styles.formField}>
                    <label>Rol *</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className={styles.select}
                    >
                      <option value="tenant_admin">Organizasyon Yoneticisi</option>
                      <option value="manager">Yonetici</option>
                      <option value="user">Kullanici</option>
                    </select>
                  </div>

                  <div className={styles.modalActions}>
                    <Button type="button" variant="secondary" onClick={closeInviteModal}>
                      Iptal
                    </Button>
                    <Button type="submit" variant="primary" disabled={isInviting}>
                      {isInviting ? 'Gonderiliyor...' : 'Davet Gonder'}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
