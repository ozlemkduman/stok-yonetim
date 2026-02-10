import { useState, useEffect } from 'react';
import { Table, Button, Card, Select, type Column } from '@stok/ui';
import { fieldTeamApi, FieldRoute } from '../../api/field-team.api';
import { RouteFormModal } from './RouteFormModal';
import styles from './RouteListPage.module.css';

const statusLabels: Record<string, string> = {
  planned: 'Planli',
  in_progress: 'Devam Ediyor',
  completed: 'Tamamlandi',
  cancelled: 'Iptal',
};

export function RouteListPage() {
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
      console.error('Rotalar yuklenemedi:', error);
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
    if (!confirm('Bu rotayi silmek istediginize emin misiniz?')) return;
    try {
      await fieldTeamApi.deleteRoute(id);
      fetchRoutes();
    } catch (error) {
      console.error('Silme hatasi:', error);
    }
  };

  const handleStartRoute = async (id: string) => {
    try {
      await fieldTeamApi.startRoute(id);
      fetchRoutes();
    } catch (error) {
      console.error('Baslat hatasi:', error);
    }
  };

  const handleCompleteRoute = async (id: string) => {
    try {
      await fieldTeamApi.completeRoute(id);
      fetchRoutes();
    } catch (error) {
      console.error('Tamamla hatasi:', error);
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

  const columns: Column<FieldRoute>[] = [
    { key: 'name', header: 'Rota Adi', width: '20%' },
    {
      key: 'route_date',
      header: 'Tarih',
      width: '12%',
      render: (item) => new Date(item.route_date).toLocaleDateString('tr-TR'),
    },
    {
      key: 'status',
      header: 'Durum',
      width: '12%',
      render: (item) => (
        <span className={`${styles.badge} ${styles[`badge_${item.status}`]}`}>
          {statusLabels[item.status]}
        </span>
      ),
    },
    {
      key: 'visit_count',
      header: 'Ziyaret',
      width: '10%',
      render: (item) => `${item.completed_count || 0}/${item.visit_count || 0}`,
    },
    {
      key: 'estimated_duration_minutes',
      header: 'Tahmini Sure',
      width: '12%',
      render: (item) =>
        item.estimated_duration_minutes
          ? `${Math.floor(item.estimated_duration_minutes / 60)}s ${item.estimated_duration_minutes % 60}dk`
          : '-',
    },
    {
      key: 'actions',
      header: 'Islemler',
      width: '34%',
      render: (item) => (
        <div className={styles.actions}>
          {item.status === 'planned' && (
            <Button size="sm" variant="primary" onClick={() => handleStartRoute(item.id)}>
              Baslat
            </Button>
          )}
          {item.status === 'in_progress' && (
            <Button size="sm" variant="primary" onClick={() => handleCompleteRoute(item.id)}>
              Tamamla
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => handleEdit(item)}>
            Duzenle
          </Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(item.id)}>
            Sil
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Saha Ekip - Rotalar</h1>
        <Button onClick={handleAdd}>Yeni Rota</Button>
      </div>

      <Card className={styles.filters}>
        <div className={styles.filterRow}>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'Tum Durumlar' },
              { value: 'planned', label: 'Planli' },
              { value: 'in_progress', label: 'Devam Ediyor' },
              { value: 'completed', label: 'Tamamlandi' },
              { value: 'cancelled', label: 'Iptal' },
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
          emptyMessage="Rota bulunamadi"
        />

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <Button
              size="sm"
              variant="secondary"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Onceki
            </Button>
            <span>
              Sayfa {page} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="secondary"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Sonraki
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
