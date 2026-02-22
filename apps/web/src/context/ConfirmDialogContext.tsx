import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button } from '@stok/ui';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
}

interface ConfirmDialogContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ message: '' });
  const resolveRef = useRef<(value: boolean) => void>();

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    resolveRef.current?.(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    resolveRef.current?.(false);
  };

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}
      <Modal
        isOpen={isOpen}
        onClose={handleCancel}
        title={options.title || t('confirm.title')}
        size="sm"
        footer={
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={handleCancel}>
              {options.cancelText || t('confirm.defaultCancel')}
            </Button>
            <Button
              variant={options.variant === 'danger' ? 'danger' : 'primary'}
              onClick={handleConfirm}
            >
              {options.confirmText || t('confirm.defaultConfirm')}
            </Button>
          </div>
        }
      >
        <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>{options.message}</p>
      </Modal>
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirmDialog must be used within ConfirmDialogProvider');
  }
  return context;
}
