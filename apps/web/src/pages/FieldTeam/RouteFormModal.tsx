import { useState } from 'react';
import { Modal, Input, Button } from '@stok/ui';
import { fieldTeamApi, FieldRoute, CreateRouteInput } from '../../api/field-team.api';
import styles from './RouteFormModal.module.css';

interface Props {
  route: FieldRoute | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function RouteFormModal({ route, onClose, onSuccess }: Props) {
  const isEdit = !!route;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateRouteInput>({
    name: route?.name || '',
    route_date: route?.route_date?.split('T')[0] || new Date().toISOString().split('T')[0],
    notes: route?.notes || '',
    estimated_duration_minutes: route?.estimated_duration_minutes || undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        await fieldTeamApi.updateRoute(route.id, formData);
      } else {
        await fieldTeamApi.createRoute(formData);
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
    <Modal isOpen={true} title={isEdit ? 'Rota Duzenle' : 'Yeni Rota'} onClose={onClose}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Rota Adi *"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <Input
          label="Tarih *"
          type="date"
          value={formData.route_date}
          onChange={(e) => setFormData({ ...formData, route_date: e.target.value })}
          required
        />

        <Input
          label="Tahmini Sure (dakika)"
          type="number"
          value={formData.estimated_duration_minutes || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              estimated_duration_minutes: e.target.value ? parseInt(e.target.value, 10) : undefined,
            })
          }
        />

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
