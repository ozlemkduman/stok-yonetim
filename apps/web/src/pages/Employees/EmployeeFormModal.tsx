import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Input, Button } from '@stok/ui';
import { Employee, CreateEmployeeData } from '../../api/employees.api';
import { useToast } from '../../context/ToastContext';

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateEmployeeData) => Promise<void>;
  employee: Employee | null;
}

const emptyForm: CreateEmployeeData = {
  name: '',
  email: '',
  phone: '',
  position: '',
  hire_date: '',
  salary: undefined,
  commission_rate: 0,
  notes: '',
};

export function EmployeeFormModal({ isOpen, onClose, onSubmit, employee }: EmployeeFormModalProps) {
  const { t } = useTranslation(['employees', 'common']);
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateEmployeeData>(emptyForm);

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name,
        email: employee.email || '',
        phone: employee.phone || '',
        position: employee.position || '',
        hire_date: employee.hire_date ? employee.hire_date.split('T')[0] : '',
        salary: employee.salary ?? undefined,
        commission_rate: Number(employee.commission_rate) || 0,
        notes: employee.notes || '',
      });
    } else {
      setFormData(emptyForm);
    }
  }, [employee, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Boş opsiyonel alanları gönderme (email validasyonu boş string'de patlamasın)
      const payload: CreateEmployeeData = {
        name: formData.name.trim(),
        commission_rate: formData.commission_rate || 0,
      };
      if (formData.email?.trim()) payload.email = formData.email.trim();
      if (formData.phone?.trim()) payload.phone = formData.phone.trim();
      if (formData.position?.trim()) payload.position = formData.position.trim();
      if (formData.hire_date) payload.hire_date = formData.hire_date;
      if (formData.salary !== undefined && formData.salary !== null && !Number.isNaN(formData.salary)) {
        payload.salary = formData.salary;
      }
      if (formData.notes?.trim()) payload.notes = formData.notes.trim();

      await onSubmit(payload);
      onClose();
    } catch (error) {
      showToast('error', t('employees:toast.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={employee ? t('employees:form.editTitle') : t('employees:form.createTitle')}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <Input
            label={t('employees:form.name')}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            fullWidth
          />

          <Input
            label={t('employees:form.position')}
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            placeholder={t('employees:form.positionPlaceholder')}
            fullWidth
          />

          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <Input
              label={t('employees:form.email')}
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
            />
            <Input
              label={t('employees:form.phone')}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              fullWidth
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <Input
              label={t('employees:form.hireDate')}
              type="date"
              value={formData.hire_date}
              onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
              fullWidth
            />
            <Input
              label={t('employees:form.salary')}
              type="number"
              step="0.01"
              min="0"
              value={formData.salary ?? ''}
              onChange={(e) =>
                setFormData({ ...formData, salary: e.target.value === '' ? undefined : parseFloat(e.target.value) })
              }
              fullWidth
            />
          </div>

          <Input
            label={t('employees:form.commissionRate')}
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.commission_rate ?? 0}
            onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })}
            placeholder={t('employees:form.commissionRatePlaceholder')}
            fullWidth
          />

          <Input
            label={t('employees:form.notes')}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            fullWidth
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-6)' }}>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('employees:form.cancel')}
          </Button>
          <Button type="submit" loading={loading}>
            {employee ? t('employees:form.update') : t('employees:form.create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
