import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Input, Button } from '@stok/ui';
import { fieldTeamApi, FieldRoute, CreateRouteInput } from '../../api/field-team.api';
import { useToast } from '../../context/ToastContext';
import styles from './RouteFormModal.module.css';

interface Props {
  route: FieldRoute | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function RouteFormModal({ route, onClose, onSuccess }: Props) {
  const { t } = useTranslation(['fieldteam', 'common']);
  const isEdit = !!route;
  const { showToast } = useToast();
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
      showToast('error', t('fieldteam:toast.saveError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} title={isEdit ? t('fieldteam:form.editTitle') : t('fieldteam:form.createTitle')} onClose={onClose}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label={t('fieldteam:form.routeNameLabel')}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <Input
          label={t('fieldteam:form.dateLabel')}
          type="date"
          value={formData.route_date}
          onChange={(e) => setFormData({ ...formData, route_date: e.target.value })}
          required
        />

        <Input
          label={t('fieldteam:form.estimatedDurationLabel')}
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
          <label className={styles.label}>{t('fieldteam:form.notesLabel')}</label>
          <textarea
            className={styles.textarea}
            value={formData.notes || ''}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('fieldteam:buttons.cancel')}
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? t('fieldteam:buttons.saving') : t('fieldteam:buttons.save')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
