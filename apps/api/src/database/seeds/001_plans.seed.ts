import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing plans
  await knex('plans').del();

  // Insert default plans
  await knex('plans').insert([
    {
      name: 'Basic',
      code: 'basic',
      price: 199.00,
      billing_period: 'monthly',
      features: JSON.stringify({
        sales: true,
        returns: true,
        quotes: false,
        eDocuments: false,
        warehouses: false,
        integrations: false,
        crm: false,
        fieldTeam: false,
        invoiceImport: false,
        advancedReports: false,
        multiWarehouse: false,
        apiAccess: false,
      }),
      limits: JSON.stringify({
        maxUsers: 1,
        maxProducts: 200,
        maxCustomers: 100,
        maxWarehouses: 1,
        maxIntegrations: 0,
        storageGb: 5,
      }),
      is_active: true,
      sort_order: 1,
    },
    {
      name: 'Pro',
      code: 'pro',
      price: 449.00,
      billing_period: 'monthly',
      features: JSON.stringify({
        sales: true,
        returns: true,
        quotes: true,
        eDocuments: true,
        warehouses: true,
        integrations: true,
        crm: false,
        fieldTeam: false,
        invoiceImport: true,
        advancedReports: true,
        multiWarehouse: true,
        apiAccess: false,
      }),
      limits: JSON.stringify({
        maxUsers: 5,
        maxProducts: 5000,
        maxCustomers: 2000,
        maxWarehouses: 3,
        maxIntegrations: 3,
        storageGb: 25,
      }),
      is_active: true,
      sort_order: 2,
    },
    {
      name: 'Plus',
      code: 'plus',
      price: 799.00,
      billing_period: 'monthly',
      features: JSON.stringify({
        sales: true,
        returns: true,
        quotes: true,
        eDocuments: true,
        warehouses: true,
        integrations: true,
        crm: true,
        fieldTeam: true,
        invoiceImport: true,
        advancedReports: true,
        multiWarehouse: true,
        apiAccess: true,
      }),
      limits: JSON.stringify({
        maxUsers: -1, // unlimited
        maxProducts: -1,
        maxCustomers: -1,
        maxWarehouses: -1,
        maxIntegrations: -1,
        storageGb: 100,
      }),
      is_active: true,
      sort_order: 3,
    },
  ]);
}
