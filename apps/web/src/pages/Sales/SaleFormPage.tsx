import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@stok/ui';
import { salesApi, CreateSaleData } from '../../api/sales.api';
import { Customer, customersApi } from '../../api/customers.api';
import { Product, productsApi } from '../../api/products.api';
import { Warehouse, warehousesApi } from '../../api/warehouses.api';
import { useToast } from '../../context/ToastContext';
import { WizardFormData } from './wizard.types';
import { WizardStepIndicator } from './components/WizardStepIndicator';
import { StepProducts } from './components/StepProducts';
import { StepCustomer } from './components/StepCustomer';
import { StepSettings } from './components/StepSettings';
import { StepSummary } from './components/StepSummary';
import { InlineProductForm } from './components/InlineProductForm';
import { InlineCustomerForm } from './components/InlineCustomerForm';
import { InlineWarehouseForm } from './components/InlineWarehouseForm';
import styles from './SaleFormPage.module.css';

export function SaleFormPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(['sales', 'common']);
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Data lists
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  // Wizard form data
  const [wizardData, setWizardData] = useState<WizardFormData>({
    saleType: 'retail',
    items: [],
    customerId: '',
    warehouseId: '',
    paymentMethod: 'nakit',
    dueDate: '',
    includeVat: true,
    discountRate: 0,
    discountAmount: 0,
    notes: '',
  });

  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [customersRes, productsRes, warehousesRes] = await Promise.all([
          customersApi.getAll({ limit: 1000, isActive: true }),
          productsApi.getAll({ limit: 1000, isActive: 'true' }),
          warehousesApi.getAll({ isActive: true }),
        ]);
        setCustomers(customersRes.data);
        setProducts(productsRes.data);
        setWarehouses(warehousesRes.data);

        const defaultWarehouse = warehousesRes.data.find(w => w.is_default);
        if (defaultWarehouse) {
          setWizardData(prev => ({ ...prev, warehouseId: defaultWarehouse.id }));
        }
      } catch (err) {
        showToast('error', t('sales:toast.dataLoadingError'));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const updateWizardData = (updates: Partial<WizardFormData>) => {
    setWizardData(prev => ({ ...prev, ...updates }));
  };

  const calculateTotals = () => {
    const subtotal = wizardData.items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unit_price;
      return sum + itemSubtotal * (1 - (item.discount_rate || 0) / 100);
    }, 0);

    const vatTotal = wizardData.items.reduce((sum, item) => sum + item.vat_amount, 0);

    let discount = wizardData.discountAmount;
    if (wizardData.discountRate > 0) {
      discount = subtotal * (wizardData.discountRate / 100);
    }

    const grandTotal = subtotal + vatTotal - discount;
    return { subtotal, vatTotal, discount, grandTotal };
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (wizardData.items.length === 0) {
          showToast('error', t('sales:validation.addProduct'));
          return false;
        }
        for (const item of wizardData.items) {
          if (!item.product_id) {
            showToast('error', t('sales:validation.selectProduct'));
            return false;
          }
          if (item.stock_quantity !== undefined && item.stock_quantity <= 0) {
            showToast('error', t('sales:validation.insufficientStock', { name: item.product_name, stock: item.stock_quantity }));
            return false;
          }
          if (item.stock_quantity !== undefined && item.quantity > item.stock_quantity) {
            showToast('error', t('sales:validation.insufficientStockWithRequested', { name: item.product_name, stock: item.stock_quantity, requested: item.quantity }));
            return false;
          }
        }
        return true;
      case 2:
        return true; // Customer is optional
      case 3:
        if (!wizardData.warehouseId) {
          showToast('error', t('sales:validation.selectWarehouse'));
          return false;
        }
        if (!wizardData.paymentMethod) {
          showToast('error', t('sales:validation.selectPaymentMethod'));
          return false;
        }
        if (wizardData.paymentMethod === 'veresiye' && !wizardData.customerId) {
          showToast('error', t('sales:validation.creditNeedsCustomer'));
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const goNext = () => {
    if (!validateStep(currentStep)) return;
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const goBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
  };

  const handleSubmit = async () => {
    // Stock check
    for (const item of wizardData.items) {
      if (item.stock_quantity !== undefined && item.quantity > item.stock_quantity) {
        showToast('error', t('sales:validation.insufficientStock', { name: item.product_name, stock: item.stock_quantity }));
        return;
      }
    }

    setSaving(true);
    try {
      const data: CreateSaleData = {
        customer_id: wizardData.customerId || undefined,
        items: wizardData.items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_rate: item.discount_rate,
        })),
        discount_amount: wizardData.discountAmount,
        discount_rate: wizardData.discountRate,
        include_vat: wizardData.includeVat,
        sale_type: wizardData.saleType,
        payment_method: wizardData.paymentMethod,
        due_date: wizardData.dueDate || undefined,
        notes: wizardData.notes || undefined,
      };

      await salesApi.create(data);
      showToast('success', t('sales:toast.saleCreated'));
      navigate('/sales');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : t('sales:toast.saleCreateError'));
    } finally {
      setSaving(false);
    }
  };

  // Inline form handlers
  const handleProductCreated = (product: Product) => {
    setProducts(prev => [...prev, product]);
    // Auto-add to items
    const price = wizardData.saleType === 'wholesale' ? (product.wholesale_price || product.sale_price) : product.sale_price;
    const subtotal = price;
    const vatAmount = subtotal * ((product.vat_rate || 0) / 100);
    setWizardData(prev => ({
      ...prev,
      items: [...prev.items, {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: price,
        discount_rate: 0,
        vat_rate: product.vat_rate,
        line_total: subtotal + vatAmount,
        vat_amount: vatAmount,
        stock_quantity: product.stock_quantity,
        unit: product.unit,
      }],
    }));
  };

  const handleCustomerCreated = (customer: Customer) => {
    setCustomers(prev => [...prev, customer]);
    setWizardData(prev => ({ ...prev, customerId: customer.id }));
  };

  const handleWarehouseCreated = (warehouse: Warehouse) => {
    setWarehouses(prev => [...prev, warehouse]);
    setWizardData(prev => ({ ...prev, warehouseId: warehouse.id }));
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>{t('common:labels.loading')}</div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Button variant="ghost" onClick={() => navigate('/sales')}>
          &larr; {t('sales:form.backToSales')}
        </Button>
        <h1 className={styles.title}>{t('sales:form.title')}</h1>
        <div className={styles.headerSpacer} />
        <Button variant="secondary" onClick={() => navigate('/sales/import')}>
          {t('sales:form.uploadInvoice')}
        </Button>
      </div>

      <WizardStepIndicator
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={goToStep}
      />

      <div className={styles.wizardContent}>
        {currentStep === 1 && (
          <StepProducts
            saleType={wizardData.saleType}
            items={wizardData.items}
            products={products}
            onSaleTypeChange={(saleType) => updateWizardData({ saleType })}
            onItemsChange={(items) => updateWizardData({ items })}
            onOpenProductModal={() => setShowProductModal(true)}
          />
        )}

        {currentStep === 2 && (
          <StepCustomer
            customerId={wizardData.customerId}
            customers={customers}
            onCustomerChange={(customerId) => updateWizardData({ customerId })}
            onOpenCustomerModal={() => setShowCustomerModal(true)}
          />
        )}

        {currentStep === 3 && (
          <StepSettings
            data={wizardData}
            warehouses={warehouses}
            onDataChange={updateWizardData}
            onOpenWarehouseModal={() => setShowWarehouseModal(true)}
            veresiyeWarning={wizardData.paymentMethod === 'veresiye' && !wizardData.customerId}
          />
        )}

        {currentStep === 4 && (
          <StepSummary
            data={wizardData}
            customers={customers}
            warehouses={warehouses}
            totals={totals}
            onGoToStep={goToStep}
          />
        )}
      </div>

      <div className={styles.wizardActions}>
        <div>
          {currentStep > 1 && (
            <Button type="button" variant="secondary" onClick={goBack}>
              &larr; {t('sales:form.back')}
            </Button>
          )}
        </div>
        <div className={styles.wizardActionsRight}>
          <Button type="button" variant="ghost" onClick={() => navigate('/sales')}>
            {t('sales:form.cancel')}
          </Button>
          {currentStep < 4 ? (
            <Button type="button" onClick={goNext}>
              {t('sales:form.next')} &rarr;
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={saving}>
              {saving ? t('sales:form.saving') : t('sales:form.completeSale')}
            </Button>
          )}
        </div>
      </div>

      {/* Inline modals */}
      <InlineProductForm
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        onCreated={handleProductCreated}
      />
      <InlineCustomerForm
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onCreated={handleCustomerCreated}
      />
      <InlineWarehouseForm
        isOpen={showWarehouseModal}
        onClose={() => setShowWarehouseModal(false)}
        onCreated={handleWarehouseCreated}
      />
    </div>
  );
}
