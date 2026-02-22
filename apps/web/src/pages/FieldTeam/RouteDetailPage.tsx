import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Badge, Card } from '@stok/ui';
import { fieldTeamApi, RouteDetail, FieldVisit } from '../../api/field-team.api';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';
import styles from './RouteDetailPage.module.css';

export function RouteDetailPage() {
  const { t } = useTranslation(['fieldteam', 'common']);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [data, setData] = useState<RouteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedVisit, setExpandedVisit] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fieldTeamApi.getRouteDetail(id);
        setData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('fieldteam:toast.dataLoadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleCheckIn = async (visitId: string) => {
    try {
      await fieldTeamApi.checkInVisit(visitId);
      // Refresh data
      if (id) {
        const response = await fieldTeamApi.getRouteDetail(id);
        setData(response.data);
      }
    } catch (err) {
      showToast('error', t('fieldteam:toast.checkInError'));
    }
  };

  const handleCheckOut = async (visitId: string) => {
    try {
      await fieldTeamApi.checkOutVisit(visitId);
      // Refresh data
      if (id) {
        const response = await fieldTeamApi.getRouteDetail(id);
        setData(response.data);
      }
    } catch (err) {
      showToast('error', t('fieldteam:toast.checkOutError'));
    }
  };

  const handleSkipVisit = async (visitId: string) => {
    try {
      await fieldTeamApi.skipVisit(visitId);
      // Refresh data
      if (id) {
        const response = await fieldTeamApi.getRouteDetail(id);
        setData(response.data);
      }
    } catch (err) {
      showToast('error', t('fieldteam:toast.skipError'));
    }
  };

  const handleStartRoute = async () => {
    if (!id) return;
    try {
      await fieldTeamApi.startRoute(id);
      const response = await fieldTeamApi.getRouteDetail(id);
      setData(response.data);
    } catch (err) {
      showToast('error', t('fieldteam:toast.startError'));
    }
  };

  const handleCompleteRoute = async () => {
    if (!id) return;
    try {
      await fieldTeamApi.completeRoute(id);
      const response = await fieldTeamApi.getRouteDetail(id);
      setData(response.data);
    } catch (err) {
      showToast('error', t('fieldteam:toast.completeError'));
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>{t('fieldteam:detail.loading')}</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>{error || t('fieldteam:detail.notFound')}</div>
        <Button onClick={() => navigate('/field-team')}>{t('fieldteam:buttons.back')}</Button>
      </div>
    );
  }

  const { route, visits, stats, assignedUser } = data;

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getVisitDuration = (visit: FieldVisit) => {
    if (!visit.check_in_time || !visit.check_out_time) return null;
    const checkIn = new Date(visit.check_in_time);
    const checkOut = new Date(visit.check_out_time);
    const diffMs = checkOut.getTime() - checkIn.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) {
      return t('fieldteam:durationMinutes', { minutes: diffMins });
    }
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return t('fieldteam:durationFormat', { hours, minutes: mins });
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Button variant="ghost" onClick={() => navigate('/field-team')}>
            {t('fieldteam:buttons.backToRoutes')}
          </Button>
          <h1 className={styles.title}>{route.name}</h1>
          <div className={styles.routeMeta}>
            <span>{formatDate(route.route_date)}</span>
            {assignedUser && <span>{t('fieldteam:detail.assignedTo', { name: assignedUser.name })}</span>}
            <Badge
              variant={
                route.status === 'completed'
                  ? 'success'
                  : route.status === 'in_progress'
                  ? 'warning'
                  : route.status === 'cancelled'
                  ? 'danger'
                  : 'default'
              }
            >
              {t(`fieldteam:status.${route.status}`)}
            </Badge>
          </div>
        </div>
        <div className={styles.headerRight}>
          {route.status === 'planned' && (
            <Button variant="primary" onClick={handleStartRoute}>
              {t('fieldteam:buttons.startRoute')}
            </Button>
          )}
          {route.status === 'in_progress' && (
            <Button variant="primary" onClick={handleCompleteRoute}>
              {t('fieldteam:buttons.completeRoute')}
            </Button>
          )}
        </div>
      </div>

      {/* Info Grid */}
      <div className={styles.infoGrid}>
        <Card className={styles.infoCard}>
          <h3>{t('fieldteam:detail.routeInfo')}</h3>
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('fieldteam:detail.labels.date')}</span>
              <span className={styles.infoValue}>{formatDate(route.route_date)}</span>
            </div>
            {assignedUser && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('fieldteam:detail.labels.assignedUser')}</span>
                <span className={styles.infoValue}>{assignedUser.name}</span>
              </div>
            )}
            {route.estimated_duration_minutes && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('fieldteam:detail.labels.estimatedDuration')}</span>
                <span className={styles.infoValue}>
                  {t('fieldteam:durationFormat', {
                    hours: Math.floor(route.estimated_duration_minutes / 60),
                    minutes: route.estimated_duration_minutes % 60,
                  })}
                </span>
              </div>
            )}
            {route.actual_duration_minutes && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('fieldteam:detail.labels.actualDuration')}</span>
                <span className={styles.infoValue}>
                  {t('fieldteam:durationFormat', {
                    hours: Math.floor(route.actual_duration_minutes / 60),
                    minutes: route.actual_duration_minutes % 60,
                  })}
                </span>
              </div>
            )}
            {route.notes && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('fieldteam:detail.labels.notes')}</span>
                <span className={styles.infoValue}>{route.notes}</span>
              </div>
            )}
          </div>
        </Card>

        <Card className={styles.statsCard}>
          <h3>{t('fieldteam:detail.statistics')}</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.totalVisits}</span>
              <span className={styles.statLabel}>{t('fieldteam:detail.stats.totalVisits')}</span>
            </div>
            <div className={styles.statItem}>
              <span className={`${styles.statValue} ${styles.statCompleted}`}>
                {stats.completedVisits}
              </span>
              <span className={styles.statLabel}>{t('fieldteam:detail.stats.completed')}</span>
            </div>
            <div className={styles.statItem}>
              <span className={`${styles.statValue} ${styles.statPending}`}>
                {stats.pendingVisits}
              </span>
              <span className={styles.statLabel}>{t('fieldteam:detail.stats.pending')}</span>
            </div>
          </div>
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${
                    stats.totalVisits > 0
                      ? (stats.completedVisits / stats.totalVisits) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
            <span className={styles.progressText}>
              {t('fieldteam:detail.stats.completionPercent', {
                percent: stats.totalVisits > 0
                  ? Math.round((stats.completedVisits / stats.totalVisits) * 100)
                  : 0,
              })}
            </span>
          </div>
        </Card>
      </div>

      {/* Visits List */}
      <div className={styles.visitsSection}>
        <h2 className={styles.sectionTitle}>{t('fieldteam:detail.visitsSection', { count: visits.length })}</h2>

        {visits.length === 0 ? (
          <Card className={styles.emptyState}>
            <p>{t('fieldteam:detail.noVisits')}</p>
          </Card>
        ) : (
          <div className={styles.visitsList}>
            {visits.map((visit, index) => (
              <Card key={visit.id} className={styles.visitCard}>
                <div
                  className={styles.visitHeader}
                  onClick={() =>
                    setExpandedVisit(expandedVisit === visit.id ? null : visit.id)
                  }
                >
                  <div className={styles.visitOrder}>{index + 1}</div>
                  <div className={styles.visitInfo}>
                    <div className={styles.visitName}>
                      {visit.customer_name || visit.contact_name || t('fieldteam:detail.unnamedVisit')}
                    </div>
                    <div className={styles.visitMeta}>
                      <span className={styles.visitType}>
                        {t(`fieldteam:visitType.${visit.visit_type}`, { defaultValue: visit.visit_type })}
                      </span>
                      {visit.scheduled_time && (
                        <span className={styles.scheduledTime}>
                          {t('fieldteam:detail.labels.scheduled', { time: formatTime(visit.scheduled_time) })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.visitStatus}>
                    <Badge
                      variant={
                        visit.status === 'completed'
                          ? 'success'
                          : visit.status === 'in_progress'
                          ? 'warning'
                          : visit.status === 'skipped'
                          ? 'danger'
                          : 'default'
                      }
                    >
                      {t(`fieldteam:visitStatus.${visit.status}`)}
                    </Badge>
                    <span className={styles.expandIcon}>
                      {expandedVisit === visit.id ? '▼' : '▶'}
                    </span>
                  </div>
                </div>

                {expandedVisit === visit.id && (
                  <div className={styles.visitDetails}>
                    <div className={styles.visitDetailsGrid}>
                      {visit.address && (
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>{t('fieldteam:detail.labels.address')}</span>
                          <span className={styles.detailValue}>{visit.address}</span>
                        </div>
                      )}
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>{t('fieldteam:detail.labels.checkInTime')}</span>
                        <span className={styles.detailValue}>
                          {formatTime(visit.check_in_time)}
                        </span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>{t('fieldteam:detail.labels.checkOutTime')}</span>
                        <span className={styles.detailValue}>
                          {formatTime(visit.check_out_time)}
                        </span>
                      </div>
                      {getVisitDuration(visit) && (
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>{t('fieldteam:detail.labels.duration')}</span>
                          <span className={styles.detailValue}>
                            {getVisitDuration(visit)}
                          </span>
                        </div>
                      )}
                      {visit.outcome && (
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>{t('fieldteam:detail.labels.outcome')}</span>
                          <span className={styles.detailValue}>{visit.outcome}</span>
                        </div>
                      )}
                      {visit.notes && (
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>{t('fieldteam:detail.labels.notes')}</span>
                          <span className={styles.detailValue}>{visit.notes}</span>
                        </div>
                      )}
                    </div>

                    {route.status === 'in_progress' && visit.status !== 'completed' && visit.status !== 'skipped' && (
                      <div className={styles.visitActions}>
                        {visit.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => handleCheckIn(visit.id)}
                            >
                              {t('fieldteam:buttons.checkIn')}
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleSkipVisit(visit.id)}
                            >
                              {t('fieldteam:buttons.skip')}
                            </Button>
                          </>
                        )}
                        {visit.status === 'in_progress' && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleCheckOut(visit.id)}
                          >
                            {t('fieldteam:buttons.checkOut')}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
