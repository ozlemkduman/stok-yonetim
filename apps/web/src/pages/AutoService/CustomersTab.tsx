import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, Button, Input, Pagination, type Column } from '@stok/ui';
import { customersApi, Customer, CreateCustomerData } from '../../api/customers.api';
import { CustomerFormModal } from '../Customers/CustomerFormModal';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { formatCurrency } from '../../utils/formatters';
import styles from './AutoService.module.css';

/**
 * Oto Servis "Müşteriler" sekmesi — global müşteri modülünü (customersApi +
 * CustomerFormModal) oto servis ekranı içinde yeniden kullanır.
 */
export function CustomersTab() {
  const { t } = useTranslation('autoService');
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();

  const [items, setItems] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params: { page: number; limit: number; search?: string } = { page, limit: 20 };
      if (search) params.search = search;
      const res = await customersApi.getAll(params);
      setItems(res.data);
      setTotal(res.meta?.total || 0);
      setTotalPages(res.meta?.totalPages || 1);
    } catch {
      showToast('error', t('customersTab.toast.loadError'));
    }
    setLoading(false);
  }, [page, search, showToast, t]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleCreate = () => { setEditing(null); setIsModalOpen(true); };
  const handleEdit = (c: Customer) => { setEditing(c); setIsModalOpen(true); };

  const handleDelete = async (c: Customer) => {
    const confirmed = await confirm({ message: t('customersTab.confirm.delete', { name: c.name }), variant: 'danger' });
    if (!confirmed) return;
    try {
      await customersApi.delete(c.id);
      showToast('success', t('customersTab.toast.deleteSuccess'));
      fetchItems();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('customersTab.toast.deleteFailed'));
    }
  };

  const handleSubmit = async (data: CreateCustomerData) => {
    if (editing) {
      await customersApi.update(editing.id, data);
      showToast('success', t('customersTab.toast.updateSuccess'));
    } else {
      await customersApi.create(data);
      showToast('success', t('customersTab.toast.createSuccess'));
    }
    fetchItems();
  };

  const columns: Column<Customer>[] = [
    { key: 'name', header: t('customersTab.columns.name'), render: (c) => <strong>{c.name}</strong> },
    { key: 'phone', header: t('customersTab.columns.phone'), render: (c) => c.phone || <span className={styles.muted}>-</span> },
    { key: 'email', header: t('customersTab.columns.email'), render: (c) => c.email || <span className={styles.muted}>-</span> },
    {
      key: 'balance', header: t('customersTab.columns.balance'), align: 'right',
      render: (c) => <span>{formatCurrency(Number(c.balance) || 0)}</span>,
    },
    {
      key: 'actions', header: '', width: '160px',
      render: (c) => (
        <div className={styles.actions} onClick={(ev) => ev.stopPropagation()}>
          <Button size="sm" variant="primary" onClick={() => handleEdit(c)}>{t('customersTab.buttons.edit')}</Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(c)}>{t('customersTab.buttons.delete')}</Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className={styles.header} style={{ marginBottom: 'var(--space-3)' }}>
        <p className={styles.subtitle}>{t('customersTab.subtitle', { count: total })}</p>
        <Button onClick={handleCreate}>{t('customersTab.newCustomer')}</Button>
      </div>

      <div className={styles.filters}>
        <Input
          placeholder={t('customersTab.searchPlaceholder')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <Table
        columns={columns}
        data={items}
        keyExtractor={(c) => c.id}
        loading={loading}
        emptyMessage={t('customersTab.empty')}
        onRowClick={handleEdit}
      />

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <CustomerFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        customer={editing}
      />
    </div>
  );
}
