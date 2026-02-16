import { useState, useEffect } from 'react';
import { Modal, Input, Button } from '@stok/ui';
import { Warehouse, CreateWarehouseData } from '../../api/warehouses.api';
import { useToast } from '../../context/ToastContext';

interface WarehouseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateWarehouseData) => Promise<void>;
  warehouse: Warehouse | null;
}

export function WarehouseFormModal({ isOpen, onClose, onSubmit, warehouse }: WarehouseFormModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateWarehouseData>({
    name: '',
    code: '',
    address: '',
    phone: '',
    manager_name: '',
    is_default: false,
  });

  useEffect(() => {
    if (warehouse) {
      setFormData({
        name: warehouse.name,
        code: warehouse.code,
        address: warehouse.address || '',
        phone: warehouse.phone || '',
        manager_name: warehouse.manager_name || '',
        is_default: warehouse.is_default,
      });
    } else {
      setFormData({
        name: '',
        code: '',
        address: '',
        phone: '',
        manager_name: '',
        is_default: false,
      });
    }
  }, [warehouse, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      showToast('error', 'Depo kaydedilemedi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={warehouse ? 'Depo Duzenle' : 'Yeni Depo'}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input
            label="Depo Adi *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            fullWidth
          />

          <Input
            label="Depo Kodu *"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="Ornek: DEPO01"
            required
            disabled={!!warehouse}
            fullWidth
          />

          <Input
            label="Adres"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            fullWidth
          />

          <Input
            label="Telefon"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            fullWidth
          />

          <Input
            label="Sorumlu Kisi"
            value={formData.manager_name}
            onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
            fullWidth
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.is_default}
              onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
            />
            <span>Varsayilan depo olarak ayarla</span>
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-6)' }}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Iptal
          </Button>
          <Button type="submit" loading={loading}>
            {warehouse ? 'Guncelle' : 'Olustur'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
