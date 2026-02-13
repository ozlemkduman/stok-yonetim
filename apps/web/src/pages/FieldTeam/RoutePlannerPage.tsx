import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input, Select } from '@stok/ui';
import { fieldTeamApi, VisitInput } from '../../api/field-team.api';
import { Customer, customersApi } from '../../api/customers.api';
import { crmApi, CrmContact } from '../../api/crm.api';
import { useToast } from '../../context/ToastContext';
import styles from './RoutePlannerPage.module.css';

const VISIT_TYPES = [
  { value: 'sales', label: 'Satis' },
  { value: 'support', label: 'Destek' },
  { value: 'collection', label: 'Tahsilat' },
  { value: 'delivery', label: 'Teslimat' },
  { value: 'meeting', label: 'Toplanti' },
  { value: 'other', label: 'Diger' },
];

interface PlannerVisit extends VisitInput {
  id?: string;
  customer_name?: string;
  contact_name?: string;
}

export function RoutePlannerPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contacts, setContacts] = useState<CrmContact[]>([]);

  // Route form
  const [routeName, setRouteName] = useState('');
  const [routeDate, setRouteDate] = useState(new Date().toISOString().split('T')[0]);
  const [assignedTo] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [visits, setVisits] = useState<PlannerVisit[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [customersRes, contactsRes] = await Promise.all([
          customersApi.getAll({ limit: 1000, isActive: true }),
          crmApi.getContacts({ limit: 1000 }),
        ]);
        setCustomers(customersRes.data);
        setContacts(contactsRes.data);
      } catch (err) {
        showToast('error', 'Veriler yuklenirken hata olustu');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const addVisit = () => {
    setVisits([
      ...visits,
      {
        visit_type: 'sales',
        address: '',
        scheduled_time: '',
        notes: '',
      },
    ]);
  };

  const removeVisit = (index: number) => {
    setVisits(visits.filter((_, i) => i !== index));
  };

  const updateVisit = (index: number, field: keyof PlannerVisit, value: string) => {
    const newVisits = [...visits];
    const visit = { ...newVisits[index] };

    if (field === 'customer_id') {
      const customer = customers.find(c => c.id === value);
      visit.customer_id = value || undefined;
      visit.customer_name = customer?.name;
      visit.address = customer?.address || visit.address;
    } else if (field === 'contact_id') {
      const contact = contacts.find(c => c.id === value);
      visit.contact_id = value || undefined;
      visit.contact_name = contact?.name;
    } else {
      (visit as Record<string, unknown>)[field] = value;
    }

    newVisits[index] = visit;
    setVisits(newVisits);
  };

  const moveVisit = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === visits.length - 1) return;

    const newVisits = [...visits];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newVisits[index], newVisits[targetIndex]] = [newVisits[targetIndex], newVisits[index]];
    setVisits(newVisits);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!routeName.trim()) {
      showToast('error', 'Rota adi gerekli');
      return;
    }

    if (visits.length === 0) {
      showToast('error', 'En az bir ziyaret ekleyin');
      return;
    }

    setSaving(true);
    try {
      await fieldTeamApi.createRoute({
        name: routeName,
        route_date: routeDate,
        assigned_to: assignedTo || undefined,
        estimated_duration_minutes: estimatedDuration || undefined,
        notes: notes || undefined,
        visits: visits.map(v => ({
          customer_id: v.customer_id,
          contact_id: v.contact_id,
          visit_type: v.visit_type,
          address: v.address,
          scheduled_time: v.scheduled_time || undefined,
          notes: v.notes,
        })),
      });
      showToast('success', 'Rota olusturuldu');
      navigate('/field-team');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Rota olusturulamadi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>Yukleniyor...</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Button variant="ghost" onClick={() => navigate('/field-team')}>
          ← Rotalar
        </Button>
        <h1 className={styles.title}>Yeni Rota Planla</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className={styles.formCard}>
          <h3>Rota Bilgileri</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Rota Adi *</label>
              <Input
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                placeholder="Orn: Kadikoy Bolge Ziyareti"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Tarih *</label>
              <Input
                type="date"
                value={routeDate}
                onChange={(e) => setRouteDate(e.target.value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Tahmini Sure (dakika)</label>
              <Input
                type="number"
                min="0"
                value={estimatedDuration || ''}
                onChange={(e) => setEstimatedDuration(Number(e.target.value))}
                placeholder="Orn: 180"
              />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Notlar</label>
            <textarea
              className={styles.textarea}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Rota ile ilgili notlar..."
            />
          </div>
        </Card>

        <Card className={styles.visitsCard}>
          <div className={styles.visitsHeader}>
            <h3>Ziyaretler ({visits.length})</h3>
            <Button type="button" size="sm" onClick={addVisit}>
              + Ziyaret Ekle
            </Button>
          </div>

          {visits.length === 0 ? (
            <div className={styles.emptyVisits}>
              Henuz ziyaret eklenmedi. "Ziyaret Ekle" butonuna tiklayin.
            </div>
          ) : (
            <div className={styles.visitsList}>
              {visits.map((visit, index) => (
                <div key={index} className={styles.visitItem}>
                  <div className={styles.visitOrder}>
                    <span className={styles.orderNumber}>{index + 1}</span>
                    <div className={styles.orderButtons}>
                      <button type="button" onClick={() => moveVisit(index, 'up')} disabled={index === 0}>
                        ↑
                      </button>
                      <button type="button" onClick={() => moveVisit(index, 'down')} disabled={index === visits.length - 1}>
                        ↓
                      </button>
                    </div>
                  </div>
                  <div className={styles.visitContent}>
                    <div className={styles.visitRow}>
                      <div className={styles.visitField}>
                        <label>Musteri</label>
                        <Select
                          value={visit.customer_id || ''}
                          onChange={(e) => updateVisit(index, 'customer_id', e.target.value)}
                          options={[
                            { value: '', label: 'Musteri Secin' },
                            ...customers.map(c => ({ value: c.id, label: c.name })),
                          ]}
                        />
                      </div>
                      <div className={styles.visitField}>
                        <label>Kontak (CRM)</label>
                        <Select
                          value={visit.contact_id || ''}
                          onChange={(e) => updateVisit(index, 'contact_id', e.target.value)}
                          options={[
                            { value: '', label: 'Kontak Secin' },
                            ...contacts.map(c => ({ value: c.id, label: c.name })),
                          ]}
                        />
                      </div>
                      <div className={styles.visitField}>
                        <label>Ziyaret Tipi</label>
                        <Select
                          value={visit.visit_type}
                          onChange={(e) => updateVisit(index, 'visit_type', e.target.value)}
                          options={VISIT_TYPES}
                        />
                      </div>
                      <div className={styles.visitField}>
                        <label>Planlanan Saat</label>
                        <Input
                          type="time"
                          value={visit.scheduled_time || ''}
                          onChange={(e) => updateVisit(index, 'scheduled_time', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className={styles.visitRow}>
                      <div className={styles.visitFieldFull}>
                        <label>Adres</label>
                        <Input
                          value={visit.address || ''}
                          onChange={(e) => updateVisit(index, 'address', e.target.value)}
                          placeholder="Ziyaret adresi"
                        />
                      </div>
                    </div>
                    <div className={styles.visitRow}>
                      <div className={styles.visitFieldFull}>
                        <label>Notlar</label>
                        <Input
                          value={visit.notes || ''}
                          onChange={(e) => updateVisit(index, 'notes', e.target.value)}
                          placeholder="Ziyaret notlari"
                        />
                      </div>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={styles.removeButton}
                    onClick={() => removeVisit(index)}
                  >
                    Sil
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className={styles.formActions}>
          <Button type="button" variant="ghost" onClick={() => navigate('/field-team')}>
            Iptal
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Kaydediliyor...' : 'Rota Olustur'}
          </Button>
        </div>
      </form>
    </div>
  );
}
