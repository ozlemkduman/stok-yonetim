import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, Button, Input, Modal, Pagination, type Column } from '@stok/ui';
import { suppliersApi, Supplier, CreateSupplierData } from '../../api/suppliers.api';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { formatCurrency } from '../../utils/formatters';
import styles from './SupplierListPage.module.css';

export function SupplierListPage() {
  const { t } = useTranslation(['suppliers', 'common']);
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<CreateSupplierData>({ name: '' });
  const [saving, setSaving] = useState(false);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      const res = await suppliersApi.getAll(params);
      setSuppliers(res.data);
      setTotalPages(res.meta?.totalPages || 1);
      setTotal(res.meta?.total || 0);
    } catch (err) {
      showToast('error', t('suppliers:toast.loadError'));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSuppliers();
  }, [page, search]);

  const openCreate = () => {
    setEditing(null);
    setFormData({ name: '' });
    setModalOpen(true);
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setFormData({
      name: s.name,
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || '',
      tax_number: s.tax_number || '',
      tax_office: s.tax_office || '',
      notes: s.notes || '',
      is_active: s.is_active,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showToast('error', t('suppliers:validation.nameRequired'));
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await suppliersApi.update(editing.id, formData);
        showToast('success', t('suppliers:toast.updated'));
      } else {
        await suppliersApi.create(formData);
        showToast('success', t('suppliers:toast.created'));
      }
      setModalOpen(false);
      fetchSuppliers();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('suppliers:toast.saveError'));
    }
    setSaving(false);
  };

  const handleDelete = async (s: Supplier) => {
    const confirmed = await confirm({ message: t('suppliers:confirm.delete', { name: s.name }), variant: 'danger' });
    if (!confirmed) return;
    try {
      await suppliersApi.delete(s.id);
      showToast('success', t('suppliers:toast.deleted'));
      fetchSuppliers();
    } catch (err) {
      showToast('error', t('suppliers:toast.deleteError'));
    }
  };

  const columns: Column<Supplier>[] = [
    { key: 'name', header: t('suppliers:columns.name'), render: (s) => <strong>{s.name}</strong> },
    { key: 'phone', header: t('suppliers:columns.phone'), render: (s) => s.phone || '-' },
    { key: 'tax_number', header: t('suppliers:columns.taxNumber'), render: (s) => s.tax_number || '-' },
    {
      key: 'balance',
      header: t('suppliers:columns.balance'),
      align: 'right',
      render: (s) => {
        const b = Number(s.balance) || 0;
        const cls = b < 0 ? styles.danger : b > 0 ? styles.success : '';
        return <span className={cls}>{formatCurrency(Math.abs(b))} {b < 0 ? t('suppliers:debtSuffix') : b > 0 ? t('suppliers:creditSuffix') : ''}</span>;
      },
    },
    {
      key: 'actions',
      header: '',
      width: '180px',
      render: (s) => (
        <div className={styles.actions}>
          <Button size="sm" variant="secondary" onClick={() => openEdit(s)}>{t('common:buttons.edit')}</Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(s)}>{t('common:buttons.delete')}</Button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{t('suppliers:pageTitle')}</h1>
          <p className={styles.subtitle}>{t('suppliers:subtitle', { count: total })}</p>
        </div>
        <Button onClick={openCreate}>{t('suppliers:newSupplier')}</Button>
      </div>

      <div className={styles.card}>
        <Input placeholder={t('suppliers:searchPlaceholder')} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <div className={styles.card}>
        <Table columns={columns} data={suppliers} keyExtractor={(s) => s.id} loading={loading} emptyMessage={t('suppliers:empty')} />
        {totalPages > 1 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('suppliers:editTitle') : t('suppliers:newTitle')} size="md">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label={t('suppliers:form.name')} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} fullWidth />
          <Input label={t('suppliers:form.phone')} value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} fullWidth />
          <Input label={t('suppliers:form.email')} type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} fullWidth />
          <Input label={t('suppliers:form.taxNumber')} value={formData.tax_number || ''} onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })} fullWidth />
          <Input label={t('suppliers:form.taxOffice')} value={formData.tax_office || ''} onChange={(e) => setFormData({ ...formData, tax_office: e.target.value })} fullWidth />
          <Input label={t('suppliers:form.address')} value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} fullWidth />
          <Input label={t('suppliers:form.notes')} value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} fullWidth />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>{t('common:buttons.cancel')}</Button>
            <Button variant="primary" onClick={handleSubmit} disabled={saving}>{saving ? t('common:labels.saving') : t('common:buttons.save')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
