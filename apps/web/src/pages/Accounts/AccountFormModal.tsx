import { useState, useEffect } from 'react';
import { Modal, Input, Select, Button } from '@stok/ui';
import { Account, CreateAccountData } from '../../api/accounts.api';

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAccountData) => Promise<void>;
  account: Account | null;
}

export function AccountFormModal({ isOpen, onClose, onSubmit, account }: AccountFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateAccountData>({
    name: '',
    account_type: 'kasa',
    bank_name: '',
    iban: '',
    account_number: '',
    branch_name: '',
    currency: 'TRY',
    opening_balance: 0,
    is_default: false,
  });

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name,
        account_type: account.account_type,
        bank_name: account.bank_name || '',
        iban: account.iban || '',
        account_number: account.account_number || '',
        branch_name: account.branch_name || '',
        currency: account.currency,
        opening_balance: account.opening_balance,
        is_default: account.is_default,
      });
    } else {
      setFormData({
        name: '',
        account_type: 'kasa',
        bank_name: '',
        iban: '',
        account_number: '',
        branch_name: '',
        currency: 'TRY',
        opening_balance: 0,
        is_default: false,
      });
    }
  }, [account, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Form submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  const accountTypeOptions = [
    { value: 'kasa', label: 'Kasa' },
    { value: 'banka', label: 'Banka' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={account ? 'Hesap Duzenle' : 'Yeni Hesap'}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input
            label="Hesap Adi *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            fullWidth
          />

          <Select
            label="Hesap Turu *"
            options={accountTypeOptions}
            value={formData.account_type}
            onChange={(e) => setFormData({ ...formData, account_type: e.target.value as 'kasa' | 'banka' })}
            disabled={!!account}
            fullWidth
          />

          {formData.account_type === 'banka' && (
            <>
              <Input
                label="Banka Adi"
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                fullWidth
              />

              <Input
                label="IBAN"
                value={formData.iban}
                onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                placeholder="TR00 0000 0000 0000 0000 0000 00"
                fullWidth
              />

              <Input
                label="Hesap Numarasi"
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                fullWidth
              />

              <Input
                label="Sube Adi"
                value={formData.branch_name}
                onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                fullWidth
              />
            </>
          )}

          {!account && (
            <Input
              label="Acilis Bakiyesi"
              type="number"
              step="0.01"
              min="0"
              value={formData.opening_balance}
              onChange={(e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) || 0 })}
              fullWidth
            />
          )}

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.is_default}
              onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
            />
            <span>Varsayilan hesap olarak ayarla</span>
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-6)' }}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Iptal
          </Button>
          <Button type="submit" loading={loading}>
            {account ? 'Guncelle' : 'Olustur'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
