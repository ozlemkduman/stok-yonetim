import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Spinner } from '@stok/ui';
import { adminDashboardApi, DashboardStats, PlanDistribution, ActivityLog } from '../../api/admin/dashboard.api';
import { useToast } from '../../context/ToastContext';
import styles from './AdminPages.module.css';

export function AdminDashboardPage() {
  const { t } = useTranslation(['admin', 'common']);
  const { showToast } = useToast();
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
      showToast('error', t('admin:dashboard.loadFailed'));
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
      <h1 className={styles.pageTitle}>{t('admin:dashboard.title')}</h1>

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{stats?.totalTenants || 0}</div>
          <div className={styles.statLabel}>{t('admin:dashboard.totalOrganizations')}</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{stats?.activeTenants || 0}</div>
          <div className={styles.statLabel}>{t('admin:dashboard.activeOrganizations')}</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{stats?.trialTenants || 0}</div>
          <div className={styles.statLabel}>{t('admin:dashboard.trialOrganizations')}</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{stats?.totalUsers || 0}</div>
          <div className={styles.statLabel}>{t('admin:dashboard.totalUsers')}</div>
        </Card>
      </div>

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>
            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats?.totalRevenue || 0)}
          </div>
          <div className={styles.statLabel}>{t('admin:dashboard.totalRevenue')}</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>
            {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats?.monthlyRevenue || 0)}
          </div>
          <div className={styles.statLabel}>{t('admin:dashboard.monthlyRevenue')}</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{stats?.activeUsers || 0}</div>
          <div className={styles.statLabel}>{t('admin:dashboard.activeUsers')}</div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statValue}>{stats?.suspendedTenants || 0}</div>
          <div className={styles.statLabel}>{t('admin:dashboard.suspendedTenants')}</div>
        </Card>
      </div>

      <div className={styles.twoColumn}>
        <Card className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('admin:dashboard.planDistribution')}</h2>
          <div className={styles.planList}>
            {planDistribution.map((plan) => (
              <div key={plan.planName} className={styles.planItem}>
                <div className={styles.planInfo}>
                  <span className={styles.planName}>{plan.planName}</span>
                  <span className={styles.planCount}>{t('admin:dashboard.organizationCount', { count: plan.count })}</span>
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
          <h2 className={styles.sectionTitle}>{t('admin:dashboard.recentActivity')}</h2>
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
                  <span>{activity.user_name || t('admin:dashboard.system')}</span>
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
