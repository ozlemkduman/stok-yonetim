import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Badge, Select, Input } from '@stok/ui';
import { invoiceImportApi, ParsePreviewResponse, ConfirmImportData } from '../../api/invoice-import.api';
import { Warehouse, warehousesApi } from '../../api/warehouses.api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './InvoiceImportPage.module.css';

const PAYMENT_OPTIONS = [
  { value: 'nakit', label: 'Nakit' },
  { value: 'kredi_karti', label: 'Kredi Kartı' },
  { value: 'havale', label: 'Havale' },
  { value: 'veresiye', label: 'Veresiye' },
];

const SALE_TYPE_OPTIONS = [
  { value: 'retail', label: 'Perakende' },
  { value: 'wholesale', label: 'Toptan' },
];

type Step = 'upload' | 'preview' | 'importing';

export function InvoiceImportPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState<ParsePreviewResponse | null>(null);
  const [purchasePrices, setPurchasePrices] = useState<Record<number, number>>({});
  const [importing, setImporting] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseId, setWarehouseId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('nakit');
  const [saleType, setSaleType] = useState('retail');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    warehousesApi.getAll({ isActive: true }).then((res) => {
      setWarehouses(res.data);
      const defaultWh = res.data.find(w => w.is_default);
      if (defaultWh) setWarehouseId(defaultWh.id);
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
  };

  const handleParse = async () => {
    if (!file) return;
    setParsing(true);
    try {
      const response = await invoiceImportApi.parse(file);
      setPreview(response.data);
      // Initialize purchase prices for new items
      const prices: Record<number, number> = {};
      response.data.items.forEach((item, idx) => {
        if (item.isNew) prices[idx] = 0;
      });
      setPurchasePrices(prices);
      setStep('preview');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'XML parse hatası');
    }
    setParsing(false);
  };

  const stockWarnings = preview?.items.filter(
    (item) => !item.isNew && item.stockQuantity !== null && item.parsed.quantity > item.stockQuantity
  ) || [];

  const handleConfirm = async () => {
    if (!preview) return;
    if (!warehouseId) {
      showToast('error', 'Lütfen bir depo seçin');
      return;
    }
    if (paymentMethod === 'veresiye' && preview.customer.isNew && !preview.customer.parsed.name) {
      showToast('error', 'Veresiye satış için müşteri bilgisi gerekli');
      return;
    }
    if (stockWarnings.length > 0) {
      showToast('error', 'Stok yetersiz olan ürünler var. Lütfen kontrol edin.');
      return;
    }
    setImporting(true);
    setStep('importing');
    try {
      const data: ConfirmImportData = {
        invoice: preview.invoice,
        customer: preview.customer,
        items: preview.items.map((item, idx) => ({
          parsed: item.parsed,
          isNew: item.isNew,
          matchedId: item.matchedId,
          purchasePrice: purchasePrices[idx] ?? 0,
        })),
        totals: preview.totals,
        warehouseId,
        paymentMethod,
        saleType,
        dueDate: dueDate || undefined,
        notes: notes || undefined,
      };
      const response = await invoiceImportApi.confirm(data);
      showToast('success', 'Fatura başarıyla içeri aktarıldı');
      navigate(`/sales/${response.data.saleId}`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'İçeri aktarma hatası');
      setStep('preview');
    }
    setImporting(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backButton} onClick={() => navigate('/sales')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div>
            <h1 className={styles.title}>E-Fatura Yükle</h1>
            <p className={styles.subtitle}>UBL-TR XML dosyasından satış kaydı oluşturun</p>
          </div>
        </div>
      </div>

      {step === 'upload' && (
        <div className={styles.uploadSection}>
          <div className={styles.uploadCard}>
            <div className={styles.uploadIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <polyline points="9 15 12 12 15 15" />
              </svg>
            </div>
            <h2 className={styles.uploadTitle}>XML Dosyası Seçin</h2>
            <p className={styles.uploadDesc}>
              BiFatura veya diğer e-fatura portallarından indirdiğiniz UBL-TR formatındaki XML dosyasını yükleyin.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xml"
              onChange={handleFileChange}
              className={styles.fileInput}
            />
            <div className={styles.uploadActions}>
              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                Dosya Seç
              </Button>
              {file && <span className={styles.fileName}>{file.name}</span>}
            </div>
            {file && (
              <Button onClick={handleParse} disabled={parsing}>
                {parsing ? 'Analiz ediliyor...' : 'Analiz Et'}
              </Button>
            )}
          </div>
        </div>
      )}

      {step === 'preview' && preview && (
        <div className={styles.previewSection}>
          {/* Invoice Info */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Fatura Bilgileri</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Fatura No</span>
                <span className={styles.infoValue}>{preview.invoice.id}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Tarih</span>
                <span className={styles.infoValue}>
                  {preview.invoice.issueDate ? formatDate(preview.invoice.issueDate) : '-'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Tip</span>
                <span className={styles.infoValue}>{preview.invoice.invoiceTypeCode}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Para Birimi</span>
                <span className={styles.infoValue}>{preview.invoice.currencyCode}</span>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Müşteri</h3>
              <Badge variant={preview.customer.isNew ? 'warning' : 'success'}>
                {preview.customer.isNew ? 'Yeni Oluşturulacak' : 'Mevcut'}
              </Badge>
            </div>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Ad</span>
                <span className={styles.infoValue}>
                  {preview.customer.isNew
                    ? preview.customer.parsed.name
                    : preview.customer.matchedName}
                </span>
              </div>
              {preview.customer.parsed.taxNumber && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>VKN/TCKN</span>
                  <span className={styles.infoValue}>{preview.customer.parsed.taxNumber}</span>
                </div>
              )}
              {preview.customer.parsed.taxOffice && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Vergi Dairesi</span>
                  <span className={styles.infoValue}>{preview.customer.parsed.taxOffice}</span>
                </div>
              )}
              {preview.customer.parsed.address && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Adres</span>
                  <span className={styles.infoValue}>{preview.customer.parsed.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Ürünler ({preview.items.length})</h3>
              {stockWarnings.length > 0 && (
                <Badge variant="danger">{stockWarnings.length} üründe stok yetersiz</Badge>
              )}
            </div>
            {stockWarnings.length > 0 && (
              <div className={styles.stockWarning}>
                Stok yetersiz olan ürünler kırmızı ile işaretlenmiştir. Bu ürünlerin stoğu yeterli olmadan satış oluşturulamaz.
              </div>
            )}
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Durum</th>
                    <th>Ürün Adı</th>
                    <th className={styles.alignRight}>Stok</th>
                    <th className={styles.alignRight}>Miktar</th>
                    <th className={styles.alignRight}>Birim Fiyat</th>
                    <th className={styles.alignRight}>KDV %</th>
                    <th className={styles.alignRight}>KDV Tutarı</th>
                    <th className={styles.alignRight}>Toplam</th>
                    {preview.items.some(i => i.isNew) && (
                      <th className={styles.alignRight}>Alış Fiyatı</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {preview.items.map((item, idx) => {
                    const isLowStock = !item.isNew && item.stockQuantity !== null && item.parsed.quantity > item.stockQuantity;
                    return (
                      <tr key={idx} className={isLowStock ? styles.lowStockRow : ''}>
                        <td>
                          <Badge variant={item.isNew ? 'warning' : 'success'}>
                            {item.isNew ? 'Yeni' : 'Mevcut'}
                          </Badge>
                        </td>
                        <td>
                          {item.parsed.name}
                          {!item.isNew && item.matchedName && item.matchedName !== item.parsed.name && (
                            <span className={styles.matchedName}> → {item.matchedName}</span>
                          )}
                        </td>
                        <td className={styles.alignRight}>
                          {item.isNew ? (
                            <span className={styles.newItemStock}>-</span>
                          ) : (
                            <span className={isLowStock ? styles.lowStockText : ''}>
                              {item.stockQuantity ?? '-'}
                            </span>
                          )}
                        </td>
                        <td className={styles.alignRight}>
                          {item.parsed.quantity} {item.parsed.unit}
                        </td>
                        <td className={styles.alignRight}>{formatCurrency(item.parsed.unitPrice)}</td>
                        <td className={styles.alignRight}>%{item.parsed.vatRate}</td>
                        <td className={styles.alignRight}>{formatCurrency(item.parsed.vatAmount)}</td>
                        <td className={styles.alignRight}>{formatCurrency(item.parsed.lineTotal)}</td>
                        {preview.items.some(i => i.isNew) && (
                          <td className={styles.alignRight}>
                            {item.isNew ? (
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={purchasePrices[idx] ?? 0}
                                onChange={(e) => setPurchasePrices(prev => ({
                                  ...prev,
                                  [idx]: parseFloat(e.target.value) || 0,
                                }))}
                                className={styles.priceInput}
                              />
                            ) : (
                              '-'
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Toplam</h3>
            <div className={styles.totalsGrid}>
              <div className={styles.totalRow}>
                <span>Ara Toplam</span>
                <span>{formatCurrency(preview.totals.lineExtensionAmount)}</span>
              </div>
              <div className={styles.totalRow}>
                <span>KDV Toplam</span>
                <span>{formatCurrency(preview.totals.taxTotal)}</span>
              </div>
              <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                <span>Genel Toplam</span>
                <span>{formatCurrency(preview.totals.payableAmount)}</span>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Satış Ayarları</h3>
            <div className={styles.settingsGrid}>
              <div className={styles.settingsField}>
                <label className={styles.infoLabel}>Depo *</label>
                <Select
                  options={[
                    { value: '', label: 'Depo seçin...' },
                    ...warehouses.map(w => ({ value: w.id, label: w.name })),
                  ]}
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                />
              </div>
              <div className={styles.settingsField}>
                <label className={styles.infoLabel}>Ödeme Yöntemi</label>
                <Select
                  options={PAYMENT_OPTIONS}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
              </div>
              <div className={styles.settingsField}>
                <label className={styles.infoLabel}>Satış Tipi</label>
                <Select
                  options={SALE_TYPE_OPTIONS}
                  value={saleType}
                  onChange={(e) => setSaleType(e.target.value)}
                />
              </div>
              {paymentMethod === 'veresiye' && (
                <div className={styles.settingsField}>
                  <label className={styles.infoLabel}>Vade Tarihi</label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className={styles.settingsField} style={{ marginTop: 'var(--space-3)' }}>
              <label className={styles.infoLabel}>Not</label>
              <textarea
                className={styles.notesInput}
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Satış ile ilgili not ekleyin..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <Button variant="secondary" onClick={() => { setStep('upload'); setPreview(null); setFile(null); }}>
              Geri
            </Button>
            <Button onClick={handleConfirm} disabled={importing || !warehouseId || stockWarnings.length > 0}>
              {importing ? 'İçeri aktarılıyor...' : 'İçeri Aktar'}
            </Button>
          </div>
        </div>
      )}

      {step === 'importing' && (
        <div className={styles.uploadSection}>
          <div className={styles.uploadCard}>
            <div className={styles.spinner} />
            <h2 className={styles.uploadTitle}>İçeri aktarılıyor...</h2>
            <p className={styles.uploadDesc}>
              Müşteri, ürünler ve satış kaydı oluşturuluyor.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
