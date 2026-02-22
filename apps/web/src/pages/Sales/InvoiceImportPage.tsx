import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Badge, Select, Input } from '@stok/ui';
import { invoiceImportApi, ParsePreviewResponse, ConfirmImportData } from '../../api/invoice-import.api';
import { Warehouse, warehousesApi } from '../../api/warehouses.api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate } from '../../utils/formatters';
import styles from './InvoiceImportPage.module.css';

type Step = 'upload' | 'preview' | 'importing';

export function InvoiceImportPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(['sales', 'common']);
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

  const PAYMENT_OPTIONS = [
    { value: 'nakit', label: t('sales:import.paymentOptions.nakit') },
    { value: 'kredi_karti', label: t('sales:import.paymentOptions.kredi_karti') },
    { value: 'havale', label: t('sales:import.paymentOptions.havale') },
    { value: 'veresiye', label: t('sales:import.paymentOptions.veresiye') },
  ];

  const SALE_TYPE_OPTIONS = [
    { value: 'retail', label: t('sales:import.saleTypeOptions.retail') },
    { value: 'wholesale', label: t('sales:import.saleTypeOptions.wholesale') },
  ];

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
      showToast('error', err instanceof Error ? err.message : t('sales:toast.xmlParseError'));
    }
    setParsing(false);
  };

  const stockWarnings = preview?.items.filter(
    (item) => !item.isNew && item.stockQuantity !== null && item.parsed.quantity > item.stockQuantity
  ) || [];

  const handleConfirm = async () => {
    if (!preview) return;
    if (!warehouseId) {
      showToast('error', t('sales:toast.selectWarehouse'));
      return;
    }
    if (paymentMethod === 'veresiye' && preview.customer.isNew && !preview.customer.parsed.name) {
      showToast('error', t('sales:toast.creditCustomerRequired'));
      return;
    }
    if (stockWarnings.length > 0) {
      showToast('error', t('sales:toast.stockInsufficient'));
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
      showToast('success', t('sales:toast.importSuccess'));
      navigate(`/sales/${response.data.saleId}`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('sales:toast.importError'));
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
            <h1 className={styles.title}>{t('sales:import.title')}</h1>
            <p className={styles.subtitle}>{t('sales:import.subtitle')}</p>
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
            <h2 className={styles.uploadTitle}>{t('sales:import.selectFile')}</h2>
            <p className={styles.uploadDesc}>
              {t('sales:import.fileDesc')}
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
                {t('sales:import.chooseFile')}
              </Button>
              {file && <span className={styles.fileName}>{file.name}</span>}
            </div>
            {file && (
              <Button onClick={handleParse} disabled={parsing}>
                {parsing ? t('sales:import.analyzing') : t('sales:import.analyze')}
              </Button>
            )}
          </div>
        </div>
      )}

      {step === 'preview' && preview && (
        <div className={styles.previewSection}>
          {/* Invoice Info */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>{t('sales:import.invoiceInfo')}</h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('sales:import.invoiceNo')}</span>
                <span className={styles.infoValue}>{preview.invoice.id}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('sales:import.date')}</span>
                <span className={styles.infoValue}>
                  {preview.invoice.issueDate ? formatDate(preview.invoice.issueDate) : '-'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('sales:import.type')}</span>
                <span className={styles.infoValue}>{preview.invoice.invoiceTypeCode}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('sales:import.currency')}</span>
                <span className={styles.infoValue}>{preview.invoice.currencyCode}</span>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>{t('sales:import.customer')}</h3>
              <Badge variant={preview.customer.isNew ? 'warning' : 'success'}>
                {preview.customer.isNew ? t('sales:import.customerNew') : t('sales:import.customerExisting')}
              </Badge>
            </div>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('sales:import.name')}</span>
                <span className={styles.infoValue}>
                  {preview.customer.isNew
                    ? preview.customer.parsed.name
                    : preview.customer.matchedName}
                </span>
              </div>
              {preview.customer.parsed.taxNumber && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>{t('sales:import.taxId')}</span>
                  <span className={styles.infoValue}>{preview.customer.parsed.taxNumber}</span>
                </div>
              )}
              {preview.customer.parsed.taxOffice && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>{t('sales:import.taxOffice')}</span>
                  <span className={styles.infoValue}>{preview.customer.parsed.taxOffice}</span>
                </div>
              )}
              {preview.customer.parsed.address && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>{t('sales:import.address')}</span>
                  <span className={styles.infoValue}>{preview.customer.parsed.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>{t('sales:import.productsCount', { count: preview.items.length })}</h3>
              {stockWarnings.length > 0 && (
                <Badge variant="danger">{t('sales:import.stockInsufficient', { count: stockWarnings.length })}</Badge>
              )}
            </div>
            {stockWarnings.length > 0 && (
              <div className={styles.stockWarning}>
                {t('sales:import.stockWarningMessage')}
              </div>
            )}
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{t('sales:import.itemColumns.status')}</th>
                    <th>{t('sales:import.itemColumns.productName')}</th>
                    <th className={styles.alignRight}>{t('sales:import.itemColumns.stock')}</th>
                    <th className={styles.alignRight}>{t('sales:import.itemColumns.quantity')}</th>
                    <th className={styles.alignRight}>{t('sales:import.itemColumns.unitPrice')}</th>
                    <th className={styles.alignRight}>{t('sales:import.itemColumns.vatRate')}</th>
                    <th className={styles.alignRight}>{t('sales:import.itemColumns.vatAmount')}</th>
                    <th className={styles.alignRight}>{t('sales:import.itemColumns.total')}</th>
                    {preview.items.some(i => i.isNew) && (
                      <th className={styles.alignRight}>{t('sales:import.itemColumns.purchasePrice')}</th>
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
                            {item.isNew ? t('sales:import.itemNew') : t('sales:import.itemExisting')}
                          </Badge>
                        </td>
                        <td>
                          {item.parsed.name}
                          {!item.isNew && item.matchedName && item.matchedName !== item.parsed.name && (
                            <span className={styles.matchedName}> &rarr; {item.matchedName}</span>
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
            <h3 className={styles.cardTitle}>{t('sales:import.totals')}</h3>
            <div className={styles.totalsGrid}>
              <div className={styles.totalRow}>
                <span>{t('sales:import.subtotal')}</span>
                <span>{formatCurrency(preview.totals.lineExtensionAmount)}</span>
              </div>
              <div className={styles.totalRow}>
                <span>{t('sales:import.vatTotal')}</span>
                <span>{formatCurrency(preview.totals.taxTotal)}</span>
              </div>
              <div className={`${styles.totalRow} ${styles.grandTotal}`}>
                <span>{t('sales:import.grandTotal')}</span>
                <span>{formatCurrency(preview.totals.payableAmount)}</span>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>{t('sales:import.saleSettings')}</h3>
            <div className={styles.settingsGrid}>
              <div className={styles.settingsField}>
                <label className={styles.infoLabel}>{t('sales:import.warehouseLabel')}</label>
                <Select
                  options={[
                    { value: '', label: t('sales:import.selectWarehouse') },
                    ...warehouses.map(w => ({ value: w.id, label: w.name })),
                  ]}
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                />
              </div>
              <div className={styles.settingsField}>
                <label className={styles.infoLabel}>{t('sales:import.paymentMethodLabel')}</label>
                <Select
                  options={PAYMENT_OPTIONS}
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
              </div>
              <div className={styles.settingsField}>
                <label className={styles.infoLabel}>{t('sales:import.saleTypeLabel')}</label>
                <Select
                  options={SALE_TYPE_OPTIONS}
                  value={saleType}
                  onChange={(e) => setSaleType(e.target.value)}
                />
              </div>
              {paymentMethod === 'veresiye' && (
                <div className={styles.settingsField}>
                  <label className={styles.infoLabel}>{t('sales:import.dueDateLabel')}</label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className={styles.settingsField} style={{ marginTop: 'var(--space-3)' }}>
              <label className={styles.infoLabel}>{t('sales:import.noteLabel')}</label>
              <textarea
                className={styles.notesInput}
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('sales:import.notePlaceholder')}
              />
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <Button variant="secondary" onClick={() => { setStep('upload'); setPreview(null); setFile(null); }}>
              {t('sales:import.back')}
            </Button>
            <Button onClick={handleConfirm} disabled={importing || !warehouseId || stockWarnings.length > 0}>
              {importing ? t('sales:import.importing') : t('sales:import.importButton')}
            </Button>
          </div>
        </div>
      )}

      {step === 'importing' && (
        <div className={styles.uploadSection}>
          <div className={styles.uploadCard}>
            <div className={styles.spinner} />
            <h2 className={styles.uploadTitle}>{t('sales:import.importingTitle')}</h2>
            <p className={styles.uploadDesc}>
              {t('sales:import.importingDesc')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
