import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Input, Badge, Pagination, type Column } from '@stok/ui';
import { useCustomers } from '../../hooks/useCustomers';
import { Customer, CreateCustomerData } from '../../api/customers.api';
import { CustomerFormModal } from './CustomerFormModal';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
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
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchInput, setSearchInput] = useState('');

  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();
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
    const confirmed = await confirm({ message: `"${customer.name}" müşterisini silmek istediğinizden emin misiniz?`, variant: 'danger' });
    if (!confirmed) {
      return;
    }

    try {
      await deleteCustomer(customer.id);
      showToast('success', 'Müşteri başarıyla silindi');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Silme işlemi başarısız');
    }
  };

  const handleSubmit = async (data: CreateCustomerData) => {
    if (editingCustomer) {
      await updateCustomer(editingCustomer.id, data);
      showToast('success', 'Müşteri başarıyla güncellendi');
    } else {
      await createCustomer(data);
      showToast('success', 'Müşteri başarıyla eklendi');
    }
  };

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      header: 'Müşteri Adı',
      render: (customer) => (
        <div className={styles.customerName}>
          <span className={styles.name}>{customer.name}</span>
          {customer.phone && <span className={styles.phone}>{customer.phone}</span>}
        </div>
      ),
    },
    {
      key: 'email',
      header: 'E-posta',
      render: (customer) => customer.email || '-',
    },
    {
      key: 'balance',
      header: 'Bakiye',
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
      header: 'Durum',
      render: (customer) => (
        <Badge variant={customer.is_active ? 'success' : 'default'}>
          {customer.is_active ? 'Aktif' : 'Pasif'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '180px',
      render: (customer) => (
        <div className={styles.actions}>
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleRowClick(customer); }}>
            Detay
          </Button>
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleEdit(customer); }}>
            Düzenle
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => { e.stopPropagation(); handleDelete(customer); }}
          >
            Sil
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
            Müşteriler
          </h1>
          <p className={styles.subtitle}>Toplam {total} müşteri kaydı</p>
        </div>
        <Button onClick={handleCreate}>+ Yeni Müşteri</Button>
      </div>

      <div className={styles.card}>
        <div className={styles.toolbar}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <Input
              placeholder="Müşteri ara..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Button type="submit" variant="secondary">
              Ara
            </Button>
          </form>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <Table
          columns={columns}
          data={customers}
          keyExtractor={(customer) => customer.id}
          loading={loading}
          emptyMessage="Müşteri bulunamadı"
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
