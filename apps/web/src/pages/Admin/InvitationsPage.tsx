import { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, type Column } from '@stok/ui';
import { adminInvitationsApi, Invitation } from '../../api/admin/invitations.api';
import { adminTenantsApi, Tenant } from '../../api/admin/tenants.api';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import styles from './AdminPages.module.css';

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  tenant_admin: 'Organizasyon Admini',
  manager: 'Yonetici',
  user: 'Kullanici',
};

export function InvitationsPage() {
  const { confirm } = useConfirmDialog();
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
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');

    // Email validasyonu
    const emailTrimmed = newInvitation.email.trim();
    if (!emailTrimmed) {
      setInviteError('E-posta adresi gerekli');
      return;
    }

    // Email format kontrolu
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setInviteError('Gecerli bir e-posta adresi girin');
      return;
    }

    // Organizasyon validasyonu
    if (newInvitation.role === 'tenant_admin' && !newInvitation.tenantId && !newInvitation.tenantName.trim()) {
      setInviteError('Yeni organizasyon adi girin veya mevcut organizasyon secin');
      return;
    }

    if ((newInvitation.role === 'manager' || newInvitation.role === 'user') && !newInvitation.tenantId) {
      setInviteError('Organizasyon secimi gerekli');
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

      console.log('Invitation response:', response);

      // Davet linkini goster
      const link = response.data?.invitationLink;
      if (link) {
        setShowModal(false);
        setNewInvitation({ email: '', role: 'tenant_admin', tenantId: '', tenantName: '' });
        setCreatedInviteLink(link);
        loadData();
      } else {
        setInviteError('Davet olusturuldu ancak link alinamadi');
        setShowModal(false);
        loadData();
      }
    } catch (error) {
      console.error('Invitation error:', error);
      setInviteError(error instanceof Error ? error.message : 'Davet gonderilemedi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async (id: string) => {
    try {
      await adminInvitationsApi.resend(id);
      loadData();
    } catch (error) {
      console.error('Failed to resend:', error);
    }
  };

  const handleCancel = async (id: string) => {
    const confirmed = await confirm({ message: 'Bu daveti iptal etmek istediginize emin misiniz?', variant: 'danger' });
    if (!confirmed) return;

    try {
      await adminInvitationsApi.cancel(id);
      loadData();
    } catch (error) {
      console.error('Failed to cancel:', error);
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const getStatusBadge = (invitation: Invitation) => {
    if (invitation.accepted_at) {
      return <Badge variant="success">Kabul Edildi</Badge>;
    }
    if (new Date(invitation.expires_at) < new Date()) {
      return <Badge variant="danger">Suresi Dolmus</Badge>;
    }
    return <Badge variant="warning">Bekliyor</Badge>;
  };

  const columns: Column<Invitation>[] = [
    {
      key: 'email',
      header: 'E-posta',
      render: (inv) => inv.email,
    },
    {
      key: 'role',
      header: 'Rol',
      render: (inv) => roleLabels[inv.role] || inv.role,
    },
    {
      key: 'tenant',
      header: 'Organizasyon',
      render: (inv) => inv.existing_tenant_name || inv.tenant_name || '-',
    },
    {
      key: 'status',
      header: 'Durum',
      render: (inv) => getStatusBadge(inv),
    },
    {
      key: 'expires',
      header: 'Bitis Tarihi',
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
                  {copiedLink === inv.invitationLink ? 'Kopyalandi!' : 'Link Kopyala'}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleResend(inv.id)}
              >
                Yeniden Gonder
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCancel(inv.id)}
              >
                Iptal
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
        <h1 className={styles.pageTitle}>Davetler</h1>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          Yeni Davet Gonder
        </Button>
      </div>

      <Card className={styles.filters}>
        <div className={styles.filterRow}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className={styles.select}
          >
            <option value="">Tum Durumlar</option>
            <option value="pending">Bekliyor</option>
            <option value="accepted">Kabul Edildi</option>
            <option value="expired">Suresi Dolmus</option>
          </select>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          data={invitations}
          keyExtractor={(inv) => inv.id}
          loading={isLoading}
          emptyMessage="Davet bulunamadi"
        />
      </Card>

      {/* Davet Linki Basari Modali */}
      {createdInviteLink && (
        <div className={styles.modalOverlay} onClick={() => setCreatedInviteLink(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Davet Olusturuldu</h2>
            <p style={{ marginBottom: '1rem', color: '#059669' }}>
              Davet basariyla olusturuldu. Asagidaki linki kopyalayip davet etmek istediginiz kisiye gonderin.
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
                <Button
                  variant="primary"
                  onClick={() => {
                    navigator.clipboard.writeText(createdInviteLink);
                    setCopiedLink(createdInviteLink);
                    setTimeout(() => setCopiedLink(null), 2000);
                  }}
                >
                  {copiedLink === createdInviteLink ? 'Kopyalandi!' : 'Kopyala'}
                </Button>
              </div>
            </div>
            <div className={styles.modalActions}>
              <Button variant="secondary" onClick={() => setCreatedInviteLink(null)}>
                Kapat
              </Button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>Yeni Davet Gonder</h2>

            {inviteError && <div className={styles.error}>{inviteError}</div>}

            <form onSubmit={handleCreateInvitation}>
              <div className={styles.formField}>
                <label>E-posta *</label>
                <input
                  type="email"
                  value={newInvitation.email}
                  onChange={(e) => setNewInvitation({ ...newInvitation, email: e.target.value })}
                  placeholder="ornek@sirket.com"
                  required
                />
              </div>

              <div className={styles.formField}>
                <label>Rol *</label>
                <select
                  value={newInvitation.role}
                  onChange={(e) => setNewInvitation({
                    ...newInvitation,
                    role: e.target.value,
                    tenantId: '',
                    tenantName: '',
                  })}
                >
                  <option value="tenant_admin">Organizasyon Admini (Yeni Org. Olusturur)</option>
                  <option value="manager">Yonetici (Mevcut Org.)</option>
                  <option value="user">Kullanici (Mevcut Org.)</option>
                </select>
              </div>

              {newInvitation.role === 'tenant_admin' && (
                <>
                  <div className={styles.formField}>
                    <label>Mevcut Organizasyon (Opsiyonel)</label>
                    <select
                      value={newInvitation.tenantId}
                      onChange={(e) => setNewInvitation({
                        ...newInvitation,
                        tenantId: e.target.value,
                        tenantName: e.target.value ? '' : newInvitation.tenantName,
                      })}
                    >
                      <option value="">Yeni organizasyon olustur</option>
                      {tenants.map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  {!newInvitation.tenantId && (
                    <div className={styles.formField}>
                      <label>Yeni Organizasyon Adi *</label>
                      <input
                        type="text"
                        value={newInvitation.tenantName}
                        onChange={(e) => setNewInvitation({ ...newInvitation, tenantName: e.target.value })}
                        placeholder="Yeni Sirket Ltd. Sti."
                      />
                    </div>
                  )}
                </>
              )}

              {(newInvitation.role === 'manager' || newInvitation.role === 'user') && (
                <div className={styles.formField}>
                  <label>Organizasyon *</label>
                  <select
                    value={newInvitation.tenantId}
                    onChange={(e) => setNewInvitation({ ...newInvitation, tenantId: e.target.value })}
                    required
                  >
                    <option value="">Organizasyon secin</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
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
                  Iptal
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Gonderiliyor...' : 'Davet Gonder'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
