import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Table, Button, Input, Badge, Pagination, type Column } from '@stok/ui';
import { useCustomers } from '../../hooks/useCustomers';
import { Customer, CreateCustomerData } from '../../api/customers.api';
import { CustomerFormModal } from './CustomerFormModal';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { useTenant } from '../../context/TenantContext';
import { UpgradePrompt } from '../../components/UpgradePrompt';
import { formatCurrency } from '../../utils/formatters';
import styles from './CustomerListPage.module.css';

const icons = {
  customers: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
};

export function CustomerListPage() {
  const { t } = useTranslation(['customers', 'common']);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchInput, setSearchInput] = useState('');

  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();
  const { isWithinLimit } = useTenant();
  const canAddCustomer = isWithinLimit('customers');
  const {
    customers,
    loading,
    error,
    page,
    totalPages,
    total,
    setPage,
    setSearch,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  } = useCustomers();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleCreate = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleRowClick = (customer: Customer) => {
    navigate(`/customers/${customer.id}`);
  };

  const handleDelete = async (customer: Customer) => {
    const confirmed = await confirm({ message: t('customers:confirm.deleteMessage', { name: customer.name }), variant: 'danger' });
    if (!confirmed) {
      return;
    }

    try {
      await deleteCustomer(customer.id);
      showToast('success', t('customers:toast.deleteSuccess'));
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('customers:toast.deleteFailed'));
    }
  };

  const handleSubmit = async (data: CreateCustomerData) => {
    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, data);
      showToast('success', t('customers:toast.updateSuccess'));
    } else {
      await createCustomer(data);
      showToast('success', t('customers:toast.createSuccess'));
    }
  };

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      header: t('customers:columns.customerName'),
      render: (customer) => (
        <div className={styles.customerName}>
          <span className={styles.name}>{customer.name}</span>
          {customer.phone && <span className={styles.phone}>{customer.phone}</span>}
        </div>
      ),
    },
    {
      key: 'email',
      header: t('customers:columns.email'),
      render: (customer) => customer.email || '-',
    },
    {
      key: 'balance',
      header: t('customers:columns.balance'),
      align: 'right',
      render: (customer) => (
        <span
          className={
            customer.balance < 0
              ? styles.negative
              : customer.balance > 0
              ? styles.positive
              : ''
          }
        >
          {formatCurrency(customer.balance)}
        </span>
      ),
    },
    {
      key: 'is_active',
      header: t('customers:columns.status'),
      render: (customer) => (
        <Badge variant={customer.is_active ? 'success' : 'default'}>
          {customer.is_active ? t('customers:status.active') : t('customers:status.inactive')}
        </Badge>
      ),
    },
    {
      key: 'created_by_name',
      header: t('customers:columns.createdBy'),
      render: (customer) => customer.created_by_name || '-',
    },
    {
      key: 'actions',
      header: '',
      width: '180px',
      render: (customer) => (
        <div className={styles.actions}>
          <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); handleRowClick(customer); }}>
            {t('customers:actions.detail')}
          </Button>
          <Button size="sm" variant="primary" onClick={(e) => { e.stopPropagation(); handleEdit(customer); }}>
            {t('customers:actions.edit')}
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={(e) => { e.stopPropagation(); handleDelete(customer); }}
          >
            {t('customers:actions.delete')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>{icons.customers}</span>
            {t('customers:title')}
          </h1>
          <p className={styles.subtitle}>{t('customers:subtitle', { count: total })}</p>
        </div>
        {canAddCustomer && <Button onClick={handleCreate}>{t('customers:addNew')}</Button>}
      </div>

      {!canAddCustomer && (
        <UpgradePrompt variant="inline" message={t('customers:upgradePrompt')} />
      )}

      <div className={styles.card}>
        <div className={styles.toolbar}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <Input
              placeholder={t('customers:searchPlaceholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Button type="submit" variant="secondary">
              {t('common:buttons.search')}
            </Button>
          </form>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <Table
          columns={columns}
          data={customers}
          keyExtractor={(customer) => customer.id}
          loading={loading}
          emptyMessage={t('customers:emptyMessage')}
          onRowClick={handleRowClick}
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
      </div>

      <CustomerFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        customer={editingCustomer}
      />
    </div>
  );
}
