import { useState } from 'react';
import { Button, Select } from '@stok/ui';
import { fieldTeamApi, FieldVisit } from '../../api/field-team.api';
import { useToast } from '../../context/ToastContext';
import styles from './VisitFormModal.module.css';

interface Props {
  visit: FieldVisit;
  onClose: () => void;
  onSuccess: () => void;
}

const VISIT_TYPE_LABELS: Record<string, string> = {
  sales: 'Satis',
  support: 'Destek',
  collection: 'Tahsilat',
  delivery: 'Teslimat',
  meeting: 'Toplanti',
  other: 'Diger',
};

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Bekliyor' },
  { value: 'in_progress', label: 'Devam Ediyor' },
  { value: 'completed', label: 'Tamamlandi' },
  { value: 'skipped', label: 'Atlandi' },
  { value: 'rescheduled', label: 'Ertelendi' },
];

export function VisitFormModal({ visit, onClose, onSuccess }: Props) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const [status, setStatus] = useState(visit.status);
  const [notes, setNotes] = useState(visit.notes || '');
  const [outcome, setOutcome] = useState(visit.outcome || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    try {
      await fieldTeamApi.updateVisit(visit.id, {
        status,
        notes: notes || undefined,
        outcome: outcome || undefined,
      });
      showToast('success', 'Ziyaret guncellendi');
      onSuccess();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Guncelleme basarisiz');
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
            showToast('success', 'Check-in yapildi');
            onSuccess();
          },
          async () => {
            // Konum alinamazsa konumsuz check-in yap
            await fieldTeamApi.checkInVisit(visit.id);
            showToast('success', 'Check-in yapildi (konum alinamadi)');
            onSuccess();
          }
        );
      } else {
        await fieldTeamApi.checkInVisit(visit.id);
        showToast('success', 'Check-in yapildi');
        onSuccess();
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Check-in basarisiz');
      setSaving(false);
    }
  };

  const handleCheckOut = async () => {
    setSaving(true);
    try {
      await fieldTeamApi.checkOutVisit(visit.id, { outcome });
      showToast('success', 'Check-out yapildi');
      onSuccess();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Check-out basarisiz');
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    if (!confirm('Bu ziyareti atlamak istediginize emin misiniz?')) return;
    setSaving(true);
    try {
      await fieldTeamApi.skipVisit(visit.id, notes);
      showToast('success', 'Ziyaret atlandi');
      onSuccess();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Islem basarisiz');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Ziyaret Detayi</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.body}>
          <div className={styles.infoSection}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Ziyaret Tipi</span>
              <span className={styles.infoValue}>{VISIT_TYPE_LABELS[visit.visit_type] || visit.visit_type}</span>
            </div>
            {visit.customer_name && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Musteri</span>
                <span className={styles.infoValue}>{visit.customer_name}</span>
              </div>
            )}
            {visit.contact_name && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Kontak</span>
                <span className={styles.infoValue}>{visit.contact_name}</span>
              </div>
            )}
            {visit.address && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Adres</span>
                <span className={styles.infoValue}>{visit.address}</span>
              </div>
            )}
            {visit.scheduled_time && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Planlanan Saat</span>
                <span className={styles.infoValue}>{visit.scheduled_time}</span>
              </div>
            )}
            {visit.check_in_time && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Check-in</span>
                <span className={styles.infoValue}>{new Date(visit.check_in_time).toLocaleTimeString('tr-TR')}</span>
              </div>
            )}
            {visit.check_out_time && (
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Check-out</span>
                <span className={styles.infoValue}>{new Date(visit.check_out_time).toLocaleTimeString('tr-TR')}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Durum</label>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value as FieldVisit['status'])}
                options={STATUS_OPTIONS}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Notlar</label>
              <textarea
                className={styles.textarea}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Ziyaret notlari..."
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Sonuc</label>
              <textarea
                className={styles.textarea}
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                rows={2}
                placeholder="Ziyaret sonucu..."
              />
            </div>

            <div className={styles.quickActions}>
              {visit.status === 'pending' && !visit.check_in_time && (
                <Button type="button" variant="secondary" onClick={handleCheckIn} disabled={saving}>
                  Check-in Yap
                </Button>
              )}
              {visit.status === 'in_progress' && visit.check_in_time && !visit.check_out_time && (
                <Button type="button" variant="secondary" onClick={handleCheckOut} disabled={saving}>
                  Check-out Yap
                </Button>
              )}
              {['pending', 'in_progress'].includes(visit.status) && (
                <Button type="button" variant="ghost" onClick={handleSkip} disabled={saving}>
                  Atla
                </Button>
              )}
            </div>
          </form>
        </div>

        <div className={styles.footer}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Kapat
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </div>
    </div>
  );
}
