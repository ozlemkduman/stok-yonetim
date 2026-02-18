import { Button, Card, Input, Select } from '@stok/ui';
import { Warehouse } from '../../../api/warehouses.api';
import { WizardFormData } from '../wizard.types';
import styles from '../SaleFormPage.module.css';

const PAYMENT_METHODS = [
  { value: 'nakit', label: 'Nakit' },
  { value: 'kredi_karti', label: 'Kredi Karti' },
  { value: 'havale', label: 'Havale/EFT' },
  { value: 'veresiye', label: 'Veresiye' },
];

interface StepSettingsProps {
  data: WizardFormData;
  warehouses: Warehouse[];
  onDataChange: (updates: Partial<WizardFormData>) => void;
  onOpenWarehouseModal: () => void;
  veresiyeWarning: boolean;
}

export function StepSettings({
  data,
  warehouses,
  onDataChange,
  onOpenWarehouseModal,
  veresiyeWarning,
}: StepSettingsProps) {
  return (
    <div className={styles.stepContent}>
      <div className={styles.formGrid}>
        <Card className={styles.formCard}>
          <h3>Depo & Odeme</h3>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Depo *</label>
              <div className={styles.selectWithAction}>
                <Select
                  value={data.warehouseId}
                  onChange={(e) => onDataChange({ warehouseId: e.target.value })}
                  options={[
                    { value: '', label: 'Depo Secin' },
                    ...warehouses.map(w => ({ value: w.id, label: w.name })),
                  ]}
                  fullWidth
                />
                <Button type="button" size="sm" variant="secondary" onClick={onOpenWarehouseModal}>
                  + Yeni
                </Button>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Odeme Yontemi *</label>
              <Select
                value={data.paymentMethod}
                onChange={(e) => onDataChange({ paymentMethod: e.target.value })}
                options={PAYMENT_METHODS}
                fullWidth
              />
            </div>
          </div>

          {data.paymentMethod === 'veresiye' && (
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Vade Tarihi</label>
                <Input
                  type="date"
                  value={data.dueDate}
                  onChange={(e) => onDataChange({ dueDate: e.target.value })}
                  fullWidth
                />
              </div>
              <div className={styles.formGroup} />
            </div>
          )}

          {veresiyeWarning && (
            <div className={styles.warningBox}>
              Veresiye satis icin musteri secilmis olmalidir. Lutfen Adim 2'ye donerek musteri seciniz.
            </div>
          )}

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={data.includeVat}
                  onChange={(e) => onDataChange({ includeVat: e.target.checked })}
                />
                KDV Dahil
              </label>
            </div>
          </div>
        </Card>

        <Card className={styles.formCard}>
          <h3>Iskonto</h3>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Iskonto Orani (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={data.discountRate}
                onChange={(e) => onDataChange({ discountRate: Number(e.target.value), discountAmount: 0 })}
                fullWidth
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>veya Iskonto Tutari</label>
              <Input
                type="number"
                min="0"
                value={data.discountAmount}
                onChange={(e) => onDataChange({ discountAmount: Number(e.target.value), discountRate: 0 })}
                fullWidth
              />
            </div>
          </div>
        </Card>
      </div>

      <Card className={styles.formCard}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Notlar</label>
          <textarea
            className={styles.textarea}
            value={data.notes}
            onChange={(e) => onDataChange({ notes: e.target.value })}
            rows={3}
          />
        </div>
      </Card>
    </div>
  );
}
