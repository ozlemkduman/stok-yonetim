import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Input, Button, Select, type SelectOption } from '@stok/ui';
import {
  ServiceOrder, CreateServiceOrderData, ServiceOrderStatus, ServiceOrderItemInput, autoServiceApi,
  CreateVehicleData,
} from '../../api/autoService.api';
import { employeesApi, CreateEmployeeData } from '../../api/employees.api';
import { productsApi, Product, CreateProductData } from '../../api/products.api';
import { useToast } from '../../context/ToastContext';
import { formatCurrency } from '../../utils/formatters';
import { SelectWithAdd } from '../../components/inline';
import { VehicleFormModal } from './VehicleFormModal';
import { EmployeeFormModal } from '../Employees/EmployeeFormModal';
import { ProductFormModal } from '../Products/ProductFormModal';
import styles from './AutoService.module.css';

interface ServiceOrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateServiceOrderData) => Promise<void>;
  order: ServiceOrder | null;
  presetVehicleId?: string;
}

const STATUSES: ServiceOrderStatus[] = ['open', 'in_progress', 'completed', 'delivered', 'cancelled'];

interface PartRow { product_id: string; quantity: number; unit_price: number; vat_rate: number; }

interface FormState {
  vehicle_id: string;
  assigned_employee_id: string;
  status: ServiceOrderStatus;
  mileage_in?: number;
  complaint: string;
  diagnosis: string;
  labor_cost: number;
  discount: number;
  notes: string;
}

const emptyForm: FormState = {
  vehicle_id: '', assigned_employee_id: '', status: 'open', mileage_in: undefined,
  complaint: '', diagnosis: '', labor_cost: 0, discount: 0, notes: '',
};

const lineTotal = (r: PartRow) => (Number(r.quantity) || 0) * (Number(r.unit_price) || 0) * (1 + (Number(r.vat_rate) || 0) / 100);

