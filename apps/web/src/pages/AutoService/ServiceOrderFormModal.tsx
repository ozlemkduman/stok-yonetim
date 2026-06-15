import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Input, Button, Select, type SelectOption } from '@stok/ui';
import {
  ServiceOrder, CreateServiceOrderData, ServiceOrderStatus, autoServiceApi,
} from '../../api/autoService.api';
import { employeesApi } from '../../api/employees.api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import styles from './AutoService.module.css';

interface ServiceOrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateServiceOrderData) => Promise<void>;
  order: ServiceOrder | null;
  presetVehicleId?: string; // Servis geçmişinden açıldığında aracı sabitler
}

const STATUSES: ServiceOrderStatus[] = ['open', 'in_progress', 'completed', 'delivered', 'cancelled'];

interface FormState {
  vehicle_id: string;
  assigned_employee_id: string;
  status: ServiceOrderStatus;
  mileage_in?: number;
  complaint: string;
  diagnosis: string;
  labor_cost: number;
  parts_cost: number;
  discount: number;
  notes: string;
}

const emptyForm: FormState = {
  vehicle_id: '', assigned_employee_id: '', status: 'open', mileage_in: undefined,
  complaint: '', diagnosis: '', labor_cost: 0, parts_cost: 0, discount: 0, notes: '',
};

export function ServiceOrderFormModal({ isOpen, onClose, onSubmit, order, presetVehicleId }: ServiceOrderFormModalProps) {
  const { t } = useTranslation('autoService');
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormState>(emptyForm);
  const [vehicles, setVehicles] = useState<SelectOption[]>([]);
  const [employees, setEmployees] = useState<SelectOption[]>([]);

  const isEdit = !!order;
  const vehicleLocked = isEdit || !!presetVehicleId;

  useEffect(() => {
    if (!isOpen) return;
    autoServiceApi.vehicles.getAll({ limit: 500, isActive: 'true' })
      .then((res) => setVehicles(res.data.map((v) => ({ value: v.id, label: `${v.plate}${v.brand ? ` — ${v.brand} ${v.model || ''}`.trimEnd() : ''}` }))))
      .catch(() => setVehicles([]));
    employeesApi.getAll({ limit: 200, isActive: 'true' })
      .then((res) => setEmployees(res.data.map((e) => ({ value: e.id, label: e.name }))))
      .catch(() => setEmployees([]));
  }, [isOpen]);

  useEffect(() => {
    if (order) {
      setFormData({
        vehicle_id: order.vehicle_id,
        assigned_employee_id: order.assigned_employee_id || '',
        status: order.status,
        mileage_in: order.mileage_in ?? undefined,
        complaint: order.complaint || '',
        diagnosis: order.diagnosis || '',
        labor_cost: Number(order.labor_cost) || 0,
        parts_cost: Number(order.parts_cost) || 0,
        discount: Number(order.discount) || 0,
        notes: order.notes || '',
      });
    } else {
      setFormData({ ...emptyForm, vehicle_id: presetVehicleId || '' });
    }
  }, [order, presetVehicleId, isOpen]);

  const total = useMemo(
    () => Math.max(0, (formData.labor_cost || 0) + (formData.parts_cost || 0) - (formData.discount || 0)),
    [formData.labor_cost, formData.parts_cost, formData.discount],
  );

  const vehicleOptions: SelectOption[] = [{ value: '', label: t('orders.form.selectVehicle') }, ...vehicles];
  const employeeOptions: SelectOption[] = [{ value: '', label: t('orders.form.selectEmployee') }, ...employees];
  const statusOptions: SelectOption[] = STATUSES.map((s) => ({ value: s, label: t(`orders.status.${s}`) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicle_id) return;
    setLoading(true);
    try {
      const payload: CreateServiceOrderData = {
        vehicle_id: formData.vehicle_id,
        status: formData.status,
        labor_cost: formData.labor_cost || 0,
        parts_cost: formData.parts_cost || 0,
        discount: formData.discount || 0,
      };
      if (formData.assigned_employee_id) payload.assigned_employee_id = formData.assigned_employee_id;
      if (formData.mileage_in != null && !Number.isNaN(formData.mileage_in)) payload.mileage_in = formData.mileage_in;
      if (formData.complaint.trim()) payload.complaint = formData.complaint.trim();
      if (formData.diagnosis.trim()) payload.diagnosis = formData.diagnosis.trim();
      if (formData.notes.trim()) payload.notes = formData.notes.trim();

      await onSubmit(payload);
      onClose();
    } catch {
      showToast('error', t('orders.toast.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={order ? t('orders.form.editTitle') : t('orders.form.createTitle')}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <div className={styles.formRow}>
            <Select
              label={t('orders.form.vehicle')}
              options={vehicleOptions}
              value={formData.vehicle_id}
              onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
              disabled={vehicleLocked}
              required
              fullWidth
            />
            <Select
              label={t('orders.form.status')}
              options={statusOptions}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ServiceOrderStatus })}
              fullWidth
            />
          </div>

          <div className={styles.formRow}>
            <Select
              label={t('orders.form.employee')}
              options={employeeOptions}
              value={formData.assigned_employee_id}
              onChange={(e) => setFormData({ ...formData, assigned_employee_id: e.target.value })}
              fullWidth
            />
            <Input
              label={t('orders.form.mileageIn')}
              type="number"
              min="0"
              value={formData.mileage_in ?? ''}
              onChange={(e) => setFormData({ ...formData, mileage_in: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
              fullWidth
            />
          </div>

          <Input
            label={t('orders.form.complaint')}
            value={formData.complaint}
            onChange={(e) => setFormData({ ...formData, complaint: e.target.value })}
            fullWidth
          />
          <Input
            label={t('orders.form.diagnosis')}
            value={formData.diagnosis}
            onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
            fullWidth
          />

          <div className={styles.formRow}>
            <Input
              label={t('orders.form.laborCost')}
              type="number" step="0.01" min="0"
              value={formData.labor_cost}
              onChange={(e) => setFormData({ ...formData, labor_cost: parseFloat(e.target.value) || 0 })}
              fullWidth
            />
            <Input
              label={t('orders.form.partsCost')}
              type="number" step="0.01" min="0"
              value={formData.parts_cost}
              onChange={(e) => setFormData({ ...formData, parts_cost: parseFloat(e.target.value) || 0 })}
              fullWidth
            />
            <Input
              label={t('orders.form.discount')}
              type="number" step="0.01" min="0"
              value={formData.discount}
              onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
              fullWidth
            />
          </div>

          <div className={styles.totalRow}>
            <span>{t('orders.form.total')}</span>
            <span>{formatCurrency(total)}</span>
          </div>

          <Input
            label={t('orders.form.notes')}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            fullWidth
          />
        </div>

        <div className={styles.formActions}>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('orders.form.cancel')}
          </Button>
          <Button type="submit" loading={loading} disabled={!formData.vehicle_id}>
            {order ? t('orders.form.update') : t('orders.form.create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
