import { useState, useEffect } from 'react';
import { Modal, Input, Select, Button } from '@stok/ui';
import { Account, CreateTransferData, accountsApi } from '../../api/accounts.api';
import { useToast } from '../../context/ToastContext';

interface TransferFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTransferData) => Promise<void>;
}

export function TransferFormModal({ isOpen, onClose, onSubmit }: TransferFormModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [formData, setFormData] = useState<CreateTransferData>({
    from_account_id: '',
    to_account_id: '',
    amount: 0,
    description: '',
    transfer_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (isOpen) {
      loadAccounts();
    }
  }, [isOpen]);

  const loadAccounts = async () => {
    try {
      const response = await accountsApi.getAll({ isActive: true, limit: 100 });
      setAccounts(response.data);
    } catch (error) {
      showToast('error', 'Hesaplar yuklenemedi');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.from_account_id || !formData.to_account_id) {
      showToast('error', 'Lutfen kaynak ve hedef hesaplari secin');
      return;
    }

    if (formData.from_account_id === formData.to_account_id) {
      showToast('error', 'Kaynak ve hedef hesaplar ayni olamaz');
      return;
    }

    if (formData.amount <= 0) {
      showToast('error', 'Tutar 0\'dan buyuk olmalidir');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      setFormData({
        from_account_id: '',
        to_account_id: '',
        amount: 0,
        description: '',
        transfer_date: new Date().toISOString().split('T')[0],
      });
      onClose();
    } catch (error) {
      showToast('error', 'Transfer yapilamadi');
    } finally {
      setLoading(false);
    }
  };

  const accountOptions = [
    { value: '', label: 'Hesap Sec' },
    ...accounts.map((acc) => ({
      value: acc.id,
      label: `${acc.name} (${acc.account_type === 'kasa' ? 'Kasa' : 'Banka'})`,
    })),
  ];

  const fromAccount = accounts.find((a) => a.id === formData.from_account_id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hesaplar Arasi Transfer"
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Select
            label="Kaynak Hesap *"
            options={accountOptions}
            value={formData.from_account_id}
            onChange={(e) => setFormData({ ...formData, from_account_id: e.target.value })}
            fullWidth
          />
          {fromAccount && (
            <p style={{ margin: '-8px 0 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
              Mevcut bakiye: {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(fromAccount.current_balance)}
            </p>
          )}

          <Select
            label="Hedef Hesap *"
            options={accountOptions.filter((opt) => opt.value !== formData.from_account_id)}
            value={formData.to_account_id}
            onChange={(e) => setFormData({ ...formData, to_account_id: e.target.value })}
            fullWidth
          />

          <Input
            label="Transfer Tutari *"
            type="number"
            step="0.01"
            min="0.01"
            max={fromAccount?.current_balance}
            value={formData.amount || ''}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            required
            fullWidth
          />

          <Input
            label="Aciklama"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            fullWidth
          />

          <Input
            label="Transfer Tarihi"
            type="date"
            value={formData.transfer_date}
            onChange={(e) => setFormData({ ...formData, transfer_date: e.target.value })}
            fullWidth
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-6)' }}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Iptal
          </Button>
          <Button type="submit" loading={loading}>
            Transfer Yap
          </Button>
        </div>
      </form>
    </Modal>
  );
}
