import { Product } from '../../api/products.api';

export interface SaleFormItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_rate: number;
  vat_rate: number;
  line_total: number;
  vat_amount: number;
  stock_quantity?: number;
  unit?: string;
}

export interface WizardFormData {
  // Step 1: Products
  saleType: 'retail' | 'wholesale';
  items: SaleFormItem[];
  // Step 2: Customer
  customerId: string;
  // Step 3: Settings
  warehouseId: string;
  paymentMethod: string;
  dueDate: string;
  includeVat: boolean;
  discountRate: number;
  discountAmount: number;
  notes: string;
  // Renewal reminder
  hasRenewal: boolean;
  renewalDate: string;
  reminderDaysBefore: number;
  reminderNote: string;
}

export interface WizardStepProps {
  products: Product[];
}

export const WIZARD_STEP_KEYS = [
  { number: 1, labelKey: 'sales:form.wizardSteps.products' },
  { number: 2, labelKey: 'sales:form.wizardSteps.customer' },
  { number: 3, labelKey: 'sales:form.wizardSteps.settings' },
  { number: 4, labelKey: 'sales:form.wizardSteps.summary' },
] as const;
