import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, Button, Input, Badge, Modal, Select, Pagination, type Column } from '@stok/ui';
import { expensesApi, Expense, CreateExpenseData } from '../../api/expenses.api';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
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
  const { t } = useTranslation(['expenses', 'common']);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<CreateExpenseData>({
    category: 'diger',
    amount: 0,
    expense_date: new Date().toISOString().split('T')[0]
  });
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();

  const EXPENSE_CATEGORY_KEYS = ['kira', 'vergi', 'maas', 'fatura', 'diger'] as const;

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (categoryFilter) params.category = categoryFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const response = await expensesApi.getAll(params);
      setExpenses(response.data);
      setTotalPages(response.meta?.totalPages || 1);
      setTotal(response.meta?.total || 0);
    } catch {
      showToast('error', t('expenses:toast.loadError'));
    }
    setLoading(false);
  };

  useEffect(() => { fetchExpenses(); }, [page, categoryFilter, startDate, endDate]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoryFilter(e.target.value);
    setPage(1);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartDate(e.target.value);
    setPage(1);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndDate(e.target.value);
    setPage(1);
  };

  const handleSubmit = async () => {
    try {
      if (editingExpense) {
        await expensesApi.update(editingExpense.id, formData);
        showToast('success', t('expenses:toast.updateSuccess'));
      } else {
        await expensesApi.create(formData);
        showToast('success', t('expenses:toast.createSuccess'));
      }
      setIsModalOpen(false);
      fetchExpenses();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('expenses:toast.error'));
    }
  };

  const handleDelete = async (expense: Expense) => {
    const confirmed = await confirm({ message: t('expenses:confirm.deleteMessage'), variant: 'danger' });
    if (!confirmed) return;
    try {
      await expensesApi.delete(expense.id);
      showToast('success', t('expenses:toast.deleteSuccess'));
      fetchExpenses();
    } catch {
      showToast('error', t('expenses:toast.deleteError'));
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
      header: t('expenses:columns.category'),
      render: (e) => (
        <Badge>{t(`common:expenseCategories.${e.category}`, { defaultValue: e.category })}</Badge>
      )
    },
    { key: 'description', header: t('expenses:columns.description'), render: (e) => e.description || '-' },
    {
      key: 'amount',
      header: t('expenses:columns.amount'),
      align: 'right',
      render: (e) => <strong>{formatCurrency(e.amount)}</strong>
    },
    { key: 'expense_date', header: t('expenses:columns.date'), render: (e) => formatDate(e.expense_date) },
    {
      key: 'is_recurring',
      header: t('expenses:columns.recurring'),
      render: (e) => e.is_recurring ? <Badge variant="info">{e.recurrence_period}</Badge> : '-'
    },
    { key: 'created_by_name', header: t('expenses:columns.createdBy'), render: (e) => e.created_by_name || '-' },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (e) => (
        <div className={styles.actions}>
          <Button size="sm" variant="primary" onClick={() => openModal(e)}>{t('expenses:actions.edit')}</Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(e)}>{t('expenses:actions.delete')}</Button>
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
            {t('expenses:title')}
          </h1>
          <p className={styles.subtitle}>{t('expenses:subtitle', { total })}</p>
        </div>
        <Button onClick={() => openModal()}>{t('expenses:newExpense')}</Button>
      </div>

      <div className={styles.card}>
        <div className={styles.toolbar}>
          <Select
            options={[
              { value: '', label: t('expenses:filters.allCategories') },
              ...EXPENSE_CATEGORY_KEYS.map(key => ({ value: key, label: t(`common:expenseCategories.${key}`) })),
            ]}
            value={categoryFilter}
            onChange={handleCategoryChange}
          />
          <div className={styles.dateFilters}>
            <Input type="date" value={startDate} onChange={handleStartDateChange} placeholder={t('expenses:filters.startDate')} />
            <Input type="date" value={endDate} onChange={handleEndDateChange} placeholder={t('expenses:filters.endDate')} />
          </div>
        </div>
        <Table
          columns={columns}
          data={expenses}
          keyExtractor={(e) => e.id}
          loading={loading}
          emptyMessage={t('expenses:emptyMessage')}
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
        title={editingExpense ? t('expenses:modal.editTitle') : t('expenses:modal.createTitle')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>{t('expenses:modal.cancel')}</Button>
            <Button onClick={handleSubmit}>{editingExpense ? t('expenses:modal.update') : t('expenses:modal.save')}</Button>
          </>
        }
      >
        <div className={styles.form}>
          <Select
            label={t('expenses:modal.category')}
            options={EXPENSE_CATEGORY_KEYS.map(key => ({ value: key, label: t(`common:expenseCategories.${key}`) }))}
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            fullWidth
          />
          <Input
            label={t('expenses:modal.amount')}
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            fullWidth
          />
          <Input
            label={t('expenses:modal.date')}
            type="date"
            value={formData.expense_date}
            onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
            fullWidth
          />
          <Input
            label={t('expenses:modal.description')}
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            fullWidth
          />
        </div>
      </Modal>
    </div>
  );
}
