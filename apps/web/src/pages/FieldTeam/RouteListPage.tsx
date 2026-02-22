import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Table, Button, Card, Select, type Column } from '@stok/ui';
import { fieldTeamApi, FieldRoute } from '../../api/field-team.api';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { useToast } from '../../context/ToastContext';
import { RouteFormModal } from './RouteFormModal';
import styles from './RouteListPage.module.css';

export function RouteListPage() {
  const { t } = useTranslation(['fieldteam', 'common']);
  const navigate = useNavigate();
  const { confirm } = useConfirmDialog();
  const { showToast } = useToast();
  const [routes, setRoutes] = useState<FieldRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<FieldRoute | null>(null);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const response = await fieldTeamApi.getRoutes({
        page,
        limit: 20,
        status: statusFilter || undefined,
      });
      setRoutes(response.data);
      if (response.meta) {
        setTotalPages(response.meta.totalPages);
      }
    } catch (error) {
      showToast('error', t('fieldteam:toast.loadError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, [page, statusFilter]);

  const handleAdd = () => {
    setSelectedRoute(null);
    setModalOpen(true);
  };

  const handleEdit = (route: FieldRoute) => {
    setSelectedRoute(route);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({ message: t('fieldteam:confirm.delete'), variant: 'danger' });
    if (!confirmed) return;
    try {
      await fieldTeamApi.deleteRoute(id);
      fetchRoutes();
    } catch (error) {
      showToast('error', t('fieldteam:toast.deleteError'));
    }
  };

  const handleStartRoute = async (id: string) => {
    try {
      await fieldTeamApi.startRoute(id);
      fetchRoutes();
    } catch (error) {
      showToast('error', t('fieldteam:toast.startError'));
    }
  };

  const handleCompleteRoute = async (id: string) => {
    try {
      await fieldTeamApi.completeRoute(id);
      fetchRoutes();
    } catch (error) {
      showToast('error', t('fieldteam:toast.completeError'));
    }
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedRoute(null);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    fetchRoutes();
  };

  const handleViewDetail = (id: string) => {
    navigate(`/field-team/${id}`);
  };

  const columns: Column<FieldRoute>[] = [
    {
      key: 'name',
      header: t('fieldteam:columns.routeName'),
      width: '20%',
      render: (item) => (
        <span
          className={styles.routeLink}
          onClick={() => handleViewDetail(item.id)}
        >
          {item.name}
        </span>
      ),
    },
    {
      key: 'route_date',
      header: t('fieldteam:columns.date'),
      width: '12%',
      render: (item) => new Date(item.route_date).toLocaleDateString('tr-TR'),
    },
    {
      key: 'status',
      header: t('fieldteam:columns.status'),
      width: '12%',
      render: (item) => (
        <span className={`${styles.badge} ${styles[`badge_${item.status}`]}`}>
          {t(`fieldteam:status.${item.status}`)}
        </span>
      ),
    },
    {
      key: 'visit_count',
      header: t('fieldteam:columns.visits'),
      width: '10%',
      render: (item) => `${item.completed_count || 0}/${item.visit_count || 0}`,
    },
    {
      key: 'estimated_duration_minutes',
      header: t('fieldteam:columns.estimatedDuration'),
      width: '12%',
      render: (item) =>
        item.estimated_duration_minutes
          ? t('fieldteam:durationFormat', {
              hours: Math.floor(item.estimated_duration_minutes / 60),
              minutes: item.estimated_duration_minutes % 60,
            })
          : '-',
    },
    {
      key: 'actions',
      header: t('fieldteam:columns.actions'),
      width: '34%',
      render: (item) => (
        <div className={styles.actions}>
          <Button size="sm" variant="ghost" onClick={() => handleViewDetail(item.id)}>
            {t('fieldteam:buttons.detail')}
          </Button>
          {item.status === 'planned' && (
            <Button size="sm" variant="primary" onClick={() => handleStartRoute(item.id)}>
              {t('fieldteam:buttons.start')}
            </Button>
          )}
          {item.status === 'in_progress' && (
            <Button size="sm" variant="primary" onClick={() => handleCompleteRoute(item.id)}>
              {t('fieldteam:buttons.complete')}
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => handleEdit(item)}>
            {t('fieldteam:buttons.edit')}
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(item.id)}>
            {t('fieldteam:buttons.delete')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>{t('fieldteam:pageTitle')}</h1>
        <Button onClick={handleAdd}>{t('fieldteam:newRoute')}</Button>
      </div>

      <Card className={styles.filters}>
        <div className={styles.filterRow}>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: t('fieldteam:filter.allStatuses') },
              { value: 'planned', label: t('fieldteam:status.planned') },
              { value: 'in_progress', label: t('fieldteam:status.in_progress') },
              { value: 'completed', label: t('fieldteam:status.completed') },
              { value: 'cancelled', label: t('fieldteam:status.cancelled') },
            ]}
          />
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          data={routes}
          keyExtractor={(item) => item.id}
          loading={loading}
          emptyMessage={t('fieldteam:empty')}
        />

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <Button
              size="sm"
              variant="secondary"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              {t('fieldteam:pagination.previous')}
            </Button>
            <span>
              {t('fieldteam:pagination.pageOf', { page, totalPages })}
            </span>
            <Button
              size="sm"
              variant="secondary"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              {t('fieldteam:pagination.next')}
            </Button>
          </div>
        )}
      </Card>

      {modalOpen && (
        <RouteFormModal
          route={selectedRoute}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
