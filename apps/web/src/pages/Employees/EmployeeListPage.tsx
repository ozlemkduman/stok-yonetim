import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, Button, Input, Badge, Pagination, type Column } from '@stok/ui';
import { employeesApi, Employee, CreateEmployeeData } from '../../api/employees.api';
import { EmployeeFormModal } from './EmployeeFormModal';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './EmployeeListPage.module.css';

type StatusFilter = 'active' | 'inactive' | 'all';

export function EmployeeListPage() {
  const { t } = useTranslation(['employees', 'common']);
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();

  const [items, setItems] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('active');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      if (status !== 'all') params.isActive = status === 'active' ? 'true' : 'false';

      const res = await employeesApi.getAll(params);
      setItems(res.data);
      setTotal(res.meta?.total || 0);
      setTotalPages(res.meta?.totalPages || 1);
    } catch {
      showToast('error', t('employees:toast.loadError'));
    }
    setLoading(false);
  }, [page, search, status, showToast, t]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const handleCreate = () => {
    setEditing(null);
    setIsModalOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditing(employee);
    setIsModalOpen(true);
  };

  const handleDelete = async (employee: Employee) => {
    const confirmed = await confirm({
      message: t('employees:confirm.delete', { name: employee.name }),
      variant: 'danger',
    });
    if (!confirmed) return;
    try {
      await employeesApi.delete(employee.id);
      showToast('success', t('employees:toast.deleteSuccess'));
      fetchEmployees();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('employees:toast.deleteFailed'));
    }
  };

  const handleSubmit = async (data: CreateEmployeeData) => {
    if (editing) {
      await employeesApi.update(editing.id, data);
      showToast('success', t('employees:toast.updateSuccess'));
    } else {
      await employeesApi.create(data);
      showToast('success', t('employees:toast.createSuccess'));
    }
    fetchEmployees();
  };

  const columns: Column<Employee>[] = [
    {
      key: 'name',
      header: t('employees:columns.name'),
      render: (e) => <strong>{e.name}</strong>,
    },
    {
      key: 'position',
      header: t('employees:columns.position'),
      render: (e) => e.position || <span className={styles.muted}>-</span>,
    },
    {
      key: 'contact',
      header: t('employees:columns.contact'),
      render: (e) => e.phone || e.email || <span className={styles.muted}>-</span>,
    },
    {
      key: 'hire_date',
      header: t('employees:columns.hireDate'),
      render: (e) => (e.hire_date ? formatDate(e.hire_date) : <span className={styles.muted}>-</span>),
    },
    {
      key: 'commission_rate',
      header: t('employees:columns.commissionRate'),
      align: 'right',
      render: (e) => (Number(e.commission_rate) > 0 ? `%${Number(e.commission_rate)}` : <span className={styles.muted}>-</span>),
    },
    {
      key: 'salary',
      header: t('employees:columns.salary'),
      align: 'right',
      render: (e) => (e.salary != null ? formatCurrency(Number(e.salary)) : <span className={styles.muted}>-</span>),
    },
    {
      key: 'is_active',
      header: t('employees:columns.status'),
      render: (e) => (
        <Badge variant={e.is_active ? 'success' : 'default'}>
          {t(e.is_active ? 'employees:status.active' : 'employees:status.inactive')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '160px',
      render: (e) => (
        <div className={styles.actions} onClick={(ev) => ev.stopPropagation()}>
          <Button size="sm" variant="primary" onClick={() => handleEdit(e)}>
            {t('employees:buttons.edit')}
          </Button>
          {e.is_active && (
            <Button size="sm" variant="danger" onClick={() => handleDelete(e)}>
              {t('employees:buttons.delete')}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('employees:title')}</h1>
          <p className={styles.subtitle}>{t('employees:subtitle', { count: total })}</p>
        </div>
        <Button onClick={handleCreate}>{t('employees:newEmployee')}</Button>
      </div>

      <div className={styles.card}>
        <div className={styles.filters}>
          <Input
            placeholder={t('employees:searchPlaceholder')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <div className={styles.tabs}>
            {(['active', 'inactive', 'all'] as StatusFilter[]).map((s) => (
              <button
                key={s}
                className={`${styles.tab} ${status === s ? styles.tabActive : ''}`}
                onClick={() => { setStatus(s); setPage(1); }}
              >
                {t(`employees:filters.${s}`)}
              </button>
            ))}
          </div>
        </div>

        <Table
          columns={columns}
          data={items}
          keyExtractor={(e) => e.id}
          loading={loading}
          emptyMessage={t('employees:empty')}
          onRowClick={handleEdit}
        />

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      <EmployeeFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        employee={editing}
      />
    </div>
  );
}
