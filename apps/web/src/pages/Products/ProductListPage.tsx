import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Input, Badge, Pagination, Modal, type Column } from '@stok/ui';
import { productsApi, Product, CreateProductData } from '../../api/products.api';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import { useTenant } from '../../context/TenantContext';
import { UpgradePrompt } from '../../components/UpgradePrompt';
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
  const [purchaseVatIncluded, setPurchaseVatIncluded] = useState(false);
  const [saleVatIncluded, setSaleVatIncluded] = useState(false);
  const [displayPurchasePrice, setDisplayPurchasePrice] = useState('0');
  const [displaySalePrice, setDisplaySalePrice] = useState('0');
  const [displayWholesalePrice, setDisplayWholesalePrice] = useState('0');
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();
  const { isWithinLimit } = useTenant();
  const canAddProduct = isWithinLimit('products');

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
    setPurchaseVatIncluded(false);
    setSaleVatIncluded(false);
    if (product) {
      setFormData({
        name: product.name,
        barcode: product.barcode || '',
        category: product.category || '',
        unit: product.unit,
        purchase_price: product.purchase_price,
        sale_price: product.sale_price,
        wholesale_price: product.wholesale_price || 0,
        vat_rate: product.vat_rate,
        stock_quantity: product.stock_quantity,
        min_stock_level: product.min_stock_level
      });
      setDisplayPurchasePrice(String(product.purchase_price));
      setDisplaySalePrice(String(product.sale_price));
      setDisplayWholesalePrice(String(product.wholesale_price || 0));
    } else {
      setFormData({ name: '', purchase_price: 0, sale_price: 0, wholesale_price: 0 });
      setDisplayPurchasePrice('0');
      setDisplaySalePrice('0');
      setDisplayWholesalePrice('0');
    }
    setIsModalOpen(true);
  };

  const vatRate = formData.vat_rate ?? 20;
  const vatMultiplier = 1 + vatRate / 100;

  const isVatIncludedForField = (field: 'purchase_price' | 'sale_price' | 'wholesale_price') => {
    return field === 'purchase_price' ? purchaseVatIncluded : saleVatIncluded;
  };

  const handlePriceChange = (field: 'purchase_price' | 'sale_price' | 'wholesale_price', rawValue: string) => {
    const setDisplay = field === 'purchase_price' ? setDisplayPurchasePrice : field === 'sale_price' ? setDisplaySalePrice : setDisplayWholesalePrice;
    setDisplay(rawValue);
    const parsed = parseFloat(rawValue);
    if (isNaN(parsed)) {
      setFormData(prev => ({ ...prev, [field]: 0 }));
      return;
    }
    const vatInc = isVatIncludedForField(field);
    const basePrice = vatInc ? parsed / vatMultiplier : parsed;
    setFormData(prev => ({ ...prev, [field]: basePrice }));
  };

  const handleVatRateChange = (newRate: number) => {
    const newMultiplier = 1 + newRate / 100;
    setFormData(prev => {
      const updates: Partial<CreateProductData> = { vat_rate: newRate };
      if (purchaseVatIncluded) {
        const purchaseVal = parseFloat(displayPurchasePrice) || 0;
        updates.purchase_price = purchaseVal / newMultiplier;
      }
      if (saleVatIncluded) {
        const saleVal = parseFloat(displaySalePrice) || 0;
        const wholesaleVal = parseFloat(displayWholesalePrice) || 0;
        updates.sale_price = saleVal / newMultiplier;
        updates.wholesale_price = wholesaleVal / newMultiplier;
      }
      return { ...prev, ...updates };
    });
  };

  const handlePurchaseVatToggle = (included: boolean) => {
    setPurchaseVatIncluded(included);
    if (included) {
      setDisplayPurchasePrice(String(formData.purchase_price * vatMultiplier));
    } else {
      setDisplayPurchasePrice(String(formData.purchase_price));
    }
  };

  const handleSaleVatToggle = (included: boolean) => {
    setSaleVatIncluded(included);
    if (included) {
      setDisplaySalePrice(String(formData.sale_price * vatMultiplier));
      setDisplayWholesalePrice(String((formData.wholesale_price || 0) * vatMultiplier));
    } else {
      setDisplaySalePrice(String(formData.sale_price));
      setDisplayWholesalePrice(String(formData.wholesale_price || 0));
    }
  };

  const getPriceInfo = (field: 'purchase_price' | 'sale_price' | 'wholesale_price') => {
    const basePrice = formData[field] || 0;
    const vatInc = isVatIncludedForField(field);
    if (vatInc) {
      return `KDV Hariç: ${basePrice.toFixed(2)} ₺`;
    } else {
      return `KDV Dahil: ${(basePrice * vatMultiplier).toFixed(2)} ₺`;
    }
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
    { key: 'created_by_name', header: 'Kaydeden', render: (p) => p.created_by_name || '-' },
    {
      key: 'actions',
      header: '',
      width: '150px',
      render: (p) => (
        <div className={styles.actions}>
          <Button size="sm" variant="secondary" onClick={() => navigate(`/products/${p.id}`)}>Detay</Button>
          <Button size="sm" variant="primary" onClick={() => openModal(p)}>Düzenle</Button>
          <Button size="sm" variant="danger" onClick={() => handleDelete(p)}>Sil</Button>
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
        {canAddProduct && <Button onClick={() => openModal()}>+ Yeni Ürün</Button>}
      </div>

      {!canAddProduct && (
        <UpgradePrompt variant="inline" message="Urun limitinize ulastiniz. Daha fazla urun eklemek icin planinizi yukseltin." />
      )}

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
          <div className={styles.vatRateRow}>
            <Input label="KDV Oranı (%)" type="number" step="any" value={formData.vat_rate ?? 20} onChange={(e) => handleVatRateChange(parseFloat(e.target.value) || 0)} fullWidth />
          </div>

          <div className={styles.priceSection}>
            <div className={styles.priceSectionHeader}>
              <span className={styles.priceSectionTitle}>Alış Fiyatı</span>
              <div className={styles.vatToggle}>
                <button type="button" className={`${styles.vatToggleBtn} ${!purchaseVatIncluded ? styles.vatToggleActive : ''}`} onClick={() => handlePurchaseVatToggle(false)}>KDV Hariç</button>
                <button type="button" className={`${styles.vatToggleBtn} ${purchaseVatIncluded ? styles.vatToggleActive : ''}`} onClick={() => handlePurchaseVatToggle(true)}>KDV Dahil</button>
              </div>
            </div>
            <div className={styles.priceField}>
              <Input
                label={`Alış Fiyatı * ${purchaseVatIncluded ? '(KDV Dahil)' : '(KDV Hariç)'}`}
                type="number"
                step="any"
                value={displayPurchasePrice}
                onChange={(e) => handlePriceChange('purchase_price', e.target.value)}
                fullWidth
              />
              <span className={styles.priceHint}>{getPriceInfo('purchase_price')}</span>
            </div>
          </div>

          <div className={styles.priceSection}>
            <div className={styles.priceSectionHeader}>
              <span className={styles.priceSectionTitle}>Satış Fiyatları</span>
              <div className={styles.vatToggle}>
                <button type="button" className={`${styles.vatToggleBtn} ${!saleVatIncluded ? styles.vatToggleActive : ''}`} onClick={() => handleSaleVatToggle(false)}>KDV Hariç</button>
                <button type="button" className={`${styles.vatToggleBtn} ${saleVatIncluded ? styles.vatToggleActive : ''}`} onClick={() => handleSaleVatToggle(true)}>KDV Dahil</button>
              </div>
            </div>
            <div className={styles.priceField}>
              <Input
                label={`Satış Fiyatı * ${saleVatIncluded ? '(KDV Dahil)' : '(KDV Hariç)'}`}
                type="number"
                step="any"
                value={displaySalePrice}
                onChange={(e) => handlePriceChange('sale_price', e.target.value)}
                fullWidth
              />
              <span className={styles.priceHint}>{getPriceInfo('sale_price')}</span>
            </div>
            <div className={styles.priceField}>
              <Input
                label={`Toptan Satış Fiyatı ${saleVatIncluded ? '(KDV Dahil)' : '(KDV Hariç)'}`}
                type="number"
                step="any"
                value={displayWholesalePrice}
                onChange={(e) => handlePriceChange('wholesale_price', e.target.value)}
                fullWidth
              />
              <span className={styles.priceHint}>{getPriceInfo('wholesale_price')}</span>
            </div>
          </div>

          <Input label="Stok Miktarı" type="number" step="any" value={formData.stock_quantity || 0} onChange={(e) => setFormData({ ...formData, stock_quantity: parseFloat(e.target.value) || 0 })} fullWidth />
          <Input label="Kritik Stok Seviyesi" type="number" step="any" value={formData.min_stock_level || 5} onChange={(e) => setFormData({ ...formData, min_stock_level: parseFloat(e.target.value) || 0 })} fullWidth />
        </div>
      </Modal>
    </div>
  );
}
