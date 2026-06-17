import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, Button, Input, Badge, Pagination, type Column } from '@stok/ui';
import { productsApi, Product, CreateProductData } from '../../api/products.api';
import { ProductFormModal } from '../Products/ProductFormModal';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { formatCurrency } from '../../utils/formatters';
import { productCategoryLabel } from '../../utils/constants';
import styles from './AutoService.module.css';

/**
 * Oto Servis "Ürünler" sekmesi — global ürün modülünü (productsApi +
 * ProductFormModal) oto servis ekranı içinde yeniden kullanır. Eklenen ürünler
 * iş emri parça kalemlerinde seçilebilir hale gelir.
 */
export function ProductsTab() {
  const { t } = useTranslation('autoService');
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();

  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      const res = await productsApi.getAll(params);
      setItems(res.data);
      setTotal(res.meta?.total || 0);
      setTotalPages(res.meta?.totalPages || 1);
    } catch {
      showToast('error', t('productsTab.toast.loadError'));
    }
    setLoading(false);
  }, [page, search, showToast, t]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleCreate = () => { setEditing(null); setIsModalOpen(true); };
  const handleEdit = (p: Product) => { setEditing(p); setIsModalOpen(true); };

  const handleDelete = async (p: Product) => {
    const confirmed = await confirm({ message: t('productsTab.confirm.delete', { name: p.name }), variant: 'danger' });
    if (!confirmed) return;
    try {
      await productsApi.delete(p.id);
      showToast('success', t('productsTab.toast.deleteSuccess'));
      fetchItems();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('productsTab.toast.deleteFailed'));
    }
  };

  const handleSubmit = async (data: CreateProductData) => {
    try {
      if (editing) {
        await productsApi.update(editing.id, data);
        showToast('success', t('productsTab.toast.updateSuccess'));
      } else {
        await productsApi.create(data);
        showToast('success', t('productsTab.toast.createSuccess'));
      }
      fetchItems();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('productsTab.toast.saveFailed'));
      throw err;
    }
  };

  const columns: Column<Product>[] = [
    {
      key: 'name', header: t('productsTab.columns.name'),
      render: (p) => (
        <div>
          <strong>{p.name}</strong>
          {p.barcode && <span className={styles.muted} style={{ display: 'block', fontSize: 'var(--font-size-xs)' }}>{p.barcode}</span>}
        </div>
      ),
    },
    { key: 'category', header: t('productsTab.columns.category'), render: (p) => productCategoryLabel(p.category) },
    {
      key: 'stock_quantity', header: t('productsTab.columns.stock'), align: 'right',
      render: (p) => (
        <Badge variant={Number(p.stock_quantity) <= Number(p.min_stock_level) ? 'danger' : 'success'}>
          {parseFloat(String(p.stock_quantity))} {p.unit}
        </Badge>
      ),
    },
    {
      key: 'sale_price', header: t('productsTab.columns.salePrice'), align: 'right',
      render: (p) => formatCurrency(Number(p.sale_price) * (1 + Number(p.vat_rate) / 100)),
    },
    {
      key: 'actions', header: '', width: '160px',
      render: (p) => (
        <div className={styles.actions} onClick={(ev) => ev.stopPropagation()}>
          <Button size="sm" variant="primary" onClick={() => handleEdit(p)}>{t('productsTab.buttons.edit')}</Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(p)}>{t('productsTab.buttons.delete')}</Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className={styles.header} style={{ marginBottom: 'var(--space-3)' }}>
        <p className={styles.subtitle}>{t('productsTab.subtitle', { count: total })}</p>
        <Button onClick={handleCreate}>{t('productsTab.newProduct')}</Button>
      </div>

      <div className={styles.filters}>
        <Input
          placeholder={t('productsTab.searchPlaceholder')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <Table
        columns={columns}
        data={items}
        keyExtractor={(p) => p.id}
        loading={loading}
        emptyMessage={t('productsTab.empty')}
        onRowClick={handleEdit}
      />

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        product={editing}
      />
    </div>
  );
}
