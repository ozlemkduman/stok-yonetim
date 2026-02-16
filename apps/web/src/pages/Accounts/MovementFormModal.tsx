import { useState } from 'react';
import { Modal, Input, Select, Button } from '@stok/ui';
import { CreateMovementData } from '../../api/accounts.api';
import { useToast } from '../../context/ToastContext';

interface MovementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMovementData) => Promise<void>;
  accountName: string;
}

const MOVEMENT_CATEGORIES = [
  { value: '', label: 'Kategori Sec' },
  { value: 'satis', label: 'Satis' },
  { value: 'tahsilat', label: 'Tahsilat' },
  { value: 'odeme', label: 'Odeme' },
  { value: 'maas', label: 'Maas' },
  { value: 'kira', label: 'Kira' },
  { value: 'fatura', label: 'Fatura' },
  { value: 'vergi', label: 'Vergi' },
  { value: 'diger', label: 'Diger' },
];

export function MovementFormModal({ isOpen, onClose, onSubmit, accountName }: MovementFormModalProps) {
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
      showToast('error', 'Tutar 0\'dan buyuk olmalidir');
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
      showToast('error', 'Hareket eklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const movementTypeOptions = [
    { value: 'gelir', label: 'Gelir (Giris)' },
    { value: 'gider', label: 'Gider (Cikis)' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Hareket Ekle - ${accountName}`}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Select
            label="Hareket Turu *"
            options={movementTypeOptions}
            value={formData.movement_type}
            onChange={(e) => setFormData({ ...formData, movement_type: e.target.value as 'gelir' | 'gider' })}
            fullWidth
          />

          <Input
            label="Tutar *"
            type="number"
            step="0.01"
            min="0.01"
            value={formData.amount || ''}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            required
            fullWidth
          />

          <Select
            label="Kategori"
            options={MOVEMENT_CATEGORIES}
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            fullWidth
          />

          <Input
            label="Aciklama"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            fullWidth
          />

          <Input
            label="Tarih"
            type="date"
            value={formData.movement_date}
            onChange={(e) => setFormData({ ...formData, movement_date: e.target.value })}
            fullWidth
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-6)' }}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Iptal
          </Button>
          <Button type="submit" loading={loading}>
            Ekle
          </Button>
        </div>
      </form>
    </Modal>
  );
}
