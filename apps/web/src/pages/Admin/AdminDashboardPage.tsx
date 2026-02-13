import { useState, useEffect } from 'react';
import { Card, Spinner } from '@stok/ui';
import { adminDashboardApi, DashboardStats, PlanDistribution, ActivityLog } from '../../api/admin/dashboard.api';
import styles from './AdminPages.module.css';

export function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [planDistribution, setPlanDistribution] = useState<PlanDistribution[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, planRes, activityRes] = await Promise.all([
        adminDashboardApi.getStats(),
        adminDashboardApi.getPlanDistribution(),
        adminDashboardApi.getRecentActivity(10),
      ]);

      setStats(statsRes.data);
      setPlanDistribution(planRes.data);
      setRecentActivity(activityRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
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
      <h1 className={styles.pageTitle}>Admin Dashboard</h1>

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{stats?.totalTenants || 0}</div>
          <div className={styles.statLabel}>Toplam Kiraci</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{stats?.activeTenants || 0}</div>
          <div className={styles.statLabel}>Aktif Kiraci</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{stats?.trialTenants || 0}</div>
          <div className={styles.statLabel}>Deneme Surecinde</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{stats?.totalUsers || 0}</div>
          <div className={styles.statLabel}>Toplam Kullanici</div>
        </Card>
      </div>

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>
            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats?.totalRevenue || 0)}
          </div>
          <div className={styles.statLabel}>Toplam Gelir</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>
            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats?.monthlyRevenue || 0)}
          </div>
          <div className={styles.statLabel}>Bu Ay Gelir</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{stats?.activeUsers || 0}</div>
          <div className={styles.statLabel}>Aktif Kullanici</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{stats?.suspendedTenants || 0}</div>
          <div className={styles.statLabel}>Askiya Alinan</div>
        </Card>
      </div>

      <div className={styles.twoColumn}>
        <Card className={styles.section}>
          <h2 className={styles.sectionTitle}>Plan Dagilimi</h2>
          <div className={styles.planList}>
            {planDistribution.map((plan) => (
              <div key={plan.planName} className={styles.planItem}>
                <div className={styles.planInfo}>
                  <span className={styles.planName}>{plan.planName}</span>
                  <span className={styles.planCount}>{plan.count} kiraci</span>
                </div>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${plan.percentage}%` }}
                  />
                </div>
                <span className={styles.planPercentage}>{plan.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className={styles.section}>
          <h2 className={styles.sectionTitle}>Son Aktiviteler</h2>
          <div className={styles.activityList}>
            {recentActivity.map((activity) => (
              <div key={activity.id} className={styles.activityItem}>
                <div className={styles.activityMain}>
                  <span className={styles.activityAction}>{activity.action}</span>
                  {activity.entity_type && (
                    <span className={styles.activityEntity}>{activity.entity_type}</span>
                  )}
                </div>
                <div className={styles.activityMeta}>
                  <span>{activity.user_name || 'Sistem'}</span>
                  <span>{new Date(activity.created_at).toLocaleString('tr-TR')}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
