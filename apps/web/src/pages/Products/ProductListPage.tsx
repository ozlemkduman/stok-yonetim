import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Table, Button, Input, Badge, Pagination, type Column } from '@stok/ui';
import { productsApi, Product, CreateProductData } from '../../api/products.api';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { useTenant } from '../../context/TenantContext';
import { UpgradePrompt } from '../../components/UpgradePrompt';
import { formatCurrency } from '../../utils/formatters';
import { productCategoryLabel } from '../../utils/constants';
import { ProductFormModal } from './ProductFormModal';
import styles from './ProductListPage.module.css';

const icons = {
  products: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
};

export function ProductListPage() {
  const { t } = useTranslation(['products', 'common']);
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('total_sold');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();
  const { isWithinLimit } = useTenant();
  const canAddProduct = isWithinLimit('products');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20, search, sortBy, sortOrder };
      if (categoryFilter) params.category = categoryFilter;
      const response = await productsApi.getAll(params);
      setProducts(response.data);
      setTotalPages(response.meta?.totalPages || 1);
      setTotal(response.meta?.total || 0);
    } catch (err) {
      showToast('error', t('products:toast.loadError'));
    }
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [page, search, categoryFilter, sortBy, sortOrder]);

  useEffect(() => {
    productsApi.getCategories().then(res => {
      setCategories(res.data || []);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (data: CreateProductData) => {
    try {
      if (editingProduct) {
        await productsApi.update(editingProduct.id, data);
        showToast('success', t('products:toast.updateSuccess'));
      } else {
        await productsApi.create(data);
        showToast('success', t('products:toast.createSuccess'));
      }
      fetchProducts();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('products:toast.genericError'));
      throw err;
    }
  };

  const handleDelete = async (product: Product) => {
    const confirmed = await confirm({ message: t('products:toast.deleteConfirm', { name: product.name }), variant: 'danger' });
    if (!confirmed) return;
    try {
      await productsApi.delete(product.id);
      showToast('success', t('products:toast.deleteSuccess'));
      fetchProducts();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('products:toast.deleteFailed'));
    }
  };

  const openModal = (product?: Product) => {
    setEditingProduct(product || null);
    setIsModalOpen(true);
  };

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: t('products:columns.productName'),
      render: (p) => (
        <div className={styles.productName}>
          <span className={styles.name} onClick={() => navigate(`/products/${p.id}`)} style={{ cursor: 'pointer' }}>{p.name}</span>
          {p.barcode && <span className={styles.barcode}>{p.barcode}</span>}
        </div>
      )
    },
    { key: 'category', header: t('products:columns.category'), render: (p) => productCategoryLabel(p.category) },
    {
      key: 'total_sold',
      header: t('products:columns.totalSold'),
      align: 'right',
      render: (p) => (
        <strong>{p.total_sold != null ? parseFloat(String(p.total_sold)) : '-'}</strong>
      )
    },
    {
      key: 'stock_quantity',
      header: t('products:columns.stock'),
      align: 'right',
      render: (p) => (
        <Badge variant={Number(p.stock_quantity) <= Number(p.min_stock_level) ? 'danger' : 'success'}>
          {parseFloat(String(p.stock_quantity))} {p.unit}
        </Badge>
      )
    },
    { key: 'sale_price', header: t('products:columns.salePrice'), align: 'right', render: (p) => formatCurrency(Number(p.sale_price) * (1 + Number(p.vat_rate) / 100)) },
    { key: 'created_by_name', header: t('products:columns.createdBy'), render: (p) => p.created_by_name || '-' },
    {
      key: 'actions',
      header: '',
      width: '150px',
      render: (p) => (
        <div className={styles.actions}>
          <Button size="sm" variant="secondary" onClick={() => navigate(`/products/${p.id}`)}>{t('products:actions.detail')}</Button>
          <Button size="sm" variant="primary" onClick={() => openModal(p)}>{t('products:actions.edit')}</Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(p)}>{t('products:actions.delete')}</Button>
        </div>
      )
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>{icons.products}</span>
            {t('products:pageTitle')}
          </h1>
          <p className={styles.subtitle}>{t('products:subtitle', { count: total })}</p>
        </div>
        {canAddProduct && <Button onClick={() => openModal()}>{t('products:newProduct')}</Button>}
      </div>

      {!canAddProduct && (
        <UpgradePrompt variant="inline" message={t('products:upgradeMessage')} />
      )}

      <div className={styles.card}>
        <div className={styles.toolbar}>
          <div className={styles.searchWrapper}>
            <Input
              placeholder={t('products:searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.sortWrapper}>
            <select
              className={styles.sortSelect}
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            >
              <option value="">{t('products:filters.allCategories')}</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{productCategoryLabel(cat)}</option>
              ))}
            </select>
            <select
              className={styles.sortSelect}
              value={`${sortBy}_${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('_');
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
                setPage(1);
              }}
            >
              <option value="total_sold_desc">{t('products:filters.bestSelling')}</option>
              <option value="total_sold_asc">{t('products:filters.leastSelling')}</option>
              <option value="name_asc">{t('products:filters.nameAZ')}</option>
              <option value="name_desc">{t('products:filters.nameZA')}</option>
              <option value="stock_quantity_asc">{t('products:filters.stockLowHigh')}</option>
              <option value="stock_quantity_desc">{t('products:filters.stockHighLow')}</option>
              <option value="sale_price_desc">{t('products:filters.priceHighLow')}</option>
              <option value="sale_price_asc">{t('products:filters.priceLowHigh')}</option>
              <option value="created_at_desc">{t('products:filters.newest')}</option>
            </select>
          </div>
        </div>

        <Table
          columns={columns}
          data={products}
          keyExtractor={(p) => p.id}
          loading={loading}
          emptyMessage={t('products:emptyMessage')}
        />

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </div>

      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        product={editingProduct}
      />
    </div>
  );
}
