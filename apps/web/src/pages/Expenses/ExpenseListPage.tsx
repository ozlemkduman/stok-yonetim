import { useState, useEffect } from 'react';
import { Table, Button, Input, Badge, Modal, Select, Pagination, type Column } from '@stok/ui';
import { expensesApi, Expense, CreateExpenseData } from '../../api/expenses.api';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { EXPENSE_CATEGORIES } from '../../utils/constants';
import styles from './ExpenseListPage.module.css';

const icons = {
  expenses: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
};

export function ExpenseListPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<CreateExpenseData>({
    category: 'diger',
    amount: 0,
    expense_date: new Date().toISOString().split('T')[0]
  });
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const response = await expensesApi.getAll({ page, limit: 20 });
      setExpenses(response.data);
      setTotalPages(response.meta?.totalPages || 1);
      setTotal(response.meta?.total || 0);
    } catch {
      showToast('error', 'Giderler yüklenemedi');
    }
    setLoading(false);
  };

  useEffect(() => { fetchExpenses(); }, [page]);

  const handleSubmit = async () => {
    try {
      if (editingExpense) {
        await expensesApi.update(editingExpense.id, formData);
        showToast('success', 'Gider güncellendi');
      } else {
        await expensesApi.create(formData);
        showToast('success', 'Gider eklendi');
      }
      setIsModalOpen(false);
      fetchExpenses();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Hata');
    }
  };

  const handleDelete = async (expense: Expense) => {
    const confirmed = await confirm({ message: 'Bu gideri silmek istediğinizden emin misiniz?', variant: 'danger' });
    if (!confirmed) return;
    try {
      await expensesApi.delete(expense.id);
      showToast('success', 'Gider silindi');
      fetchExpenses();
    } catch {
      showToast('error', 'Silme başarısız');
    }
  };

  const openModal = (expense?: Expense) => {
    setEditingExpense(expense || null);
    setFormData(expense ? {
      category: expense.category,
      description: expense.description || '',
      amount: expense.amount,
      expense_date: expense.expense_date.split('T')[0],
      is_recurring: expense.is_recurring,
      recurrence_period: expense.recurrence_period || undefined
    } : {
      category: 'diger',
      amount: 0,
      expense_date: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const columns: Column<Expense>[] = [
    {
      key: 'category',
      header: 'Kategori',
      render: (e) => (
        <Badge>{EXPENSE_CATEGORIES[e.category as keyof typeof EXPENSE_CATEGORIES] || e.category}</Badge>
      )
    },
    { key: 'description', header: 'Açıklama', render: (e) => e.description || '-' },
    {
      key: 'amount',
      header: 'Tutar',
      align: 'right',
      render: (e) => <strong>{formatCurrency(e.amount)}</strong>
    },
    { key: 'expense_date', header: 'Tarih', render: (e) => formatDate(e.expense_date) },
    {
      key: 'is_recurring',
      header: 'Tekrar',
      render: (e) => e.is_recurring ? <Badge variant="info">{e.recurrence_period}</Badge> : '-'
    },
    { key: 'created_by_name', header: 'Kaydeden', render: (e) => e.created_by_name || '-' },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (e) => (
        <div className={styles.actions}>
          <Button size="sm" variant="primary" onClick={() => openModal(e)}>Düzenle</Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(e)}>Sil</Button>
        </div>
      )
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>{icons.expenses}</span>
            Giderler
          </h1>
          <p className={styles.subtitle}>Toplam {total} gider kaydı</p>
        </div>
        <Button onClick={() => openModal()}>+ Yeni Gider</Button>
      </div>

      <div className={styles.card}>
        <Table
          columns={columns}
          data={expenses}
          keyExtractor={(e) => e.id}
          loading={loading}
          emptyMessage="Gider bulunamadı"
        />
        {totalPages > 1 && (
          <div className={styles.pagination}>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExpense ? 'Gider Düzenle' : 'Yeni Gider'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>İptal</Button>
            <Button onClick={handleSubmit}>{editingExpense ? 'Güncelle' : 'Kaydet'}</Button>
          </>
        }
      >
        <div className={styles.form}>
          <Select
            label="Kategori *"
            options={Object.entries(EXPENSE_CATEGORIES).map(([v, l]) => ({ value: v, label: l }))}
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            fullWidth
          />
          <Input
            label="Tutar *"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            fullWidth
          />
          <Input
            label="Tarih *"
            type="date"
            value={formData.expense_date}
            onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
            fullWidth
          />
          <Input
            label="Açıklama"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            fullWidth
          />
        </div>
      </Modal>
    </div>
  );
}
