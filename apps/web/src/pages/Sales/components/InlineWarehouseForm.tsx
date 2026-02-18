import { useState } from 'react';
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
    if (!formData.name.trim()) newErrors.name = 'Depo adi zorunludur';
    if (!formData.code.trim()) newErrors.code = 'Depo kodu zorunludur';
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
      showToast('success', 'Depo olusturuldu');
      onCreated(warehouse);
      handleClose();
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'Hata olustu' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Yeni Depo"
      size="md"
      footer={
        <div className={styles.modalFooter}>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>Iptal</Button>
          <Button onClick={handleSubmit} loading={loading}>Kaydet</Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className={styles.inlineForm}>
        {errors.form && <div className={styles.formError}>{errors.form}</div>}
        <div className={styles.inlineFormGrid}>
          <Input label="Depo Adi *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} error={errors.name} fullWidth />
          <Input label="Depo Kodu *" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} error={errors.code} fullWidth />
          <Input label="Telefon" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} fullWidth />
          <Input label="Sorumlu" value={formData.manager_name || ''} onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })} fullWidth />
        </div>
        <Input label="Adres" value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} fullWidth />
      </form>
    </Modal>
  );
}
