import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Badge } from '@stok/ui';
import { customersApi, CustomerImportParseResponse, CustomerImportPreview } from '../../api/customers.api';
import { useToast } from '../../context/ToastContext';
import styles from './CustomerImportPage.module.css';

type Step = 'upload' | 'preview' | 'importing' | 'done';

const CSV_TEMPLATE = `musteri_adi;telefon;email;adres;vergi_no;vergi_dairesi;notlar
Örnek Müşteri A.Ş.;0532 123 4567;ornek@firma.com;İstanbul, Kadıköy;1234567890;Kadıköy VD;VIP müşteri
Test Ltd. Şti.;0533 987 6543;test@firma.com;Ankara, Çankaya;9876543210;Çankaya VD;
Ahmet Yılmaz;0544 111 2233;ahmet@mail.com;İzmir;;;;`;

export function CustomerImportPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(['customers', 'common']);
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'csv' | 'xlsx'>('csv');
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState<CustomerImportParseResponse | null>(null);
  const [skipExisting, setSkipExisting] = useState(true);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; updated: number; skipped: number } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (selected) {
      const name = selected.name.toLowerCase();
      setFileType((name.endsWith('.xlsx') || name.endsWith('.xls')) ? 'xlsx' : 'csv');
    }
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'musteri-sablonu.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleParse = async () => {
    if (!file) return;
    setParsing(true);
    try {
      const response = await customersApi.importParse(file);
      setPreview(response.data);
      setStep('preview');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('customers:import.parseError'));
    }
    setParsing(false);
  };

  const handleConfirm = async () => {
    if (!preview) return;
    setImporting(true);
    setStep('importing');
    try {
      const data = {
        customers: skipExisting
          ? preview.customers.filter((c) => c.isNew)
          : preview.customers,
        skipExisting,
      };
      const response = await customersApi.importConfirm(data);
      setResult(response.data);
      setStep('done');
      showToast('success', t('customers:import.success'));
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('customers:import.error'));
      setStep('preview');
    }
    setImporting(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backButton} onClick={() => navigate('/customers')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <div>
            <h1 className={styles.title}>{t('customers:import.title')}</h1>
            <p className={styles.subtitle}>{t('customers:import.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Upload Step */}
      {step === 'upload' && (
        <div className={styles.uploadSection}>
          <div className={styles.uploadCard}>
            <div className={styles.uploadIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="23" y1="11" x2="17" y2="11" />
                <line x1="20" y1="8" x2="20" y2="14" />
              </svg>
            </div>
            <h2 className={styles.uploadTitle}>{t('customers:import.selectFile')}</h2>
            <p className={styles.uploadDesc}>{t('customers:import.fileDesc')}</p>
            <div className={styles.formatBadges}>
              <span className={styles.formatBadge}>CSV</span>
              <span className={styles.formatBadge}>Excel (XLSX)</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className={styles.fileInput}
            />
            <div className={styles.uploadActions}>
              <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                {t('customers:import.chooseFile')}
              </Button>
              {file && (
                <span className={styles.fileName}>
                  {file.name}
                  <Badge variant={fileType === 'csv' ? 'info' : 'success'}>
                    {fileType.toUpperCase()}
                  </Badge>
                </span>
              )}
            </div>
            {file && (
              <Button onClick={handleParse} disabled={parsing}>
                {parsing ? t('customers:import.analyzing') : t('customers:import.analyze')}
              </Button>
            )}
            <div className={styles.templateSection}>
              <button className={styles.templateLink} onClick={handleDownloadTemplate}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {t('customers:import.downloadTemplate')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Step */}
      {step === 'preview' && preview && (
        <div className={styles.previewSection}>
          {/* Summary */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>{t('customers:import.summary')}</h3>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <span className={styles.summaryNumber}>{preview.summary.total}</span>
                <span className={styles.summaryLabel}>{t('customers:import.totalRows')}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={`${styles.summaryNumber} ${styles.newColor}`}>{preview.summary.newCount}</span>
                <span className={styles.summaryLabel}>{t('customers:import.newCustomers')}</span>
              </div>
              <div className={styles.summaryItem}>
                <span className={`${styles.summaryNumber} ${styles.existingColor}`}>{preview.summary.existingCount}</span>
                <span className={styles.summaryLabel}>{t('customers:import.existingCustomers')}</span>
              </div>
            </div>
          </div>

          {/* Options */}
          {preview.summary.existingCount > 0 && (
            <div className={styles.card}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={skipExisting}
                  onChange={(e) => setSkipExisting(e.target.checked)}
                />
                <span>{t('customers:import.skipExisting')}</span>
              </label>
            </div>
          )}

          {/* Customer List */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>{t('customers:import.customerList')}</h3>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{t('customers:import.cols.status')}</th>
                    <th>{t('customers:import.cols.name')}</th>
                    <th>{t('customers:import.cols.phone')}</th>
                    <th>{t('customers:import.cols.email')}</th>
                    <th>{t('customers:import.cols.taxNumber')}</th>
                    <th>{t('customers:import.cols.taxOffice')}</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.customers.map((item: CustomerImportPreview, idx: number) => (
                    <tr key={idx} className={!item.isNew && skipExisting ? styles.skippedRow : ''}>
                      <td>
                        <Badge variant={item.isNew ? 'warning' : 'success'}>
                          {item.isNew ? t('customers:import.new') : t('customers:import.existing')}
                        </Badge>
                      </td>
                      <td>
                        {item.parsed.name}
                        {!item.isNew && item.matchedName && item.matchedName !== item.parsed.name && (
                          <span className={styles.matchedName}> &rarr; {item.matchedName}</span>
                        )}
                      </td>
                      <td>{item.parsed.phone || '-'}</td>
                      <td>{item.parsed.email || '-'}</td>
                      <td>{item.parsed.taxNumber || '-'}</td>
                      <td>{item.parsed.taxOffice || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className={styles.actions}>
            <Button variant="secondary" onClick={() => { setStep('upload'); setPreview(null); setFile(null); }}>
              {t('customers:import.back')}
            </Button>
            <Button onClick={handleConfirm} disabled={importing}>
              {t('customers:import.importButton', {
                count: skipExisting ? preview.summary.newCount : preview.summary.total,
              })}
            </Button>
          </div>
        </div>
      )}

      {/* Importing Step */}
      {step === 'importing' && (
        <div className={styles.uploadSection}>
          <div className={styles.uploadCard}>
            <div className={styles.spinner} />
            <h2 className={styles.uploadTitle}>{t('customers:import.importing')}</h2>
            <p className={styles.uploadDesc}>{t('customers:import.importingDesc')}</p>
          </div>
        </div>
      )}

      {/* Done Step */}
      {step === 'done' && result && (
        <div className={styles.uploadSection}>
          <div className={styles.uploadCard}>
            <div className={styles.successIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className={styles.uploadTitle}>{t('customers:import.doneTitle')}</h2>
            <div className={styles.resultGrid}>
              <div className={styles.resultItem}>
                <span className={styles.resultNumber}>{result.created}</span>
                <span className={styles.resultLabel}>{t('customers:import.created')}</span>
              </div>
              <div className={styles.resultItem}>
                <span className={styles.resultNumber}>{result.updated}</span>
                <span className={styles.resultLabel}>{t('customers:import.updated')}</span>
              </div>
              <div className={styles.resultItem}>
                <span className={styles.resultNumber}>{result.skipped}</span>
                <span className={styles.resultLabel}>{t('customers:import.skipped')}</span>
              </div>
            </div>
            <Button onClick={() => navigate('/customers')}>
              {t('customers:import.goToList')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
