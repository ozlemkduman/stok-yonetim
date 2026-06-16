import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, Button, Input, Pagination, type Column } from '@stok/ui';
import { employeesApi, Employee, CreateEmployeeData } from '../../api/employees.api';
import { EmployeeFormModal } from '../Employees/EmployeeFormModal';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import styles from './AutoService.module.css';

/**
 * Oto Servis "Personel" sekmesi — global personel modülünü (employeesApi +
 * EmployeeFormModal) oto servis ekranı içinde yeniden kullanır.
 */
export function EmployeesTab() {
  const { t } = useTranslation('autoService');
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();

  const [items, setItems] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20, isActive: 'true' };
      if (search) params.search = search;
      const res = await employeesApi.getAll(params);
      setItems(res.data);
      setTotal(res.meta?.total || 0);
      setTotalPages(res.meta?.totalPages || 1);
    } catch {
      showToast('error', t('employeesTab.toast.loadError'));
    }
    setLoading(false);
  }, [page, search, showToast, t]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleCreate = () => { setEditing(null); setIsModalOpen(true); };
  const handleEdit = (e: Employee) => { setEditing(e); setIsModalOpen(true); };

  const handleDelete = async (emp: Employee) => {
    const confirmed = await confirm({ message: t('employeesTab.confirm.delete', { name: emp.name }), variant: 'danger' });
    if (!confirmed) return;
    try {
      await employeesApi.delete(emp.id);
      showToast('success', t('employeesTab.toast.deleteSuccess'));
      fetchItems();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('employeesTab.toast.deleteFailed'));
    }
  };

  const handleSubmit = async (data: CreateEmployeeData) => {
    if (editing) {
      await employeesApi.update(editing.id, data);
      showToast('success', t('employeesTab.toast.updateSuccess'));
    } else {
      await employeesApi.create(data);
      showToast('success', t('employeesTab.toast.createSuccess'));
    }
    fetchItems();
  };

  const columns: Column<Employee>[] = [
    { key: 'name', header: t('employeesTab.columns.name'), render: (e) => <strong>{e.name}</strong> },
    { key: 'position', header: t('employeesTab.columns.position'), render: (e) => e.position || <span className={styles.muted}>-</span> },
    { key: 'phone', header: t('employeesTab.columns.phone'), render: (e) => e.phone || <span className={styles.muted}>-</span> },
    {
      key: 'hire_date', header: t('employeesTab.columns.hireDate'),
      render: (e) => (e.hire_date ? new Date(e.hire_date).toLocaleDateString() : <span className={styles.muted}>-</span>),
    },
    {
      key: 'actions', header: '', width: '160px',
      render: (e) => (
        <div className={styles.actions} onClick={(ev) => ev.stopPropagation()}>
          <Button size="sm" variant="primary" onClick={() => handleEdit(e)}>{t('employeesTab.buttons.edit')}</Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(e)}>{t('employeesTab.buttons.delete')}</Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className={styles.header} style={{ marginBottom: 'var(--space-3)' }}>
        <p className={styles.subtitle}>{t('employeesTab.subtitle', { count: total })}</p>
        <Button onClick={handleCreate}>{t('employeesTab.newEmployee')}</Button>
      </div>

      <div className={styles.filters}>
        <Input
          placeholder={t('employeesTab.searchPlaceholder')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <Table
        columns={columns}
        data={items}
        keyExtractor={(e) => e.id}
        loading={loading}
        emptyMessage={t('employeesTab.empty')}
        onRowClick={handleEdit}
      />

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <EmployeeFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        employee={editing}
      />
    </div>
  );
}
