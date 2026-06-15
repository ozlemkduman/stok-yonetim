import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Input, Button, Select, type SelectOption } from '@stok/ui';
import { ServiceOrder, RecordInvoiceData, InvoicePosting } from '../../api/autoService.api';
import { useToast } from '../../context/ToastContext';
import styles from './AutoService.module.css';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ServiceOrder | null;
  onSubmit: (data: RecordInvoiceData) => Promise<void>;
}

const POSTINGS: InvoicePosting[] = ['none', 'veresiye', 'nakit', 'kredi_karti', 'havale'];

export function InvoiceModal({ isOpen, onClose, order, onSubmit }: InvoiceModalProps) {
  const { t } = useTranslation('autoService');
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [number, setNumber] = useState('');
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState(0);
  const [fileUrl, setFileUrl] = useState('');
  const [posting, setPosting] = useState<InvoicePosting>('none');

  useEffect(() => {
    if (order) {
      setNumber(order.invoice_number || '');
      setDate(order.invoice_date ? order.invoice_date.split('T')[0] : '');
      setAmount(order.invoice_amount != null ? Number(order.invoice_amount) : Number(order.total_amount) || 0);
      setFileUrl(order.invoice_file_url || '');
      setPosting((order.posted_payment_method as InvoicePosting) || 'none');
    }
  }, [order, isOpen]);

  const postingOptions: SelectOption[] = POSTINGS.map((p) => ({ value: p, label: t(`invoice.postings.${p}`) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!number.trim()) return;
    setLoading(true);
    try {
      const payload: RecordInvoiceData = {
        invoice_number: number.trim(),
        invoice_amount: amount || 0,
        posting,
      };
      if (date) payload.invoice_date = date;
      if (fileUrl.trim()) payload.invoice_file_url = fileUrl.trim();
      await onSubmit(payload);
      showToast('success', t('invoice.toast.success'));
      onClose();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('invoice.toast.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={order ? t('invoice.title', { order: order.order_number }) : ''}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <p className={styles.muted} style={{ margin: 0 }}>{t('invoice.hint')}</p>

          <div className={styles.formRow}>
            <Input
              label={t('invoice.number')}
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              required
              fullWidth
            />
            <Input
              label={t('invoice.date')}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              fullWidth
            />
          </div>

          <div className={styles.formRow}>
            <Input
              label={t('invoice.amount')}
              type="number" step="0.01" min="0"
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              fullWidth
            />
            <Select
              label={t('invoice.posting')}
              options={postingOptions}
              value={posting}
              onChange={(e) => setPosting(e.target.value as InvoicePosting)}
              fullWidth
            />
          </div>

          <Input
            label={t('invoice.fileUrl')}
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            fullWidth
          />
        </div>

        <div className={styles.formActions}>
          <Button type="button" variant="ghost" onClick={onClose}>{t('invoice.cancel')}</Button>
          <Button type="submit" loading={loading} disabled={!number.trim()}>{t('invoice.save')}</Button>
        </div>
      </form>
    </Modal>
  );
}
