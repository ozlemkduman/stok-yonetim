import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Table, Button, Badge, Modal, Input, type Column } from '@stok/ui';
import { adminPlansApi, Plan, CreatePlanData, UpdatePlanData } from '../../api/admin/plans.api';
import { useToast } from '../../context/ToastContext';
import { useConfirmDialog } from '../../context/ConfirmDialogContext';
import styles from './AdminPages.module.css';

export function PlansListPage() {
  const { t } = useTranslation(['admin', 'common']);
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
      showToast('error', t('admin:plans.loadFailed'));
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
      showToast('error', t('admin:plans.saveFailed'));
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({ message: t('admin:plans.deleteConfirm'), variant: 'danger' });
    if (!confirmed) return;

    try {
      await adminPlansApi.delete(id);
      loadPlans();
    } catch (error) {
      showToast('error', t('admin:plans.deleteFailed'));
    }
  };

  const columns: Column<Plan>[] = [
    { key: 'name', header: t('admin:plans.columnName') },
    { key: 'code', header: t('admin:plans.columnCode') },
    {
      key: 'price',
      header: t('admin:plans.columnPrice'),
      render: (plan) =>
        new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(plan.price),
    },
    { key: 'billing_period', header: t('admin:plans.columnPeriod') },
    {
      key: 'tenant_count',
      header: t('admin:plans.columnUserCount'),
      render: (plan) => plan.tenant_count || 0,
    },
    {
      key: 'is_active',
      header: t('admin:plans.columnStatus'),
      render: (plan) => (
        <Badge variant={plan.is_active ? 'success' : 'default'}>
          {plan.is_active ? t('admin:plans.statusActive') : t('admin:plans.statusInactive')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (plan) => (
        <div className={styles.actions}>
          <Button variant="ghost" size="sm" onClick={() => handleOpenModal(plan)}>
            {t('admin:plans.edit')}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => handleDelete(plan.id)}>
            {t('admin:plans.delete')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t('admin:plans.title')}</h1>
        <Button variant="primary" onClick={() => handleOpenModal()}>
          {t('admin:plans.newPlan')}
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          data={plans}
          keyExtractor={(plan) => plan.id}
          loading={isLoading}
          emptyMessage={t('admin:plans.emptyMessage')}
        />
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlan ? t('admin:plans.editModal') : t('admin:plans.newModal')}
      >
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>{t('admin:plans.labelName')}</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className={styles.field}>
            <label>{t('admin:plans.labelCode')}</label>
            <Input
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
              disabled={!!editingPlan}
            />
          </div>

          <div className={styles.field}>
            <label>{t('admin:plans.labelPrice')}</label>
            <Input
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              required
            />
          </div>

          <div className={styles.field}>
            <label>{t('admin:plans.labelPeriod')}</label>
            <select
              value={formData.billingPeriod}
              onChange={(e) => setFormData({ ...formData, billingPeriod: e.target.value })}
              className={styles.select}
            >
              <option value="monthly">{t('admin:plans.periodMonthly')}</option>
              <option value="yearly">{t('admin:plans.periodYearly')}</option>
            </select>
          </div>

          <div className={styles.field}>
            <label>{t('admin:plans.labelOrder')}</label>
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
              {t('admin:plans.labelActive')}
            </label>
          </div>

          <div className={styles.formActions}>
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              {t('admin:plans.cancel')}
            </Button>
            <Button type="submit" variant="primary">
              {t('admin:plans.save')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
