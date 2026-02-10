import { useState } from 'react';
import { Modal, Input, Button, Select } from '@stok/ui';
import { crmApi, CrmContact, CreateContactInput } from '../../api/crm.api';
import styles from './ContactFormModal.module.css';

interface Props {
  contact: CrmContact | null;
  onClose: () => void;
  onSuccess: () => void;
}

const statusOptions = [
  { value: 'lead', label: 'Potansiyel' },
  { value: 'prospect', label: 'Aday' },
  { value: 'customer', label: 'Musteri' },
  { value: 'inactive', label: 'Pasif' },
];

const sourceOptions = [
  { value: '', label: 'Secin' },
  { value: 'website', label: 'Web Sitesi' },
  { value: 'referral', label: 'Referans' },
  { value: 'social', label: 'Sosyal Medya' },
  { value: 'cold_call', label: 'Soguk Arama' },
  { value: 'event', label: 'Etkinlik' },
  { value: 'other', label: 'Diger' },
];

export function ContactFormModal({ contact, onClose, onSuccess }: Props) {
  const isEdit = !!contact;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateContactInput>({
    name: contact?.name || '',
    title: contact?.title || '',
    email: contact?.email || '',
    phone: contact?.phone || '',
    mobile: contact?.mobile || '',
    status: contact?.status || 'lead',
    source: contact?.source || undefined,
    notes: contact?.notes || '',
    next_follow_up: contact?.next_follow_up?.split('T')[0] || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        source: formData.source || undefined,
        next_follow_up: formData.next_follow_up || undefined,
      };

      if (isEdit) {
        await crmApi.updateContact(contact.id, data);
      } else {
        await crmApi.createContact(data);
      }
      onSuccess();
    } catch (error) {
      console.error('Kayit hatasi:', error);
      alert('Islem basarisiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} title={isEdit ? 'Kisi Duzenle' : 'Yeni Kisi'} onClose={onClose}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.row}>
          <Input
            label="Ad Soyad *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <Input
            label="Unvan"
            value={formData.title || ''}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        <div className={styles.row}>
          <Input
            label="E-posta"
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label="Telefon"
            value={formData.phone || ''}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div className={styles.row}>
          <Input
            label="Cep Telefonu"
            value={formData.mobile || ''}
            onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
          />
          <Select
            label="Durum"
            value={formData.status || 'lead'}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value as CrmContact['status'] })
            }
            options={statusOptions}
          />
        </div>

        <div className={styles.row}>
          <Select
            label="Kaynak"
            value={formData.source || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                source: e.target.value as CrmContact['source'] | undefined,
              })
            }
            options={sourceOptions}
          />
          <Input
            label="Sonraki Takip"
            type="date"
            value={formData.next_follow_up || ''}
            onChange={(e) => setFormData({ ...formData, next_follow_up: e.target.value })}
          />
        </div>

        <div className={styles.textareaGroup}>
          <label className={styles.label}>Notlar</label>
          <textarea
            className={styles.textarea}
            value={formData.notes || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            Iptal
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
