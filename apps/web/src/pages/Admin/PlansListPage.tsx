import { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Modal, Input, type Column } from '@stok/ui';
import { adminPlansApi, Plan, CreatePlanData, UpdatePlanData } from '../../api/admin/plans.api';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import styles from './AdminPages.module.css';

export function PlansListPage() {
  const { showToast } = useToast();
  const { confirm } = useConfirmDialog();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState<CreatePlanData>({
    name: '',
    code: '',
    price: 0,
    billingPeriod: 'monthly',
    features: {},
    limits: {},
    isActive: true,
    sortOrder: 0,
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setIsLoading(true);
      const response = await adminPlansApi.getAll(true);
      setPlans(response.data);
    } catch (error) {
      showToast('error', 'Planlar yuklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        name: plan.name,
        code: plan.code,
        price: plan.price,
        billingPeriod: plan.billing_period,
        features: plan.features,
        limits: plan.limits,
        isActive: plan.is_active,
        sortOrder: plan.sort_order,
      });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        code: '',
        price: 0,
        billingPeriod: 'monthly',
        features: {},
        limits: {},
        isActive: true,
        sortOrder: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingPlan) {
        await adminPlansApi.update(editingPlan.id, formData as UpdatePlanData);
      } else {
        await adminPlansApi.create(formData);
      }
      setIsModalOpen(false);
      loadPlans();
    } catch (error) {
      showToast('error', 'Plan kaydedilemedi');
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({ message: 'Bu plani silmek istediginize emin misiniz?', variant: 'danger' });
    if (!confirmed) return;

    try {
      await adminPlansApi.delete(id);
      loadPlans();
    } catch (error) {
      showToast('error', 'Plan silinemedi. Plan kullanımda olabilir.');
    }
  };

  const columns: Column<Plan>[] = [
    { key: 'name', header: 'Plan Adi' },
    { key: 'code', header: 'Kod' },
    {
      key: 'price',
      header: 'Fiyat',
      render: (plan) =>
        new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(plan.price),
    },
    { key: 'billing_period', header: 'Periyot' },
    {
      key: 'tenant_count',
      header: 'Kullanici Sayisi',
      render: (plan) => plan.tenant_count || 0,
    },
    {
      key: 'is_active',
      header: 'Durum',
      render: (plan) => (
        <Badge variant={plan.is_active ? 'success' : 'default'}>
          {plan.is_active ? 'Aktif' : 'Pasif'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (plan) => (
        <div className={styles.actions}>
          <Button variant="ghost" size="sm" onClick={() => handleOpenModal(plan)}>
            Duzenle
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(plan.id)}>
            Sil
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Planlar</h1>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          Yeni Plan
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          data={plans}
          keyExtractor={(plan) => plan.id}
          loading={isLoading}
          emptyMessage="Plan bulunamadi"
        />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlan ? 'Plan Duzenle' : 'Yeni Plan'}
      >
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Plan Adi</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className={styles.field}>
            <label>Kod</label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
              disabled={!!editingPlan}
            />
          </div>

          <div className={styles.field}>
            <label>Fiyat (TL)</label>
            <Input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div className={styles.field}>
            <label>Periyot</label>
            <select
              value={formData.billingPeriod}
              onChange={(e) => setFormData({ ...formData, billingPeriod: e.target.value })}
              className={styles.select}
            >
              <option value="monthly">Aylik</option>
              <option value="yearly">Yillik</option>
            </select>
          </div>

          <div className={styles.field}>
            <label>Sira</label>
            <Input
              type="number"
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
            />
          </div>

          <div className={styles.field}>
            <label>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />{' '}
              Aktif
            </label>
          </div>

          <div className={styles.formActions}>
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Iptal
            </Button>
            <Button type="submit" variant="primary">
              Kaydet
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
