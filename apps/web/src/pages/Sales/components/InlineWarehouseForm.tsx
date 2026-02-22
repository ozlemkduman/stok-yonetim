import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Input } from '@stok/ui';
import { Warehouse, CreateWarehouseData, warehousesApi } from '../../../api/warehouses.api';
import { useToast } from '../../../context/ToastContext';
import styles from '../SaleFormPage.module.css';

interface InlineWarehouseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (warehouse: Warehouse) => void;
}

export function InlineWarehouseForm({ isOpen, onClose, onCreated }: InlineWarehouseFormProps) {
  const { t } = useTranslation(['sales', 'common']);
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateWarehouseData>({
    name: '',
    code: '',
    address: '',
    phone: '',
    manager_name: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({ name: '', code: '', address: '', phone: '', manager_name: '' });
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = t('sales:inlineWarehouse.errors.nameRequired');
    if (!formData.code.trim()) newErrors.code = t('sales:inlineWarehouse.errors.codeRequired');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await warehousesApi.create(formData);
      const warehouse = response.data ?? response as unknown as Warehouse;
      showToast('success', t('sales:toast.warehouseCreated'));
      onCreated(warehouse);
      handleClose();
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : t('sales:toast.errorOccurred') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('sales:inlineWarehouse.title')}
      size="md"
      footer={
        <div className={styles.modalFooter}>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>{t('sales:inlineWarehouse.cancel')}</Button>
          <Button onClick={handleSubmit} loading={loading}>{t('sales:inlineWarehouse.save')}</Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className={styles.inlineForm}>
        {errors.form && <div className={styles.formError}>{errors.form}</div>}
        <div className={styles.inlineFormGrid}>
          <Input label={t('sales:inlineWarehouse.warehouseName')} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} error={errors.name} fullWidth />
          <Input label={t('sales:inlineWarehouse.warehouseCode')} value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} error={errors.code} fullWidth />
          <Input label={t('sales:inlineWarehouse.phone')} value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} fullWidth />
          <Input label={t('sales:inlineWarehouse.manager')} value={formData.manager_name || ''} onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })} fullWidth />
        </div>
        <Input label={t('sales:inlineWarehouse.address')} value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} fullWidth />
      </form>
    </Modal>
  );
}
