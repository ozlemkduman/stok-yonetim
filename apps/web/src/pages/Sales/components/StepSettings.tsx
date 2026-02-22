import { useTranslation } from 'react-i18next';
import { Button, Card, Input, Select } from '@stok/ui';
import { Warehouse } from '../../../api/warehouses.api';
import { WizardFormData } from '../wizard.types';
import styles from '../SaleFormPage.module.css';

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
  const { t } = useTranslation(['sales', 'common']);

  const PAYMENT_METHODS = [
    { value: 'nakit', label: t('sales:stepSettings.paymentMethods.nakit') },
    { value: 'kredi_karti', label: t('sales:stepSettings.paymentMethods.kredi_karti') },
    { value: 'havale', label: t('sales:stepSettings.paymentMethods.havale') },
    { value: 'veresiye', label: t('sales:stepSettings.paymentMethods.veresiye') },
  ];

  return (
    <div className={styles.stepContent}>
      <div className={styles.formGrid}>
        <Card className={styles.formCard}>
          <h3>{t('sales:stepSettings.warehousePayment')}</h3>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>{t('sales:stepSettings.warehouseLabel')}</label>
              <div className={styles.selectWithAction}>
                <Select
                  value={data.warehouseId}
                  onChange={(e) => onDataChange({ warehouseId: e.target.value })}
                  options={[
                    { value: '', label: t('sales:stepSettings.selectWarehouse') },
                    ...warehouses.map(w => ({ value: w.id, label: w.name })),
                  ]}
                  fullWidth
                />
                <Button type="button" size="sm" variant="secondary" onClick={onOpenWarehouseModal}>
                  {t('sales:stepSettings.newWarehouse')}
                </Button>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>{t('sales:stepSettings.paymentMethodLabel')}</label>
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
                <label className={styles.label}>{t('sales:stepSettings.dueDateLabel')}</label>
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
              {t('sales:stepSettings.veresiyeWarning')}
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
                {t('sales:stepSettings.vatIncluded')}
              </label>
            </div>
          </div>
        </Card>

        <Card className={styles.formCard}>
          <h3>{t('sales:stepSettings.discount')}</h3>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>{t('sales:stepSettings.discountRate')}</label>
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
              <label className={styles.label}>{t('sales:stepSettings.orDiscountAmount')}</label>
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
          <label className={styles.label}>{t('sales:stepSettings.notes')}</label>
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