export function ServiceOrderFormModal({ isOpen, onClose, onSubmit, order, presetVehicleId }: ServiceOrderFormModalProps) {
  const { t } = useTranslation('autoService');
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormState>(emptyForm);
  const [parts, setParts] = useState<PartRow[]>([]);
  const [vehicles, setVehicles] = useState<SelectOption[]>([]);
  const [employees, setEmployees] = useState<SelectOption[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [employeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [productRowIdx, setProductRowIdx] = useState<number | null>(null);

  const isEdit = !!order;
  const vehicleLocked = isEdit || !!presetVehicleId;
  const partsLocked = !!order?.stock_deducted;

  useEffect(() => {
    if (!isOpen) return;
    autoServiceApi.vehicles.getAll({ limit: 500, isActive: 'true' })
      .then((res) => setVehicles(res.data.map((v) => ({ value: v.id, label: `${v.plate}${v.brand ? ` — ${v.brand} ${v.model || ''}`.trimEnd() : ''}` }))))
      .catch(() => setVehicles([]));
    employeesApi.getAll({ limit: 200, isActive: 'true' })
      .then((res) => setEmployees(res.data.map((e) => ({ value: e.id, label: e.name }))))
      .catch(() => setEmployees([]));
    productsApi.getAll({ limit: 500, isActive: 'true' })
      .then((res) => setProducts(res.data))
      .catch(() => setProducts([]));
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
        discount: Number(order.discount) || 0,
        notes: order.notes || '',
      });
      setParts((order.items || []).map((i) => ({
        product_id: i.product_id, quantity: Number(i.quantity), unit_price: Number(i.unit_price), vat_rate: Number(i.vat_rate),
      })));
    } else {
      setFormData({ ...emptyForm, vehicle_id: presetVehicleId || '' });
      setParts([]);
    }
  }, [order, presetVehicleId, isOpen]);

  const partsTotal = useMemo(() => parts.reduce((sum, r) => sum + lineTotal(r), 0), [parts]);
  const total = useMemo(
    () => Math.max(0, (formData.labor_cost || 0) + partsTotal - (formData.discount || 0)),
    [formData.labor_cost, formData.discount, partsTotal],
  );

  const vehicleOptions: SelectOption[] = [{ value: '', label: t('orders.form.selectVehicle') }, ...vehicles];
  const employeeOptions: SelectOption[] = [{ value: '', label: t('orders.form.selectEmployee') }, ...employees];
  const statusOptions: SelectOption[] = STATUSES.map((s) => ({ value: s, label: t(`orders.status.${s}`) }));
  const productOptions: SelectOption[] = [
    { value: '', label: t('orders.parts.selectProduct') },
    ...products.map((p) => ({ value: p.id, label: p.name })),
  ];

  const addPart = () => setParts([...parts, { product_id: '', quantity: 1, unit_price: 0, vat_rate: 0 }]);
  const removePart = (idx: number) => setParts(parts.filter((_, i) => i !== idx));
  const updatePart = (idx: number, patch: Partial<PartRow>) =>
    setParts(parts.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const onProductPick = (idx: number, productId: string) => {
    const p = products.find((x) => x.id === productId);
    updatePart(idx, {
      product_id: productId,
      unit_price: p ? Number(p.sale_price) || 0 : 0,
      vat_rate: p ? Number(p.vat_rate) || 0 : 0,
    });
  };

  const handleCreateVehicle = async (data: CreateVehicleData) => {
    const res = await autoServiceApi.vehicles.create(data);
    const v = res.data;
    const label = `${v.plate}${v.brand ? ` — ${v.brand} ${v.model || ''}`.trimEnd() : ''}`;
    setVehicles((prev) => [{ value: v.id, label }, ...prev]);
    setFormData((prev) => ({ ...prev, vehicle_id: v.id }));
  };

  const handleCreateEmployee = async (data: CreateEmployeeData) => {
    const res = await employeesApi.create(data);
    const e = res.data;
    setEmployees((prev) => [{ value: e.id, label: e.name }, ...prev]);
    setFormData((prev) => ({ ...prev, assigned_employee_id: e.id }));
  };

  const handleCreateProduct = async (data: CreateProductData) => {
    const res = await productsApi.create(data);
    const p = res.data;
    setProducts((prev) => [p, ...prev]);
    if (productRowIdx !== null) {
      updatePart(productRowIdx, {
        product_id: p.id,
        unit_price: Number(p.sale_price) || 0,
        vat_rate: Number(p.vat_rate) || 0,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vehicle_id) return;
    setLoading(true);
    try {
      const items: ServiceOrderItemInput[] = parts
        .filter((r) => r.product_id)
        .map((r) => ({ product_id: r.product_id, quantity: r.quantity, unit_price: r.unit_price, vat_rate: r.vat_rate }));

      const payload: CreateServiceOrderData = {
        vehicle_id: formData.vehicle_id,
        status: formData.status,
        labor_cost: formData.labor_cost || 0,
        discount: formData.discount || 0,
      };
      if (formData.assigned_employee_id) payload.assigned_employee_id = formData.assigned_employee_id;
      if (formData.mileage_in != null && !Number.isNaN(formData.mileage_in)) payload.mileage_in = formData.mileage_in;
      if (formData.complaint.trim()) payload.complaint = formData.complaint.trim();
      if (formData.diagnosis.trim()) payload.diagnosis = formData.diagnosis.trim();
      if (formData.notes.trim()) payload.notes = formData.notes.trim();
      // Stok düşülmüşse kalemler kilitli — değişiklik göndermeyiz
      if (!partsLocked) payload.items = items;

      await onSubmit(payload);
      onClose();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('orders.toast.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={order ? t('orders.form.editTitle') : t('orders.form.createTitle')}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <div className={styles.formRow}>
            <div style={{ width: '100%', minWidth: 0 }}>
              <SelectWithAdd
                label={t('orders.form.vehicle')}
                options={vehicleOptions}
                value={formData.vehicle_id}
                onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                disabled={vehicleLocked}
                required
                onAdd={() => setVehicleModalOpen(true)}
                addTitle={t('orders.form.addVehicle')}
              />
            </div>
            <Select
              label={t('orders.form.status')}
              options={statusOptions}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ServiceOrderStatus })}
              fullWidth
            />
          </div>

          <div className={styles.formRow}>
            <div style={{ width: '100%', minWidth: 0 }}>
              <SelectWithAdd
                label={t('orders.form.employee')}
                options={employeeOptions}
                value={formData.assigned_employee_id}
                onChange={(e) => setFormData({ ...formData, assigned_employee_id: e.target.value })}
                onAdd={() => setEmployeeModalOpen(true)}
                addTitle={t('orders.form.addEmployee')}
              />
            </div>
            <Input
              label={t('orders.form.mileageIn')}
              type="number" min="0"
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

          {/* Parça kalemleri */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
              <strong>{t('orders.parts.title')}</strong>
              {!partsLocked && (
                <Button type="button" size="sm" variant="secondary" onClick={addPart}>{t('orders.parts.add')}</Button>
              )}
            </div>
            {partsLocked && <p className={styles.muted} style={{ marginBottom: 'var(--space-2)' }}>{t('orders.parts.locked')}</p>}
            {parts.length === 0 && !partsLocked && <p className={styles.muted}>{t('orders.parts.empty')}</p>}
            {parts.map((row, idx) => (
              <div key={idx} className={styles.partRow}>
                <SelectWithAdd
                  options={productOptions}
                  value={row.product_id}
                  onChange={(e) => onProductPick(idx, e.target.value)}
                  disabled={partsLocked}
                  onAdd={() => setProductRowIdx(idx)}
                  addTitle={t('orders.parts.addProduct')}
                />
                <Input
                  type="number" step="0.001" min="0"
                  aria-label={t('orders.parts.qty')}
                  value={row.quantity}
                  onChange={(e) => updatePart(idx, { quantity: parseFloat(e.target.value) || 0 })}
                  disabled={partsLocked}
                />
                <Input
                  type="number" step="0.01" min="0"
                  aria-label={t('orders.parts.unitPrice')}
                  value={row.unit_price}
                  onChange={(e) => updatePart(idx, { unit_price: parseFloat(e.target.value) || 0 })}
                  disabled={partsLocked}
                />
                <span className={styles.partLineTotal}>{formatCurrency(lineTotal(row))}</span>
                {!partsLocked && (
                  <Button type="button" size="sm" variant="danger" onClick={() => removePart(idx)}>{t('orders.parts.remove')}</Button>
                )}
              </div>
            ))}
            <div className={styles.totalRow} style={{ marginTop: 'var(--space-2)' }}>
              <span>{t('orders.parts.total')}</span>
              <span>{formatCurrency(partsTotal)}</span>
            </div>
          </div>

          <div className={styles.formRow}>
            <Input
              label={t('orders.form.laborCost')}
              type="number" step="0.01" min="0"
              value={formData.labor_cost}
              onChange={(e) => setFormData({ ...formData, labor_cost: parseFloat(e.target.value) || 0 })}
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
          <Button type="button" variant="ghost" onClick={onClose}>{t('orders.form.cancel')}</Button>
          <Button type="submit" loading={loading} disabled={!formData.vehicle_id}>
            {order ? t('orders.form.update') : t('orders.form.create')}
          </Button>
        </div>
      </form>
    </Modal>

    <VehicleFormModal
      isOpen={vehicleModalOpen}
      onClose={() => setVehicleModalOpen(false)}
      onSubmit={handleCreateVehicle}
      vehicle={null}
    />
    <EmployeeFormModal
      isOpen={employeeModalOpen}
      onClose={() => setEmployeeModalOpen(false)}
      onSubmit={handleCreateEmployee}
      employee={null}
    />
    <ProductFormModal
      isOpen={productRowIdx !== null}
      onClose={() => setProductRowIdx(null)}
      onSubmit={handleCreateProduct}
      product={null}
    />
    </>
  );
}
