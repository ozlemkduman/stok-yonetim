import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Input, Badge, Pagination, Modal, type Column } from '@stok/ui';
import { productsApi, Product, CreateProductData } from '../../api/products.api';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { formatCurrency } from '../../utils/formatters';
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
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('total_sold');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<CreateProductData>({ name: '', purchase_price: 0, sale_price: 0 });
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productsApi.getAll({ page, limit: 20, search, sortBy, sortOrder });
      setProducts(response.data);
      setTotalPages(response.meta?.totalPages || 1);
      setTotal(response.meta?.total || 0);
    } catch (err) {
      showToast('error', 'Ürünler yüklenemedi');
    }
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [page, search, sortBy, sortOrder]);

  const handleSubmit = async () => {
    try {
      if (editingProduct) {
        await productsApi.update(editingProduct.id, formData);
        showToast('success', 'Ürün güncellendi');
      } else {
        await productsApi.create(formData);
        showToast('success', 'Ürün eklendi');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Hata oluştu');
    }
  };

  const handleDelete = async (product: Product) => {
    const confirmed = await confirm({ message: `"${product.name}" ürününü silmek istediğinizden emin misiniz?`, variant: 'danger' });
    if (!confirmed) return;
    try {
      await productsApi.delete(product.id);
      showToast('success', 'Ürün silindi');
      fetchProducts();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Silme başarısız');
    }
  };

  const openModal = (product?: Product) => {
    setEditingProduct(product || null);
    setFormData(product ? {
      name: product.name,
      barcode: product.barcode || '',
      category: product.category || '',
      unit: product.unit,
      purchase_price: product.purchase_price,
      sale_price: product.sale_price,
      vat_rate: product.vat_rate,
      stock_quantity: product.stock_quantity,
      min_stock_level: product.min_stock_level
    } : { name: '', purchase_price: 0, sale_price: 0 });
    setIsModalOpen(true);
  };

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: 'Ürün Adı',
      render: (p) => (
        <div className={styles.productName}>
          <span className={styles.name} onClick={() => navigate(`/products/${p.id}`)} style={{ cursor: 'pointer' }}>{p.name}</span>
          {p.barcode && <span className={styles.barcode}>{p.barcode}</span>}
        </div>
      )
    },
    { key: 'category', header: 'Kategori', render: (p) => p.category || '-' },
    {
      key: 'total_sold',
      header: 'Satilan',
      align: 'right',
      render: (p) => (
        <strong>{p.total_sold ?? '-'}</strong>
      )
    },
    {
      key: 'stock_quantity',
      header: 'Stok',
      align: 'right',
      render: (p) => (
        <Badge variant={p.stock_quantity <= p.min_stock_level ? 'danger' : 'success'}>
          {p.stock_quantity} {p.unit}
        </Badge>
      )
    },
    { key: 'purchase_price', header: 'Alış Fiyatı', align: 'right', render: (p) => formatCurrency(p.purchase_price) },
    { key: 'sale_price', header: 'Satış Fiyatı', align: 'right', render: (p) => formatCurrency(p.sale_price) },
    {
      key: 'actions',
      header: '',
      width: '150px',
      render: (p) => (
        <div className={styles.actions}>
          <Button size="sm" variant="ghost" onClick={() => navigate(`/products/${p.id}`)}>Detay</Button>
          <Button size="sm" variant="ghost" onClick={() => openModal(p)}>Düzenle</Button>
          <Button size="sm" variant="ghost" onClick={() => handleDelete(p)}>Sil</Button>
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
            Ürünler
          </h1>
          <p className={styles.subtitle}>Toplam {total} ürün kaydı</p>
        </div>
        <Button onClick={() => openModal()}>+ Yeni Ürün</Button>
      </div>

      <div className={styles.card}>
        <div className={styles.toolbar}>
          <div className={styles.searchWrapper}>
            <Input
              placeholder="Ürün ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className={styles.sortWrapper}>
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
              <option value="total_sold_desc">En Cok Satan</option>
              <option value="total_sold_asc">En Az Satan</option>
              <option value="name_asc">Ada Gore (A-Z)</option>
              <option value="name_desc">Ada Gore (Z-A)</option>
              <option value="stock_quantity_asc">Stok (Az-Cok)</option>
              <option value="stock_quantity_desc">Stok (Cok-Az)</option>
              <option value="sale_price_desc">Fiyat (Yuksek-Dusuk)</option>
              <option value="sale_price_asc">Fiyat (Dusuk-Yuksek)</option>
              <option value="created_at_desc">En Yeni</option>
            </select>
          </div>
        </div>

        <Table
          columns={columns}
          data={products}
          keyExtractor={(p) => p.id}
          loading={loading}
          emptyMessage="Ürün bulunamadı"
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
        title={editingProduct ? 'Ürün Düzenle' : 'Yeni Ürün'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>İptal</Button>
            <Button onClick={handleSubmit}>{editingProduct ? 'Güncelle' : 'Kaydet'}</Button>
          </>
        }
      >
        <div className={styles.form}>
          <Input label="Ürün Adı *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} fullWidth />
          <Input label="Barkod" value={formData.barcode || ''} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} fullWidth />
          <Input label="Kategori" value={formData.category || ''} onChange={(e) => setFormData({ ...formData, category: e.target.value })} fullWidth />
          <Input label="Birim" value={formData.unit || 'adet'} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} fullWidth />
          <Input label="Alış Fiyatı *" type="number" value={formData.purchase_price} onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })} fullWidth />
          <Input label="Satış Fiyatı *" type="number" value={formData.sale_price} onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) || 0 })} fullWidth />
          <Input label="KDV Oranı (%)" type="number" value={formData.vat_rate || 20} onChange={(e) => setFormData({ ...formData, vat_rate: parseFloat(e.target.value) || 0 })} fullWidth />
          <Input label="Stok Miktarı" type="number" value={formData.stock_quantity || 0} onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })} fullWidth />
          <Input label="Kritik Stok Seviyesi" type="number" value={formData.min_stock_level || 5} onChange={(e) => setFormData({ ...formData, min_stock_level: parseInt(e.target.value) || 0 })} fullWidth />
        </div>
      </Modal>
    </div>
  );
}
