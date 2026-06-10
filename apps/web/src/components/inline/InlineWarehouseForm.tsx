import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Input } from '@stok/ui';
import { Warehouse, CreateWarehouseData, warehousesApi } from '../../api/warehouses.api';
import { useToast } from '../../context/ToastContext';
import styles from './InlineEntityForm.module.css';

interface InlineWarehouseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (warehouse: Warehouse) => void;
}

const EMPTY: CreateWarehouseData = { name: '', code: '', address: '', phone: '', manager_name: '' };

/** Form içinden ayrılmadan hızlı depo oluşturma modalı. */
export function InlineWarehouseForm({ isOpen, onClose, onCreated }: InlineWarehouseFormProps) {
  const { t } = useTranslation('common');
  const { showToast } = useToast();
  const [form, setForm] = useState<CreateWarehouseData>({ ...EMPTY });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const close = () => {
    setForm({ ...EMPTY });
    setErrors({});
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = t('inlineEntity.nameRequired');
    if (!form.code.trim()) errs.code = t('inlineEntity.codeRequired');
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const res = await warehousesApi.create(form);
      const created = (res.data ?? (res as unknown)) as Warehouse;
      showToast('success', t('inlineEntity.warehouseCreated'));
      onCreated(created);
      close();
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : t('inlineEntity.errorOccurred') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={close}
      title={t('inlineEntity.newWarehouse')}
      size="md"
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" onClick={close} disabled={loading}>{t('inlineEntity.cancel')}</Button>
          <Button onClick={handleSubmit} loading={loading}>{t('inlineEntity.save')}</Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {errors.form && <div className={styles.formError}>{errors.form}</div>}
        <div className={styles.grid}>
          <Input label={t('inlineEntity.warehouseName')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} fullWidth />
          <Input label={t('inlineEntity.warehouseCode')} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} error={errors.code} fullWidth />
          <Input label={t('inlineEntity.phone')} value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} fullWidth />
          <Input label={t('inlineEntity.manager')} value={form.manager_name || ''} onChange={(e) => setForm({ ...form, manager_name: e.target.value })} fullWidth />
          <Input label={t('inlineEntity.address')} value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} fullWidth />
        </div>
      </form>
    </Modal>
  );
}
