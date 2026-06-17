import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Input, Button, Select, type SelectOption } from '@stok/ui';
import { Vehicle, CreateVehicleData } from '../../api/autoService.api';
import { customersApi, CreateCustomerData } from '../../api/customers.api';
import { useToast } from '../../context/ToastContext';
import { SelectWithAdd } from '../../components/inline';
import { CustomerFormModal } from '../Customers/CustomerFormModal';
import styles from './AutoService.module.css';

interface VehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateVehicleData) => Promise<void>;
  vehicle: Vehicle | null;
}

const FUEL_KEYS = ['benzin', 'dizel', 'lpg', 'elektrik', 'hibrit'];

const emptyForm: CreateVehicleData = {
  plate: '', customer_id: '', brand: '', model: '', model_year: undefined,
  vin: '', engine_no: '', color: '', fuel_type: '', mileage: undefined, notes: '',
};

export function VehicleFormModal({ isOpen, onClose, onSubmit, vehicle }: VehicleFormModalProps) {
  const { t } = useTranslation('autoService');
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateVehicleData>(emptyForm);
  const [customers, setCustomers] = useState<SelectOption[]>([]);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    customersApi.getAll({ limit: 200, isActive: true })
      .then((res) => setCustomers(res.data.map((c) => ({ value: c.id, label: c.name }))))
      .catch(() => setCustomers([]));
  }, [isOpen]);

  useEffect(() => {
    if (vehicle) {
      setFormData({
        plate: vehicle.plate,
        customer_id: vehicle.customer_id || '',
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        model_year: vehicle.model_year ?? undefined,
        vin: vehicle.vin || '',
        engine_no: vehicle.engine_no || '',
        color: vehicle.color || '',
        fuel_type: vehicle.fuel_type || '',
        mileage: vehicle.mileage ?? undefined,
        notes: vehicle.notes || '',
      });
    } else {
      setFormData(emptyForm);
    }
  }, [vehicle, isOpen]);

  const fuelOptions: SelectOption[] = [
    { value: '', label: t('vehicles.fuelTypes.none') },
    ...FUEL_KEYS.map((k) => ({ value: k, label: t(`vehicles.fuelTypes.${k}`) })),
  ];
  const customerOptions: SelectOption[] = [
    { value: '', label: t('vehicles.form.selectCustomer') },
    ...customers,
  ];

  const handleCreateCustomer = async (data: CreateCustomerData) => {
    const res = await customersApi.create(data);
    const created = res.data;
    setCustomers((prev) => [{ value: created.id, label: created.name }, ...prev]);
    setFormData((prev) => ({ ...prev, customer_id: created.id }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: CreateVehicleData = { plate: formData.plate.trim() };
      if (formData.customer_id) payload.customer_id = formData.customer_id;
      if (formData.brand?.trim()) payload.brand = formData.brand.trim();
      if (formData.model?.trim()) payload.model = formData.model.trim();
      if (formData.model_year != null && !Number.isNaN(formData.model_year)) payload.model_year = formData.model_year;
      if (formData.vin?.trim()) payload.vin = formData.vin.trim();
      if (formData.engine_no?.trim()) payload.engine_no = formData.engine_no.trim();
      if (formData.color?.trim()) payload.color = formData.color.trim();
      if (formData.fuel_type) payload.fuel_type = formData.fuel_type;
      if (formData.mileage != null && !Number.isNaN(formData.mileage)) payload.mileage = formData.mileage;
      if (formData.notes?.trim()) payload.notes = formData.notes.trim();

      await onSubmit(payload);
      onClose();
    } catch {
      showToast('error', t('vehicles.toast.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vehicle ? t('vehicles.form.editTitle') : t('vehicles.form.createTitle')}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <div className={styles.formRow}>
            <Input
              label={t('vehicles.form.plate')}
              value={formData.plate}
              onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
              required
              fullWidth
            />
            <div style={{ width: '100%', minWidth: 0 }}>
              <SelectWithAdd
                label={t('vehicles.form.customer')}
                options={customerOptions}
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                onAdd={() => setCustomerModalOpen(true)}
                addTitle={t('vehicles.form.addCustomer')}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <Input
              label={t('vehicles.form.brand')}
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              fullWidth
            />
            <Input
              label={t('vehicles.form.model')}
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              fullWidth
            />
          </div>

          <div className={styles.formRow}>
            <Input
              label={t('vehicles.form.modelYear')}
              type="number"
              min="1900"
              max="2100"
              value={formData.model_year ?? ''}
              onChange={(e) => setFormData({ ...formData, model_year: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
              fullWidth
            />
            <Select
              label={t('vehicles.form.fuelType')}
              options={fuelOptions}
              value={formData.fuel_type}
              onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
              fullWidth
            />
            <Input
              label={t('vehicles.form.mileage')}
              type="number"
              min="0"
              value={formData.mileage ?? ''}
              onChange={(e) => setFormData({ ...formData, mileage: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
              fullWidth
            />
          </div>

          <div className={styles.formRow}>
            <Input
              label={t('vehicles.form.vin')}
              value={formData.vin}
              onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
              fullWidth
            />
            <Input
              label={t('vehicles.form.engineNo')}
              value={formData.engine_no}
              onChange={(e) => setFormData({ ...formData, engine_no: e.target.value })}
              fullWidth
            />
            <Input
              label={t('vehicles.form.color')}
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              fullWidth
            />
          </div>

          <Input
            label={t('vehicles.form.notes')}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            fullWidth
          />
        </div>

        <div className={styles.formActions}>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('vehicles.form.cancel')}
          </Button>
          <Button type="submit" loading={loading}>
            {vehicle ? t('vehicles.form.update') : t('vehicles.form.create')}
          </Button>
        </div>
      </form>
    </Modal>

    <CustomerFormModal
      isOpen={customerModalOpen}
      onClose={() => setCustomerModalOpen(false)}
      onSubmit={handleCreateCustomer}
      customer={null}
    />
    </>
  );
}
