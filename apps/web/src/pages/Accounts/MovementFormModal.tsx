import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Input, Select, Button } from '@stok/ui';
import { CreateMovementData } from '../../api/accounts.api';
import { useToast } from '../../context/ToastContext';

interface MovementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMovementData) => Promise<void>;
  accountName: string;
}

export function MovementFormModal({ isOpen, onClose, onSubmit, accountName }: MovementFormModalProps) {
  const { t } = useTranslation(['accounts', 'common']);
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateMovementData>({
    movement_type: 'gelir',
    amount: 0,
    category: '',
    description: '',
    movement_date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) {
      showToast('error', t('accounts:toast.amountError'));
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      setFormData({
        movement_type: 'gelir',
        amount: 0,
        category: '',
        description: '',
        movement_date: new Date().toISOString().split('T')[0],
      });
      onClose();
    } catch (error) {
      showToast('error', t('accounts:toast.movementFailed'));
    } finally {
      setLoading(false);
    }
  };

  const movementTypeOptions = [
    { value: 'gelir', label: t('accounts:movementForm.typeIncome') },
    { value: 'gider', label: t('accounts:movementForm.typeExpense') },
  ];

  const movementCategories = [
    { value: '', label: t('accounts:movementCategories.select') },
    { value: 'satis', label: t('accounts:movementCategories.satis') },
    { value: 'tahsilat', label: t('accounts:movementCategories.tahsilat') },
    { value: 'odeme', label: t('accounts:movementCategories.odeme') },
    { value: 'maas', label: t('accounts:movementCategories.maas') },
    { value: 'kira', label: t('accounts:movementCategories.kira') },
    { value: 'fatura', label: t('accounts:movementCategories.fatura') },
    { value: 'vergi', label: t('accounts:movementCategories.vergi') },
    { value: 'diger', label: t('accounts:movementCategories.diger') },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('accounts:movementForm.title', { name: accountName })}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Select
            label={t('accounts:movementForm.movementType')}
            options={movementTypeOptions}
            value={formData.movement_type}
            onChange={(e) => setFormData({ ...formData, movement_type: e.target.value as 'gelir' | 'gider' })}
            fullWidth
          />

          <Input
            label={t('accounts:movementForm.amount')}
            type="number"
            step="0.01"
            min="0.01"
            value={formData.amount || ''}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            required
            fullWidth
          />

          <Select
            label={t('accounts:movementForm.category')}
            options={movementCategories}
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            fullWidth
          />

          <Input
            label={t('accounts:movementForm.description')}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            fullWidth
          />

          <Input
            label={t('accounts:movementForm.date')}
            type="date"
            value={formData.movement_date}
            onChange={(e) => setFormData({ ...formData, movement_date: e.target.value })}
            fullWidth
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-6)' }}>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('accounts:movementForm.cancel')}
          </Button>
          <Button type="submit" loading={loading}>
            {t('accounts:movementForm.submit')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
