import { useState, useEffect, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['warehouses', 'common']);
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
      showToast('error', t('warehouses:toast.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={warehouse ? t('warehouses:form.editTitle') : t('warehouses:form.createTitle')}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input
            label={t('warehouses:form.warehouseName')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            fullWidth
          />

          <Input
            label={t('warehouses:form.warehouseCode')}
            value={formData.code}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder={t('warehouses:form.codePlaceholder')}
            required
            disabled={!!warehouse}
            fullWidth
          />

          <Input
            label={t('warehouses:form.address')}
            value={formData.address}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, address: e.target.value })}
            fullWidth
          />

          <Input
            label={t('warehouses:form.phone')}
            value={formData.phone}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })}
            fullWidth
          />

          <Input
            label={t('warehouses:form.manager')}
            value={formData.manager_name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, manager_name: e.target.value })}
            fullWidth
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.is_default}
              onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
            />
            <span>{t('warehouses:form.setDefault')}</span>
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-6)' }}>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('warehouses:form.cancel')}
          </Button>
          <Button type="submit" loading={loading}>
            {warehouse ? t('warehouses:form.update') : t('warehouses:form.create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
