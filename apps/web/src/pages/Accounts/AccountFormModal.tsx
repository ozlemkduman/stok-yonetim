import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Input, Select, Button } from '@stok/ui';
import { Account, CreateAccountData } from '../../api/accounts.api';
import { useToast } from '../../context/ToastContext';

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAccountData) => Promise<void>;
  account: Account | null;
}

export function AccountFormModal({ isOpen, onClose, onSubmit, account }: AccountFormModalProps) {
  const { t } = useTranslation(['accounts', 'common']);
  const { showToast } = useToast();
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
      showToast('error', t('accounts:toast.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  const accountTypeOptions = [
    { value: 'kasa', label: t('accounts:accountTypes.kasa') },
    { value: 'banka', label: t('accounts:accountTypes.banka') },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={account ? t('accounts:form.editTitle') : t('accounts:form.createTitle')}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input
            label={t('accounts:form.accountName')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            fullWidth
          />

          <Select
            label={t('accounts:form.accountType')}
            options={accountTypeOptions}
            value={formData.account_type}
            onChange={(e) => setFormData({ ...formData, account_type: e.target.value as 'kasa' | 'banka' })}
            disabled={!!account}
            fullWidth
          />

          {formData.account_type === 'banka' && (
            <>
              <Input
                label={t('accounts:form.bankName')}
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                fullWidth
              />

              <Input
                label={t('accounts:form.iban')}
                value={formData.iban}
                onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                placeholder={t('accounts:form.ibanPlaceholder')}
                fullWidth
              />

              <Input
                label={t('accounts:form.accountNumber')}
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                fullWidth
              />

              <Input
                label={t('accounts:form.branchName')}
                value={formData.branch_name}
                onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                fullWidth
              />
            </>
          )}

          {!account && (
            <Input
              label={t('accounts:form.openingBalance')}
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
            <span>{t('accounts:form.setDefault')}</span>
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-6)' }}>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('accounts:form.cancel')}
          </Button>
          <Button type="submit" loading={loading}>
            {account ? t('accounts:form.update') : t('accounts:form.create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
