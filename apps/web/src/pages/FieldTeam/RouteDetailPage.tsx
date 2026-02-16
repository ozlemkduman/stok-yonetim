import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Badge, Card } from '@stok/ui';
import { fieldTeamApi, RouteDetail, FieldVisit } from '../../api/field-team.api';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/formatters';
import styles from './RouteDetailPage.module.css';

const statusLabels: Record<string, string> = {
  planned: 'Planli',
  in_progress: 'Devam Ediyor',
  completed: 'Tamamlandi',
  cancelled: 'Iptal',
};

const visitStatusLabels: Record<string, string> = {
  pending: 'Beklemede',
  in_progress: 'Devam Ediyor',
  completed: 'Tamamlandi',
  skipped: 'Atlandi',
  rescheduled: 'Ertelendi',
};

const visitTypeLabels: Record<string, string> = {
  sales: 'Satis',
  support: 'Destek',
  collection: 'Tahsilat',
  delivery: 'Teslimat',
  meeting: 'Toplanti',
  other: 'Diger',
};

export function RouteDetailPage() {
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
        setError(err instanceof Error ? err.message : 'Veri yuklenemedi');
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
      showToast('error', 'Giris yapilirken hata olustu');
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
      showToast('error', 'Cikis yapilirken hata olustu');
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
      showToast('error', 'Ziyaret atlanamadi');
    }
  };

  const handleStartRoute = async () => {
    if (!id) return;
    try {
      await fieldTeamApi.startRoute(id);
      const response = await fieldTeamApi.getRouteDetail(id);
      setData(response.data);
    } catch (err) {
      showToast('error', 'Rota baslatilamadi');
    }
  };

  const handleCompleteRoute = async () => {
    if (!id) return;
    try {
      await fieldTeamApi.completeRoute(id);
      const response = await fieldTeamApi.getRouteDetail(id);
      setData(response.data);
    } catch (err) {
      showToast('error', 'Rota tamamlanamadi');
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
        <div className={styles.error}>{error || 'Rota bulunamadi'}</div>
        <Button onClick={() => navigate('/field-team')}>Geri Don</Button>
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
      return `${diffMins} dk`;
    }
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}s ${mins}dk`;
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Button variant="ghost" onClick={() => navigate('/field-team')}>
            ← Rotalar
          </Button>
          <h1 className={styles.title}>{route.name}</h1>
          <div className={styles.routeMeta}>
            <span>{formatDate(route.route_date)}</span>
            {assignedUser && <span>Atanan: {assignedUser.name}</span>}
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
              {statusLabels[route.status]}
            </Badge>
          </div>
        </div>
        <div className={styles.headerRight}>
          {route.status === 'planned' && (
            <Button variant="primary" onClick={handleStartRoute}>
              Rotayi Baslat
            </Button>
          )}
          {route.status === 'in_progress' && (
            <Button variant="primary" onClick={handleCompleteRoute}>
              Rotayi Tamamla
            </Button>
          )}
        </div>
      </div>

      {/* Info Grid */}
      <div className={styles.infoGrid}>
        <Card className={styles.infoCard}>
          <h3>Rota Bilgileri</h3>
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Tarih</span>
              <span className={styles.infoValue}>{formatDate(route.route_date)}</span>
            </div>
            {assignedUser && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Atanan Kullanici</span>
                <span className={styles.infoValue}>{assignedUser.name}</span>
              </div>
            )}
            {route.estimated_duration_minutes && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Tahmini Sure</span>
                <span className={styles.infoValue}>
                  {Math.floor(route.estimated_duration_minutes / 60)}s{' '}
                  {route.estimated_duration_minutes % 60}dk
                </span>
              </div>
            )}
            {route.actual_duration_minutes && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Gercek Sure</span>
                <span className={styles.infoValue}>
                  {Math.floor(route.actual_duration_minutes / 60)}s{' '}
                  {route.actual_duration_minutes % 60}dk
                </span>
              </div>
            )}
            {route.notes && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Notlar</span>
                <span className={styles.infoValue}>{route.notes}</span>
              </div>
            )}
          </div>
        </Card>

        <Card className={styles.statsCard}>
          <h3>Istatistikler</h3>
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <span className={styles.statValue}>{stats.totalVisits}</span>
              <span className={styles.statLabel}>Toplam Ziyaret</span>
            </div>
            <div className={styles.statItem}>
              <span className={`${styles.statValue} ${styles.statCompleted}`}>
                {stats.completedVisits}
              </span>
              <span className={styles.statLabel}>Tamamlanan</span>
            </div>
            <div className={styles.statItem}>
              <span className={`${styles.statValue} ${styles.statPending}`}>
                {stats.pendingVisits}
              </span>
              <span className={styles.statLabel}>Bekleyen</span>
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
              {stats.totalVisits > 0
                ? Math.round((stats.completedVisits / stats.totalVisits) * 100)
                : 0}
              % Tamamlandi
            </span>
          </div>
        </Card>
      </div>

      {/* Visits List */}
      <div className={styles.visitsSection}>
        <h2 className={styles.sectionTitle}>Ziyaretler ({visits.length})</h2>

        {visits.length === 0 ? (
          <Card className={styles.emptyState}>
            <p>Bu rotaya henuz ziyaret eklenmemis</p>
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
                      {visit.customer_name || visit.contact_name || 'Isimsiz Ziyaret'}
                    </div>
                    <div className={styles.visitMeta}>
                      <span className={styles.visitType}>
                        {visitTypeLabels[visit.visit_type] || visit.visit_type}
                      </span>
                      {visit.scheduled_time && (
                        <span className={styles.scheduledTime}>
                          Planlanan: {formatTime(visit.scheduled_time)}
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
                      {visitStatusLabels[visit.status]}
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
                          <span className={styles.detailLabel}>Adres</span>
                          <span className={styles.detailValue}>{visit.address}</span>
                        </div>
                      )}
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Giris Saati</span>
                        <span className={styles.detailValue}>
                          {formatTime(visit.check_in_time)}
                        </span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>Cikis Saati</span>
                        <span className={styles.detailValue}>
                          {formatTime(visit.check_out_time)}
                        </span>
                      </div>
                      {getVisitDuration(visit) && (
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Sure</span>
                          <span className={styles.detailValue}>
                            {getVisitDuration(visit)}
                          </span>
                        </div>
                      )}
                      {visit.outcome && (
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Sonuc</span>
                          <span className={styles.detailValue}>{visit.outcome}</span>
                        </div>
                      )}
                      {visit.notes && (
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Notlar</span>
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
                              Giris Yap
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleSkipVisit(visit.id)}
                            >
                              Atla
                            </Button>
                          </>
                        )}
                        {visit.status === 'in_progress' && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleCheckOut(visit.id)}
                          >
                            Cikis Yap
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
