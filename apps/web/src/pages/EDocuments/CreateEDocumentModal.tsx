import { useState, useEffect } from 'react';
import { Button, Select, Card } from '@stok/ui';
import { CreateEDocumentData, eDocumentsApi } from '../../api/e-documents.api';
import { salesApi } from '../../api/sales.api';
import { returnsApi } from '../../api/returns.api';
import { useToast } from '../../context/ToastContext';
import styles from './CreateEDocumentModal.module.css';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

interface Reference {
  id: string;
  number: string;
  date: string;
  total: number;
  customer_name?: string | null;
}

const DOCUMENT_TYPES = [
  { value: 'e_fatura', label: 'e-Fatura' },
  { value: 'e_arsiv', label: 'e-Arsiv Fatura' },
  { value: 'e_ihracat', label: 'e-Ihracat Faturasi' },
  { value: 'e_irsaliye', label: 'e-Irsaliye' },
  { value: 'e_smm', label: 'e-SMM' },
];

const REFERENCE_TYPES = [
  { value: 'sale', label: 'Satis' },
  { value: 'return', label: 'Iade' },
];

export function CreateEDocumentModal({ onClose, onSuccess }: Props) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [documentType, setDocumentType] = useState<CreateEDocumentData['document_type']>('e_fatura');
  const [referenceType, setReferenceType] = useState<CreateEDocumentData['reference_type']>('sale');
  const [referenceId, setReferenceId] = useState('');
  const [notes, setNotes] = useState('');

  const [references, setReferences] = useState<Reference[]>([]);

  useEffect(() => {
    const loadReferences = async () => {
      setLoading(true);
      try {
        if (referenceType === 'sale') {
          const response = await salesApi.getAll({ limit: 100 });
          setReferences(response.data.map(s => ({
            id: s.id,
            number: s.invoice_number,
            date: s.sale_date,
            total: s.grand_total,
            customer_name: s.customer_name,
          })));
        } else if (referenceType === 'return') {
          const response = await returnsApi.getAll({ limit: 100 });
          setReferences(response.data.map(r => ({
            id: r.id,
            number: r.return_number,
            date: r.return_date,
            total: r.total_amount,
            customer_name: r.customer_name,
          })));
        }
        setReferenceId('');
      } catch (err) {
        showToast('error', 'Referanslar yuklenemedi');
      } finally {
        setLoading(false);
      }
    };

    loadReferences();
  }, [referenceType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!referenceId) {
      showToast('error', 'Lutfen bir referans secin');
      return;
    }

    setSaving(true);
    try {
      await eDocumentsApi.create({
        document_type: documentType,
        reference_type: referenceType,
        reference_id: referenceId,
        notes: notes || undefined,
      });
      showToast('success', 'e-Belge olusturuldu');
      onSuccess();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'e-Belge olusturulamadi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Yeni e-Belge Olustur</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.body}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Belge Turu *</label>
              <Select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as CreateEDocumentData['document_type'])}
                options={DOCUMENT_TYPES}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Referans Turu *</label>
              <Select
                value={referenceType}
                onChange={(e) => setReferenceType(e.target.value as CreateEDocumentData['reference_type'])}
                options={REFERENCE_TYPES}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Referans *</label>
              {loading ? (
                <p className={styles.loading}>Yukleniyor...</p>
              ) : (
                <Select
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  options={[
                    { value: '', label: 'Referans Secin' },
                    ...references.map(r => ({
                      value: r.id,
                      label: `${r.number} - ${r.customer_name || 'Isimsiz'} - ${new Date(r.date).toLocaleDateString('tr-TR')}`,
                    })),
                  ]}
                />
              )}
            </div>

            {referenceId && (
              <Card className={styles.selectedInfo}>
                {(() => {
                  const ref = references.find(r => r.id === referenceId);
                  if (!ref) return null;
                  return (
                    <>
                      <p><strong>Belge No:</strong> {ref.number}</p>
                      <p><strong>Tarih:</strong> {new Date(ref.date).toLocaleDateString('tr-TR')}</p>
                      <p><strong>Musteri:</strong> {ref.customer_name || 'Belirtilmemis'}</p>
                      <p><strong>Tutar:</strong> {ref.total.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</p>
                    </>
                  );
                })()}
              </Card>
            )}

            <div className={styles.formGroup}>
              <label className={styles.label}>Notlar</label>
              <textarea
                className={styles.textarea}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Opsiyonel notlar..."
              />
            </div>
          </div>

          <div className={styles.footer}>
            <Button type="button" variant="ghost" onClick={onClose}>
              Iptal
            </Button>
            <Button type="submit" disabled={saving || !referenceId}>
              {saving ? 'Olusturuluyor...' : 'e-Belge Olustur'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
