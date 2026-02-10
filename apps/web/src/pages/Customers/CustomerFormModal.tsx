import { useState, useEffect } from 'react';
import { Modal, Button, Input } from '@stok/ui';
import { Customer, CreateCustomerData } from '../../api/customers.api';
import styles from './CustomerFormModal.module.css';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCustomerData) => Promise<void>;
  customer?: Customer | null;
}

export function CustomerFormModal({
  isOpen,
  onClose,
  onSubmit,
  customer,
}: CustomerFormModalProps) {
  const [formData, setFormData] = useState<CreateCustomerData>({
    name: '',
    phone: '',
    email: '',
    address: '',
    tax_number: '',
    tax_office: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        phone: customer.phone || '',
        email: customer.email || '',
        address: customer.address || '',
        tax_number: customer.tax_number || '',
        tax_office: customer.tax_office || '',
        notes: customer.notes || '',
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        tax_number: '',
        tax_office: '',
        notes: '',
      });
    }
    setErrors({});
  }, [customer, isOpen]);

  const handleChange = (field: keyof CreateCustomerData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Musteri adi zorunludur';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Musteri adi en az 2 karakter olmalidir';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Gecerli bir e-posta adresi giriniz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setErrors({
        form: err instanceof Error ? err.message : 'Bir hata olustu',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={customer ? 'Musteri Duzenle' : 'Yeni Musteri'}
      size="lg"
      footer={
        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Iptal
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {customer ? 'Guncelle' : 'Kaydet'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {errors.form && <div className={styles.formError}>{errors.form}</div>}

        <div className={styles.grid}>
          <Input
            label="Musteri Adi *"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
            placeholder="Ornek: Ahmet Yilmaz"
            fullWidth
          />

          <Input
            label="Telefon"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="0532 111 2233"
            fullWidth
          />

          <Input
            label="E-posta"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            error={errors.email}
            placeholder="ornek@email.com"
            fullWidth
          />

          <Input
            label="Vergi No"
            value={formData.tax_number}
            onChange={(e) => handleChange('tax_number', e.target.value)}
            placeholder="1234567890"
            fullWidth
          />

          <Input
            label="Vergi Dairesi"
            value={formData.tax_office}
            onChange={(e) => handleChange('tax_office', e.target.value)}
            placeholder="Kadikoy"
            fullWidth
          />
        </div>

        <Input
          label="Adres"
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder="Tam adres"
          fullWidth
        />

        <div className={styles.textareaWrapper}>
          <label className={styles.label}>Notlar</label>
          <textarea
            className={styles.textarea}
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Musteri hakkinda notlar..."
            rows={3}
          />
        </div>
      </form>
    </Modal>
  );
}
