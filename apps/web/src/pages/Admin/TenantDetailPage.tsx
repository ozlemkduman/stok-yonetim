import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

export function TenantDetailPage() {
  const { t } = useTranslation(['admin', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { impersonate } = useTenant();
  const { confirm } = useConfirmDialog();
  const { showToast } = useToast();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const statusLabels: Record<string, string> = {
    active: t('admin:tenantDetail.statusActive'),
    trial: t('admin:tenantDetail.statusTrial'),
    suspended: t('admin:tenantDetail.statusSuspended'),
    cancelled: t('admin:tenantDetail.statusCancelled'),
  };

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
      showToast('error', t('admin:tenantDetail.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!id) return;
    const confirmed = await confirm({ message: t('admin:tenantDetail.suspendConfirm'), variant: 'danger' });
    if (!confirmed) return;

    try {
      await adminTenantsApi.suspend(id);
      showToast('success', t('admin:tenantDetail.suspendSuccess'));
      loadTenant();
    } catch (error) {
      showToast('error', t('admin:tenantDetail.suspendFailed'));
    }
  };

  const handleActivate = async () => {
    if (!id) return;

    try {
      await adminTenantsApi.activate(id);
      showToast('success', t('admin:tenantDetail.activateSuccess'));
      loadTenant();
    } catch (error) {
      showToast('error', t('admin:tenantDetail.activateFailed'));
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    const confirmed = await confirm({ message: t('admin:tenantDetail.deleteConfirm'), variant: 'danger' });
    if (!confirmed) return;

    try {
      await adminTenantsApi.delete(id);
      navigate('/admin/tenants');
    } catch (error) {
      showToast('error', t('admin:tenantDetail.deleteFailed'));
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');

    const emailTrimmed = inviteEmail.trim();
    if (!emailTrimmed) {
      setInviteError(t('admin:tenantDetail.emailRequired'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setInviteError(t('admin:tenantDetail.emailInvalid'));
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
        setInviteError(t('admin:tenantDetail.inviteLinkFailed'));
      }
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : t('admin:tenantDetail.inviteFailed'));
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
          <p>{t('admin:tenantDetail.notFound')}</p>
          <Button onClick={() => navigate('/admin/tenants')}>{t('admin:tenantDetail.goBack')}</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <Button variant="ghost" onClick={() => navigate('/admin/tenants')}>
            &larr; {t('admin:tenantDetail.back')}
          </Button>
          <h1 className={styles.pageTitle}>{tenant.name}</h1>
        </div>
        <div className={styles.actions}>
          <Button variant="primary" onClick={() => setShowInviteModal(true)}>
            {t('admin:tenantDetail.inviteUser')}
          </Button>
          <Button variant="secondary" onClick={handleViewPanel}>
            {t('admin:tenantDetail.viewPanel')}
          </Button>
          <Button variant="ghost" onClick={() => navigate(`/admin/tenants/${id}/edit`)}>
            {t('admin:tenantDetail.edit')}
          </Button>
          {tenant.status === 'active' || tenant.status === 'trial' ? (
            <Button variant="ghost" onClick={handleSuspend}>
              {t('admin:tenantDetail.suspend')}
            </Button>
          ) : (
            <Button variant="ghost" onClick={handleActivate}>
              {t('admin:tenantDetail.activate')}
            </Button>
          )}
          <Button variant="danger" onClick={handleDelete}>
            {t('admin:tenantDetail.delete')}
          </Button>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{stats?.userCount || 0}</div>
          <div className={styles.statLabel}>{t('admin:tenantDetail.statUsers')}</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{stats?.productCount || 0}</div>
          <div className={styles.statLabel}>{t('admin:tenantDetail.statProducts')}</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{stats?.customerCount || 0}</div>
          <div className={styles.statLabel}>{t('admin:tenantDetail.statCustomers')}</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{stats?.saleCount || 0}</div>
          <div className={styles.statLabel}>{t('admin:tenantDetail.statSales')}</div>
        </Card>
      </div>

      <div className={styles.twoColumn}>
        <Card className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('admin:tenantDetail.generalInfo')}</h2>
          <dl className={styles.detailList}>
            <dt>{t('admin:tenantDetail.slug')}</dt>
            <dd>{tenant.slug}</dd>

            <dt>{t('admin:tenantDetail.domain')}</dt>
            <dd>{tenant.domain || '-'}</dd>

            <dt>{t('admin:tenantDetail.status')}</dt>
            <dd>
              <Badge variant={statusColors[tenant.status] || 'default'}>
                {statusLabels[tenant.status] || tenant.status}
              </Badge>
            </dd>

            <dt>{t('admin:tenantDetail.plan')}</dt>
            <dd>{tenant.plan_name || t('admin:tenantDetail.noPlan')}</dd>

            <dt>{t('admin:tenantDetail.billingEmail')}</dt>
            <dd>{tenant.billing_email || '-'}</dd>

            <dt>{t('admin:tenantDetail.createdAt')}</dt>
            <dd>{new Date(tenant.created_at).toLocaleDateString('tr-TR')}</dd>
          </dl>
        </Card>

        <Card className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('admin:tenantDetail.subscriptionInfo')}</h2>
          <dl className={styles.detailList}>
            <dt>{t('admin:tenantDetail.trialEnd')}</dt>
            <dd>
              {tenant.trial_ends_at
                ? new Date(tenant.trial_ends_at).toLocaleDateString('tr-TR')
                : '-'}
            </dd>

            <dt>{t('admin:tenantDetail.subscriptionStart')}</dt>
            <dd>
              {tenant.subscription_starts_at
                ? new Date(tenant.subscription_starts_at).toLocaleDateString('tr-TR')
                : '-'}
            </dd>

            <dt>{t('admin:tenantDetail.subscriptionEnd')}</dt>
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
                <h2>{t('admin:tenantDetail.inviteCreated')}</h2>
                <p style={{ marginBottom: '1rem', color: '#059669' }}>
                  {t('admin:tenantDetail.inviteSuccess')}
                </p>
                <div className={styles.formField}>
                  <label>{t('admin:tenantDetail.inviteLink')}</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={createdInviteLink}
                      readOnly
                      style={{ flex: 1 }}
                    />
                    <Button variant="primary" onClick={copyInviteLink}>
                      {linkCopied ? t('admin:tenantDetail.copied') : t('admin:tenantDetail.copy')}
                    </Button>
                  </div>
                </div>
                <div className={styles.modalActions}>
                  <Button variant="secondary" onClick={closeInviteModal}>
                    {t('admin:tenantDetail.close')}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h2>{t('admin:tenantDetail.inviteTitle')}</h2>
                <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
                  {t('admin:tenantDetail.inviteDescription', { name: tenant?.name })}
                </p>

                {inviteError && <div className={styles.error}>{inviteError}</div>}

                <form onSubmit={handleInviteUser}>
                  <div className={styles.formField}>
                    <label>{t('admin:tenantDetail.labelEmail')}</label>
                    <Input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder={t('admin:tenantDetail.emailPlaceholder')}
                      required
                    />
                  </div>

                  <div className={styles.formField}>
                    <label>{t('admin:tenantDetail.labelRole')}</label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className={styles.select}
                    >
                      <option value="tenant_admin">{t('admin:tenantDetail.roleOrgAdmin')}</option>
                      <option value="user">{t('admin:tenantDetail.roleUser')}</option>
                    </select>
                  </div>

                  <div className={styles.modalActions}>
                    <Button type="button" variant="secondary" onClick={closeInviteModal}>
                      {t('admin:tenantDetail.cancel')}
                    </Button>
                    <Button type="submit" variant="primary" disabled={isInviting}>
                      {isInviting ? t('admin:tenantDetail.sending') : t('admin:tenantDetail.sendInvite')}
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
