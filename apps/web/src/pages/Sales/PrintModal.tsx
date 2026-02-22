import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import { Button, Modal } from '@stok/ui';
import { SaleDetail } from '../../api/sales.api';
import { InvoicePrintView } from './InvoicePrintView';
import { ReceiptPrintView } from './ReceiptPrintView';
import styles from './PrintModal.module.css';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SaleDetail;
}

type PrintType = 'invoice' | 'receipt';

export function PrintModal({ isOpen, onClose, data }: PrintModalProps) {
  const { t } = useTranslation(['sales']);
  const [printType, setPrintType] = useState<PrintType>('invoice');
  const invoiceRef = useRef<HTMLDivElement>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrintInvoice = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: t('sales:print.documentTitleInvoice', { number: data.invoice_number }),
  });

  const handlePrintReceipt = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: t('sales:print.documentTitleReceipt', { number: data.invoice_number }),
  });

  const handlePrint = () => {
    if (printType === 'invoice') {
      handlePrintInvoice();
    } else {
      handlePrintReceipt();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('sales:print.title')} size="lg">
      <div className={styles.container}>
        {/* Print Type Selection */}
        <div className={styles.typeSelector}>
          <button
            className={`${styles.typeButton} ${printType === 'invoice' ? styles.active : ''}`}
            onClick={() => setPrintType('invoice')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <line x1="10" y1="9" x2="8" y2="9" />
            </svg>
            <span>{t('sales:print.invoiceType')}</span>
            <small>{t('sales:print.invoiceDesc')}</small>
          </button>
          <button
            className={`${styles.typeButton} ${printType === 'receipt' ? styles.active : ''}`}
            onClick={() => setPrintType('receipt')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
              <line x1="8" y1="6" x2="16" y2="6" />
              <line x1="8" y1="10" x2="16" y2="10" />
              <line x1="8" y1="14" x2="12" y2="14" />
            </svg>
            <span>{t('sales:print.receiptType')}</span>
            <small>{t('sales:print.receiptDesc')}</small>
          </button>
        </div>

        {/* Preview */}
        <div className={styles.preview}>
          <div className={styles.previewScroll}>
            <div style={{ display: printType === 'invoice' ? 'block' : 'none' }}>
              <InvoicePrintView ref={invoiceRef} data={data} />
            </div>
            <div style={{ display: printType === 'receipt' ? 'block' : 'none' }}>
              <ReceiptPrintView ref={receiptRef} data={data} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <Button variant="ghost" onClick={onClose}>
            {t('sales:print.close')}
          </Button>
          <Button onClick={handlePrint}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, marginRight: 8 }}>
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            {t('sales:print.printButton')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
