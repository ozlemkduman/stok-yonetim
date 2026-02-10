import { useState, useEffect } from 'react';
import { Table, Button, Input, Badge, Pagination, Modal, type Column } from '@stok/ui';
import { productsApi, Product, CreateProductData } from '../../api/products.api';
import { useToast } from '../../context/ToastContext';
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
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<CreateProductData>({ name: '', purchase_price: 0, sale_price: 0 });
  const { showToast } = useToast();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productsApi.getAll({ page, limit: 20, search });
      setProducts(response.data);
      setTotalPages(response.meta?.totalPages || 1);
      setTotal(response.meta?.total || 0);
    } catch (err) {
      showToast('error', 'Urunler yuklenemedi');
    }
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [page, search]);

  const handleSubmit = async () => {
    try {
      if (editingProduct) {
        await productsApi.update(editingProduct.id, formData);
        showToast('success', 'Urun guncellendi');
      } else {
        await productsApi.create(formData);
        showToast('success', 'Urun eklendi');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Hata olustu');
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`"${product.name}" urununu silmek istediginizden emin misiniz?`)) return;
    try {
      await productsApi.delete(product.id);
      showToast('success', 'Urun silindi');
      fetchProducts();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Silme basarisiz');
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
      header: 'Urun Adi',
      render: (p) => (
        <div className={styles.productName}>
          <span className={styles.name}>{p.name}</span>
          {p.barcode && <span className={styles.barcode}>{p.barcode}</span>}
        </div>
      )
    },
    { key: 'category', header: 'Kategori', render: (p) => p.category || '-' },
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
    { key: 'purchase_price', header: 'Alis Fiyati', align: 'right', render: (p) => formatCurrency(p.purchase_price) },
    { key: 'sale_price', header: 'Satis Fiyati', align: 'right', render: (p) => formatCurrency(p.sale_price) },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (p) => (
        <div className={styles.actions}>
          <Button size="sm" variant="ghost" onClick={() => openModal(p)}>Duzenle</Button>
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
            Urunler
          </h1>
          <p className={styles.subtitle}>Toplam {total} urun kaydi</p>
        </div>
        <Button onClick={() => openModal()}>+ Yeni Urun</Button>
      </div>

      <div className={styles.card}>
        <div className={styles.toolbar}>
          <div className={styles.searchWrapper}>
            <Input
              placeholder="Urun ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Table
          columns={columns}
          data={products}
          keyExtractor={(p) => p.id}
          loading={loading}
          emptyMessage="Urun bulunamadi"
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
        title={editingProduct ? 'Urun Duzenle' : 'Yeni Urun'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Iptal</Button>
            <Button onClick={handleSubmit}>{editingProduct ? 'Guncelle' : 'Kaydet'}</Button>
          </>
        }
      >
        <div className={styles.form}>
          <Input label="Urun Adi *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} fullWidth />
          <Input label="Barkod" value={formData.barcode || ''} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} fullWidth />
          <Input label="Kategori" value={formData.category || ''} onChange={(e) => setFormData({ ...formData, category: e.target.value })} fullWidth />
          <Input label="Birim" value={formData.unit || 'adet'} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} fullWidth />
          <Input label="Alis Fiyati *" type="number" value={formData.purchase_price} onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })} fullWidth />
          <Input label="Satis Fiyati *" type="number" value={formData.sale_price} onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) || 0 })} fullWidth />
          <Input label="KDV Orani (%)" type="number" value={formData.vat_rate || 20} onChange={(e) => setFormData({ ...formData, vat_rate: parseFloat(e.target.value) || 0 })} fullWidth />
          <Input label="Stok Miktari" type="number" value={formData.stock_quantity || 0} onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })} fullWidth />
          <Input label="Kritik Stok Seviyesi" type="number" value={formData.min_stock_level || 5} onChange={(e) => setFormData({ ...formData, min_stock_level: parseInt(e.target.value) || 0 })} fullWidth />
        </div>
      </Modal>
    </div>
  );
}
