import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Badge, Card } from '@stok/ui';
import { crmApi, ContactDetail, CrmActivity } from '../../api/crm.api';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { useToast } from '../../context/ToastContext';
import { formatDate, formatDateTime } from '../../utils/formatters';
import styles from './ContactDetailPage.module.css';

type TabType = 'calls' | 'meetings' | 'notes';

const statusLabels: Record<string, string> = {
  lead: 'Potansiyel',
  prospect: 'Aday',
  customer: 'Musteri',
  inactive: 'Pasif',
};

const sourceLabels: Record<string, string> = {
  website: 'Web Sitesi',
  referral: 'Referans',
  social: 'Sosyal Medya',
  cold_call: 'Soguk Arama',
  event: 'Etkinlik',
  other: 'Diger',
};

const activityTypeLabels: Record<string, string> = {
  call: 'Arama',
  email: 'E-posta',
  meeting: 'Toplanti',
  note: 'Not',
  task: 'Gorev',
};

const activityStatusLabels: Record<string, string> = {
  planned: 'Planlandi',
  completed: 'Tamamlandi',
  cancelled: 'Iptal Edildi',
};

export function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { confirm } = useConfirmDialog();
  const { showToast } = useToast();
  const [data, setData] = useState<ContactDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('calls');
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await crmApi.getContactDetail(id);
        setData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Veri yuklenemedi');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleConvertToCustomer = async () => {
    if (!id || !data) return;

    if (data.contact.customer_id) {
      showToast('info', 'Bu kisi zaten bir musteriye baglidir.');
      return;
    }

    const confirmed = await confirm({ message: 'Bu kisiyi musteriye donusturmek istediginize emin misiniz?', variant: 'warning' });
    if (!confirmed) return;

    try {
      setConverting(true);
      const response = await crmApi.convertToCustomer(id);
      showToast('success', 'Kisi basariyla musteriye donusturuldu!');
      navigate(`/customers/${response.data.customerId}`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Donusturme islemi basarisiz oldu');
    } finally {
      setConverting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Yukleniyor...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>{error || 'Kisi bulunamadi'}</div>
        <Button onClick={() => navigate('/crm')}>Geri Don</Button>
      </div>
    );
  }

  const { contact, activities, stats } = data;

  // Filter activities by type
  const calls = activities.filter((a) => a.type === 'call' || a.type === 'email');
  const meetings = activities.filter((a) => a.type === 'meeting');
  const notes = activities.filter((a) => a.type === 'note' || a.type === 'task');

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'customer':
        return 'success';
      case 'lead':
        return 'warning';
      case 'prospect':
        return 'info';
      case 'inactive':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Button variant="ghost" onClick={() => navigate('/crm')}>
            ← Kisiler
          </Button>
          <h1 className={styles.title}>{contact.name}</h1>
          <div className={styles.contactMeta}>
            {contact.title && <span className={styles.position}>{contact.title}</span>}
            <Badge variant={getStatusBadgeVariant(contact.status)}>
              {statusLabels[contact.status]}
            </Badge>
            {contact.customer_id && (
              <Badge variant="success">Musteri Bagli</Badge>
            )}
          </div>
        </div>
        <div className={styles.headerRight}>
          {!contact.customer_id && contact.status !== 'customer' && (
            <Button
              variant="primary"
              onClick={handleConvertToCustomer}
              disabled={converting}
            >
              {converting ? 'Donusturuluyor...' : 'Musteriye Donustur'}
            </Button>
          )}
          {contact.customer_id && (
            <Button
              variant="secondary"
              onClick={() => navigate(`/customers/${contact.customer_id}`)}
            >
              Musteriyi Gor
            </Button>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <div className={styles.infoGrid}>
        <Card className={styles.infoCard}>
          <h3>Kisi Bilgileri</h3>
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Ad Soyad</span>
              <span className={styles.infoValue}>{contact.name}</span>
            </div>
            {contact.email && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>E-posta</span>
                <span className={styles.infoValue}>
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </span>
              </div>
            )}
            {contact.phone && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Telefon</span>
                <span className={styles.infoValue}>
                  <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                </span>
              </div>
            )}
            {contact.mobile && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Mobil</span>
                <span className={styles.infoValue}>
                  <a href={`tel:${contact.mobile}`}>{contact.mobile}</a>
                </span>
              </div>
            )}
            {contact.customer_name && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Sirket</span>
                <span className={styles.infoValue}>{contact.customer_name}</span>
              </div>
            )}
            {contact.title && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Pozisyon</span>
                <span className={styles.infoValue}>{contact.title}</span>
              </div>
            )}
            {contact.source && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Kaynak</span>
                <span className={styles.infoValue}>{sourceLabels[contact.source]}</span>
              </div>
            )}
            {contact.notes && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Notlar</span>
                <span className={styles.infoValue}>{contact.notes}</span>
              </div>
            )}
          </div>
        </Card>

        <Card className={styles.statsCard}>
          <h3>Aktivite Ozeti</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.totalActivities}</span>
              <span className={styles.statLabel}>Toplam</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.completedActivities}</span>
              <span className={styles.statLabel}>Tamamlanan</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.plannedActivities}</span>
              <span className={styles.statLabel}>Planlanan</span>
            </div>
          </div>
          <div className={styles.typeStats}>
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className={styles.typeStatItem}>
                <span className={styles.typeLabel}>{activityTypeLabels[type] || type}</span>
                <span className={styles.typeValue}>{count}</span>
              </div>
            ))}
          </div>
          <div className={styles.dateInfo}>
            {contact.last_contact_date && (
              <div className={styles.dateItem}>
                <span className={styles.dateLabel}>Son Iletisim</span>
                <span className={styles.dateValue}>{formatDate(contact.last_contact_date)}</span>
              </div>
            )}
            {contact.next_follow_up && (
              <div className={styles.dateItem}>
                <span className={styles.dateLabel}>Sonraki Takip</span>
                <span className={styles.dateValue}>{formatDate(contact.next_follow_up)}</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Activity Tabs */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'calls' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('calls')}
          >
            Aramalar / E-postalar ({calls.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'meetings' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('meetings')}
          >
            Toplantilar ({meetings.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'notes' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            Notlar / Gorevler ({notes.length})
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'calls' && (
            <ActivitiesTab activities={calls} />
          )}
          {activeTab === 'meetings' && (
            <ActivitiesTab activities={meetings} />
          )}
          {activeTab === 'notes' && (
            <ActivitiesTab activities={notes} />
          )}
        </div>
      </div>
    </div>
  );
}

function ActivitiesTab({ activities }: { activities: CrmActivity[] }) {
  if (activities.length === 0) {
    return <div className={styles.emptyState}>Henuz aktivite yok</div>;
  }

  return (
    <div className={styles.activitiesList}>
      {activities.map((activity) => (
        <div key={activity.id} className={styles.activityCard}>
          <div className={styles.activityHeader}>
            <div className={styles.activityInfo}>
              <span className={styles.activitySubject}>{activity.subject}</span>
              <span className={styles.activityDate}>
                {activity.scheduled_at
                  ? formatDateTime(activity.scheduled_at)
                  : formatDateTime(activity.created_at)}
              </span>
            </div>
            <div className={styles.activityMeta}>
              <Badge
                variant={
                  activity.status === 'completed'
                    ? 'success'
                    : activity.status === 'cancelled'
                    ? 'danger'
                    : 'warning'
                }
              >
                {activityStatusLabels[activity.status]}
              </Badge>
              <span className={styles.activityType}>
                {activityTypeLabels[activity.type]}
              </span>
              {activity.duration_minutes && (
                <span className={styles.activityDuration}>
                  {activity.duration_minutes} dk
                </span>
              )}
            </div>
          </div>
          {activity.description && (
            <div className={styles.activityDescription}>
              {activity.description}
            </div>
          )}
          {activity.completed_at && (
            <div className={styles.activityCompleted}>
              Tamamlandi: {formatDateTime(activity.completed_at)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
