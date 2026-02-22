import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Badge, Card } from '@stok/ui';
import { crmApi, ContactDetail, CrmActivity } from '../../api/crm.api';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { useToast } from '../../context/ToastContext';
import { formatDate, formatDateTime } from '../../utils/formatters';
import styles from './ContactDetailPage.module.css';

type TabType = 'calls' | 'meetings' | 'notes';

export function ContactDetailPage() {
  const { t } = useTranslation(['crm', 'common']);
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
        setError(err instanceof Error ? err.message : t('crm:toast.dataLoadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleConvertToCustomer = async () => {
    if (!id || !data) return;

    if (data.contact.customer_id) {
      showToast('info', t('crm:toast.alreadyLinked'));
      return;
    }

    const confirmed = await confirm({ message: t('crm:confirm.convert'), variant: 'warning' });
    if (!confirmed) return;

    try {
      setConverting(true);
      const response = await crmApi.convertToCustomer(id);
      showToast('success', t('crm:toast.convertSuccess'));
      navigate(`/customers/${response.data.customerId}`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('crm:toast.convertError'));
    } finally {
      setConverting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>{t('crm:detail.loading')}</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>{error || t('crm:detail.notFound')}</div>
        <Button onClick={() => navigate('/crm')}>{t('crm:buttons.back')}</Button>
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
            {t('crm:buttons.backToContacts')}
          </Button>
          <h1 className={styles.title}>{contact.name}</h1>
          <div className={styles.contactMeta}>
            {contact.title && <span className={styles.position}>{contact.title}</span>}
            <Badge variant={getStatusBadgeVariant(contact.status)}>
              {t(`crm:status.${contact.status}`)}
            </Badge>
            {contact.customer_id && (
              <Badge variant="success">{t('crm:detail.customerLinked')}</Badge>
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
              {converting ? t('crm:buttons.converting') : t('crm:buttons.convertToCustomer')}
            </Button>
          )}
          {contact.customer_id && (
            <Button
              variant="secondary"
              onClick={() => navigate(`/customers/${contact.customer_id}`)}
            >
              {t('crm:buttons.viewCustomer')}
            </Button>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <div className={styles.infoGrid}>
        <Card className={styles.infoCard}>
          <h3>{t('crm:detail.contactInfo')}</h3>
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('crm:detail.labels.name')}</span>
              <span className={styles.infoValue}>{contact.name}</span>
            </div>
            {contact.email && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('crm:detail.labels.email')}</span>
                <span className={styles.infoValue}>
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </span>
              </div>
            )}
            {contact.phone && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('crm:detail.labels.phone')}</span>
                <span className={styles.infoValue}>
                  <a href={`tel:${contact.phone}`}>{contact.phone}</a>
                </span>
              </div>
            )}
            {contact.mobile && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('crm:detail.labels.mobile')}</span>
                <span className={styles.infoValue}>
                  <a href={`tel:${contact.mobile}`}>{contact.mobile}</a>
                </span>
              </div>
            )}
            {contact.customer_name && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('crm:detail.labels.company')}</span>
                <span className={styles.infoValue}>{contact.customer_name}</span>
              </div>
            )}
            {contact.title && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('crm:detail.labels.position')}</span>
                <span className={styles.infoValue}>{contact.title}</span>
              </div>
            )}
            {contact.source && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('crm:detail.labels.source')}</span>
                <span className={styles.infoValue}>{t(`crm:source.${contact.source}`)}</span>
              </div>
            )}
            {contact.notes && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('crm:detail.labels.notes')}</span>
                <span className={styles.infoValue}>{contact.notes}</span>
              </div>
            )}
          </div>
        </Card>

        <Card className={styles.statsCard}>
          <h3>{t('crm:detail.activitySummary')}</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.totalActivities}</span>
              <span className={styles.statLabel}>{t('crm:detail.stats.total')}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.completedActivities}</span>
              <span className={styles.statLabel}>{t('crm:detail.stats.completed')}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.plannedActivities}</span>
              <span className={styles.statLabel}>{t('crm:detail.stats.planned')}</span>
            </div>
          </div>
          <div className={styles.typeStats}>
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className={styles.typeStatItem}>
                <span className={styles.typeLabel}>{t(`crm:activityType.${type}`, { defaultValue: type })}</span>
                <span className={styles.typeValue}>{count}</span>
              </div>
            ))}
          </div>
          <div className={styles.dateInfo}>
            {contact.last_contact_date && (
              <div className={styles.dateItem}>
                <span className={styles.dateLabel}>{t('crm:detail.labels.lastContact')}</span>
                <span className={styles.dateValue}>{formatDate(contact.last_contact_date)}</span>
              </div>
            )}
            {contact.next_follow_up && (
              <div className={styles.dateItem}>
                <span className={styles.dateLabel}>{t('crm:detail.labels.nextFollowUp')}</span>
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
            {t('crm:detail.tabs.callsEmails', { count: calls.length })}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'meetings' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('meetings')}
          >
            {t('crm:detail.tabs.meetings', { count: meetings.length })}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'notes' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            {t('crm:detail.tabs.notesAndTasks', { count: notes.length })}
          </button>
        </div>

        <div className={styles.tabContent}>
          {activeTab === 'calls' && (
            <ActivitiesTab activities={calls} t={t} />
          )}
          {activeTab === 'meetings' && (
            <ActivitiesTab activities={meetings} t={t} />
          )}
          {activeTab === 'notes' && (
            <ActivitiesTab activities={notes} t={t} />
          )}
        </div>
      </div>
    </div>
  );
}

function ActivitiesTab({ activities, t }: { activities: CrmActivity[]; t: (key: string, options?: Record<string, unknown>) => string }) {
  if (activities.length === 0) {
    return <div className={styles.emptyState}>{t('crm:detail.emptyActivities')}</div>;
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
                {t(`crm:activityStatus.${activity.status}`)}
              </Badge>
              <span className={styles.activityType}>
                {t(`crm:activityType.${activity.type}`)}
              </span>
              {activity.duration_minutes && (
                <span className={styles.activityDuration}>
                  {t('crm:detail.durationMinutes', { minutes: activity.duration_minutes })}
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
              {t('crm:detail.completedAt', { date: formatDateTime(activity.completed_at) })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
