import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Table, Button, Input, Badge, Pagination, type Column } from '@stok/ui';
import { adminTenantsApi, Tenant } from '../../api/admin/tenants.api';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import styles from './AdminPages.module.css';

const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
  active: 'success',
  trial: 'warning',
  suspended: 'danger',
  cancelled: 'default',
};

const statusLabels: Record<string, string> = {
  active: 'Aktif',
  trial: 'Deneme',
  suspended: 'Askida',
  cancelled: 'Iptal',
};

export function TenantsListPage() {
  const navigate = useNavigate();
  const { confirm } = useConfirmDialog();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadTenants();
  }, [page, statusFilter, search]);

  const loadTenants = async () => {
    try {
      setIsLoading(true);
      const response = await adminTenantsApi.getAll({
        page,
        limit: 20,
        status: statusFilter || undefined,
        search: search || undefined,
      });

      setTenants(response.data);
      setTotalPages(response.meta?.totalPages || 1);
    } catch (error) {
      console.error('Failed to load tenants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuspend = async (id: string) => {
    const confirmed = await confirm({ message: 'Bu organizasyonu askiya almak istediginize emin misiniz?', variant: 'danger' });
    if (!confirmed) return;

    try {
      await adminTenantsApi.suspend(id);
      loadTenants();
    } catch (error) {
      console.error('Failed to suspend tenant:', error);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await adminTenantsApi.activate(id);
      loadTenants();
    } catch (error) {
      console.error('Failed to activate tenant:', error);
    }
  };

  const columns: Column<Tenant>[] = [
    {
      key: 'name',
      header: 'Organizasyon',
      render: (tenant) => (
        <div>
          <Link to={`/admin/tenants/${tenant.id}`} className={styles.link}>
            {tenant.name}
          </Link>
          <div className={styles.subText}>{tenant.slug}</div>
        </div>
      ),
    },
    {
      key: 'plan',
      header: 'Plan',
      render: (tenant) => tenant.plan_name || '-',
    },
    {
      key: 'user_count',
      header: 'Kullanicilar',
      render: (tenant) => tenant.user_count || 0,
    },
    {
      key: 'status',
      header: 'Durum',
      render: (tenant) => (
        <Badge variant={statusColors[tenant.status] || 'default'}>
          {statusLabels[tenant.status] || tenant.status}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Kayit Tarihi',
      render: (tenant) => new Date(tenant.created_at).toLocaleDateString('tr-TR'),
    },
    {
      key: 'actions',
      header: '',
      render: (tenant) => (
        <div className={styles.actions}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/admin/tenants/${tenant.id}`)}
          >
            Detay
          </Button>
          {tenant.status === 'active' || tenant.status === 'trial' ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSuspend(tenant.id)}
            >
              Askiya Al
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleActivate(tenant.id)}
            >
              Aktif Et
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Organizasyonlar</h1>
        <Button variant="primary" onClick={() => navigate('/admin/tenants/new')}>
          Yeni Organizasyon
        </Button>
      </div>

      <Card className={styles.filters}>
        <div className={styles.filterRow}>
          <Input
            placeholder="Ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.select}
          >
            <option value="">Tum Durumlar</option>
            <option value="active">Aktif</option>
            <option value="trial">Deneme</option>
            <option value="suspended">Askida</option>
            <option value="cancelled">Iptal</option>
          </select>
        </div>
      </Card>

      <Card>
        <Table
          columns={columns}
          data={tenants}
          keyExtractor={(tenant) => tenant.id}
          loading={isLoading}
          emptyMessage="Organizasyon bulunamadi"
        />

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
