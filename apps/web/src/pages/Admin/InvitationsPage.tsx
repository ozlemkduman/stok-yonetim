import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Table, Button, Badge, type Column } from '@stok/ui';
import { adminInvitationsApi, Invitation } from '../../api/admin/invitations.api';
import { adminTenantsApi, Tenant } from '../../api/admin/tenants.api';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { useToast } from '../../context/ToastContext';
import styles from './AdminPages.module.css';

export function InvitationsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const { confirm } = useConfirmDialog();
  const { showToast } = useToast();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'accepted' | 'expired' | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [newInvitation, setNewInvitation] = useState({
    email: '',
    role: 'tenant_admin',
    tenantId: '',
    tenantName: '',
  });
  const [inviteError, setInviteError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [createdInviteLink, setCreatedInviteLink] = useState<string | null>(null);

  const roleLabels: Record<string, string> = {
    super_admin: t('admin:invitations.roleSuperAdmin'),
    tenant_admin: t('admin:invitations.roleOrgAdmin'),
    user: t('admin:invitations.roleUser'),
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [invitationsRes, tenantsRes] = await Promise.all([
        adminInvitationsApi.getAll({
          status: statusFilter || undefined,
        }),
        adminTenantsApi.getAll({ limit: 100 }),
      ]);
      setInvitations(invitationsRes.data);
      setTenants(tenantsRes.data);
    } catch (error) {
      showToast('error', t('admin:invitations.loadFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');

    const emailTrimmed = newInvitation.email.trim();
    if (!emailTrimmed) {
      setInviteError(t('admin:invitations.emailRequired'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setInviteError(t('admin:invitations.emailInvalid'));
      return;
    }

    if (newInvitation.role === 'tenant_admin' && !newInvitation.tenantId && !newInvitation.tenantName.trim()) {
      setInviteError(t('admin:invitations.orgRequired'));
      return;
    }

    if (newInvitation.role === 'user' && !newInvitation.tenantId) {
      setInviteError(t('admin:invitations.orgSelectRequired'));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await adminInvitationsApi.create({
        email: emailTrimmed,
        role: newInvitation.role,
        tenantId: newInvitation.tenantId || undefined,
        tenantName: newInvitation.tenantName.trim() || undefined,
      });

      const link = response.data?.invitationLink;
      if (link) {
        setShowModal(false);
        setNewInvitation({ email: '', role: 'tenant_admin', tenantId: '', tenantName: '' });
        setCreatedInviteLink(link);
        loadData();
      } else {
        setInviteError(t('admin:invitations.inviteLinkFailed'));
        setShowModal(false);
        loadData();
      }
    } catch (error) {
      showToast('error', t('admin:invitations.inviteFailed'));
      setInviteError(error instanceof Error ? error.message : t('admin:invitations.inviteFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async (id: string) => {
    try {
      await adminInvitationsApi.resend(id);
      loadData();
    } catch (error) {
      showToast('error', t('admin:invitations.resendFailed'));
    }
  };

  const handleCancel = async (id: string) => {
    const confirmed = await confirm({ message: t('admin:invitations.cancelConfirm'), variant: 'danger' });
    if (!confirmed) return;

    try {
      await adminInvitationsApi.cancel(id);
      loadData();
    } catch (error) {
      showToast('error', t('admin:invitations.cancelFailed'));
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const getStatusBadge = (invitation: Invitation) => {
    if (invitation.accepted_at) {
      return <Badge variant="success">{t('admin:invitations.statusAccepted')}</Badge>;
    }
    if (new Date(invitation.expires_at) < new Date()) {
      return <Badge variant="danger">{t('admin:invitations.statusExpired')}</Badge>;
    }
    return <Badge variant="warning">{t('admin:invitations.statusPending')}</Badge>;
  };

  const columns: Column<Invitation>[] = [
    {
      key: 'email',
      header: t('admin:invitations.columnEmail'),
      render: (inv) => inv.email,
    },
    {
      key: 'role',
      header: t('admin:invitations.columnRole'),
      render: (inv) => roleLabels[inv.role] || inv.role,
    },
    {
      key: 'tenant',
      header: t('admin:invitations.columnOrganization'),
      render: (inv) => inv.existing_tenant_name || inv.tenant_name || '-',
    },
    {
      key: 'status',
      header: t('admin:invitations.columnStatus'),
      render: (inv) => getStatusBadge(inv),
    },
    {
      key: 'expires',
      header: t('admin:invitations.columnExpires'),
      render: (inv) => new Date(inv.expires_at).toLocaleDateString('tr-TR'),
    },
    {
      key: 'actions',
      header: '',
      render: (inv) => (
        <div className={styles.actions}>
          {!inv.accepted_at && new Date(inv.expires_at) >= new Date() && (
            <>
              {inv.invitationLink && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyLink(inv.invitationLink!)}
                >
                  {copiedLink === inv.invitationLink ? t('admin:invitations.copied') : t('admin:invitations.copyLink')}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleResend(inv.id)}
              >
                {t('admin:invitations.resend')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCancel(inv.id)}
              >
                {t('admin:invitations.cancel')}
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t('admin:invitations.title')}</h1>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          {t('admin:invitations.newInvite')}
        </Button>
      </div>

      <Card className={styles.filters}>
        <div className={styles.filterRow}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className={styles.select}
          >
            <option value="">{t('admin:invitations.allStatuses')}</option>
            <option value="pending">{t('admin:invitations.filterPending')}</option>
            <option value="accepted">{t('admin:invitations.filterAccepted')}</option>
            <option value="expired">{t('admin:invitations.filterExpired')}</option>
          </select>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          data={invitations}
          keyExtractor={(inv) => inv.id}
          loading={isLoading}
          emptyMessage={t('admin:invitations.emptyMessage')}
        />
      </Card>

      {/* Davet Linki Basari Modali */}
      {createdInviteLink && (
        <div className={styles.modalOverlay} onClick={() => setCreatedInviteLink(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{t('admin:invitations.inviteCreated')}</h2>
            <p style={{ marginBottom: '1rem', color: '#059669' }}>
              {t('admin:invitations.inviteSuccess')}
            </p>
            <div className={styles.formField}>
              <label>{t('admin:invitations.inviteLink')}</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={createdInviteLink}
                  readOnly
                  style={{ flex: 1 }}
                />
                <Button
                  variant="primary"
                  onClick={() => {
                    navigator.clipboard.writeText(createdInviteLink);
                    setCopiedLink(createdInviteLink);
                    setTimeout(() => setCopiedLink(null), 2000);
                  }}
                >
                  {copiedLink === createdInviteLink ? t('admin:invitations.copied') : t('admin:invitations.copy')}
                </Button>
              </div>
            </div>
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => setCreatedInviteLink(null)}>
                {t('admin:invitations.close')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{t('admin:invitations.newInviteTitle')}</h2>

            {inviteError && <div className={styles.error}>{inviteError}</div>}

            <form onSubmit={handleCreateInvitation}>
              <div className={styles.formField}>
                <label>{t('admin:invitations.labelEmail')}</label>
                <input
                  type="email"
                  value={newInvitation.email}
                  onChange={(e) => setNewInvitation({ ...newInvitation, email: e.target.value })}
                  placeholder={t('admin:invitations.emailPlaceholder')}
                  required
                />
              </div>

              <div className={styles.formField}>
                <label>{t('admin:invitations.labelRole')}</label>
                <select
                  value={newInvitation.role}
                  onChange={(e) => setNewInvitation({
                    ...newInvitation,
                    role: e.target.value,
                    tenantId: '',
                    tenantName: '',
                  })}
                >
                  <option value="tenant_admin">{t('admin:invitations.roleOrgAdminOption')}</option>
                  <option value="user">{t('admin:invitations.roleUserOption')}</option>
                </select>
              </div>

              {newInvitation.role === 'tenant_admin' && (
                <>
                  <div className={styles.formField}>
                    <label>{t('admin:invitations.existingOrg')}</label>
                    <select
                      value={newInvitation.tenantId}
                      onChange={(e) => setNewInvitation({
                        ...newInvitation,
                        tenantId: e.target.value,
                        tenantName: e.target.value ? '' : newInvitation.tenantName,
                      })}
                    >
                      <option value="">{t('admin:invitations.createNewOrg')}</option>
                      {tenants.map((tn) => (
                        <option key={tn.id} value={tn.id}>{tn.name}</option>
                      ))}
                    </select>
                  </div>

                  {!newInvitation.tenantId && (
                    <div className={styles.formField}>
                      <label>{t('admin:invitations.newOrgName')}</label>
                      <input
                        type="text"
                        value={newInvitation.tenantName}
                        onChange={(e) => setNewInvitation({ ...newInvitation, tenantName: e.target.value })}
                        placeholder={t('admin:invitations.newOrgPlaceholder')}
                      />
                    </div>
                  )}
                </>
              )}

              {newInvitation.role === 'user' && (
                <div className={styles.formField}>
                  <label>{t('admin:invitations.selectOrg')}</label>
                  <select
                    value={newInvitation.tenantId}
                    onChange={(e) => setNewInvitation({ ...newInvitation, tenantId: e.target.value })}
                    required
                  >
                    <option value="">{t('admin:invitations.selectOrgPlaceholder')}</option>
                    {tenants.map((tn) => (
                      <option key={tn.id} value={tn.id}>{tn.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className={styles.modalActions}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowModal(false)}
                >
                  {t('admin:invitations.cancelButton')}
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? t('admin:invitations.sending') : t('admin:invitations.sendInvite')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
