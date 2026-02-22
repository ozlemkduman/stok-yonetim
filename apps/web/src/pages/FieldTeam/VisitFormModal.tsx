import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Select } from '@stok/ui';
import { fieldTeamApi, FieldVisit } from '../../api/field-team.api';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import styles from './VisitFormModal.module.css';

interface Props {
  visit: FieldVisit;
  onClose: () => void;
  onSuccess: () => void;
}

export function VisitFormModal({ visit, onClose, onSuccess }: Props) {
  const { t } = useTranslation(['fieldteam', 'common']);
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();
  const [saving, setSaving] = useState(false);

  const [status, setStatus] = useState(visit.status);
  const [notes, setNotes] = useState(visit.notes || '');
  const [outcome, setOutcome] = useState(visit.outcome || '');

  const statusOptions = [
    { value: 'pending', label: t('fieldteam:visitStatusForm.pending') },
    { value: 'in_progress', label: t('fieldteam:visitStatusForm.in_progress') },
    { value: 'completed', label: t('fieldteam:visitStatusForm.completed') },
    { value: 'skipped', label: t('fieldteam:visitStatusForm.skipped') },
    { value: 'rescheduled', label: t('fieldteam:visitStatusForm.rescheduled') },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    try {
      await fieldTeamApi.updateVisit(visit.id, {
        status,
        notes: notes || undefined,
        outcome: outcome || undefined,
      });
      showToast('success', t('fieldteam:toast.visitUpdateSuccess'));
      onSuccess();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('fieldteam:toast.visitUpdateError'));
    } finally {
      setSaving(false);
    }
  };

  const handleCheckIn = async () => {
    setSaving(true);
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            await fieldTeamApi.checkInVisit(visit.id, {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            showToast('success', t('fieldteam:toast.checkInSuccess'));
            onSuccess();
          },
          async () => {
            // Konum alinamazsa konumsuz check-in yap
            await fieldTeamApi.checkInVisit(visit.id);
            showToast('success', t('fieldteam:toast.checkInNoLocation'));
            onSuccess();
          }
        );
      } else {
        await fieldTeamApi.checkInVisit(visit.id);
        showToast('success', t('fieldteam:toast.checkInSuccess'));
        onSuccess();
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('fieldteam:toast.checkInFailed'));
      setSaving(false);
    }
  };

  const handleCheckOut = async () => {
    setSaving(true);
    try {
      await fieldTeamApi.checkOutVisit(visit.id, { outcome });
      showToast('success', t('fieldteam:toast.checkOutSuccess'));
      onSuccess();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('fieldteam:toast.checkOutFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    const confirmed = await confirm({ message: t('fieldteam:confirm.skipVisit'), variant: 'warning' });
    if (!confirmed) return;
    setSaving(true);
    try {
      await fieldTeamApi.skipVisit(visit.id, notes);
      showToast('success', t('fieldteam:toast.visitSkipped'));
      onSuccess();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('fieldteam:toast.operationFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{t('fieldteam:visitForm.title')}</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.body}>
          <div className={styles.infoSection}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>{t('fieldteam:visitForm.visitTypeLabel')}</span>
              <span className={styles.infoValue}>{t(`fieldteam:visitType.${visit.visit_type}`, { defaultValue: visit.visit_type })}</span>
            </div>
            {visit.customer_name && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('fieldteam:visitForm.customerLabel')}</span>
                <span className={styles.infoValue}>{visit.customer_name}</span>
              </div>
            )}
            {visit.contact_name && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('fieldteam:visitForm.contactLabel')}</span>
                <span className={styles.infoValue}>{visit.contact_name}</span>
              </div>
            )}
            {visit.address && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('fieldteam:visitForm.addressLabel')}</span>
                <span className={styles.infoValue}>{visit.address}</span>
              </div>
            )}
            {visit.scheduled_time && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('fieldteam:visitForm.scheduledTimeLabel')}</span>
                <span className={styles.infoValue}>{visit.scheduled_time}</span>
              </div>
            )}
            {visit.check_in_time && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('fieldteam:visitForm.checkInLabel')}</span>
                <span className={styles.infoValue}>{new Date(visit.check_in_time).toLocaleTimeString('tr-TR')}</span>
              </div>
            )}
            {visit.check_out_time && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>{t('fieldteam:visitForm.checkOutLabel')}</span>
                <span className={styles.infoValue}>{new Date(visit.check_out_time).toLocaleTimeString('tr-TR')}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label}>{t('fieldteam:visitForm.statusLabel')}</label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as FieldVisit['status'])}
                options={statusOptions}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>{t('fieldteam:visitForm.notesLabel')}</label>
              <textarea
                className={styles.textarea}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder={t('fieldteam:visitForm.notesPlaceholder')}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>{t('fieldteam:visitForm.outcomeLabel')}</label>
              <textarea
                className={styles.textarea}
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                rows={2}
                placeholder={t('fieldteam:visitForm.outcomePlaceholder')}
              />
            </div>

            <div className={styles.quickActions}>
              {visit.status === 'pending' && !visit.check_in_time && (
                <Button type="button" variant="secondary" onClick={handleCheckIn} disabled={saving}>
                  {t('fieldteam:buttons.checkInAction')}
                </Button>
              )}
              {visit.status === 'in_progress' && visit.check_in_time && !visit.check_out_time && (
                <Button type="button" variant="secondary" onClick={handleCheckOut} disabled={saving}>
                  {t('fieldteam:buttons.checkOutAction')}
                </Button>
              )}
              {['pending', 'in_progress'].includes(visit.status) && (
                <Button type="button" variant="ghost" onClick={handleSkip} disabled={saving}>
                  {t('fieldteam:buttons.skip')}
                </Button>
              )}
            </div>
          </form>
        </div>

        <div className={styles.footer}>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('fieldteam:buttons.close')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? t('fieldteam:buttons.saving') : t('fieldteam:buttons.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
