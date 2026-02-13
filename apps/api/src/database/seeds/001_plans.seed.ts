import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing plans
  await knex('plans').del();

  // Insert default plans
  await knex('plans').insert([
    {
      name: 'Starter',
      code: 'starter',
      price: 299.00,
      billing_period: 'monthly',
      features: JSON.stringify({
        sales: true,
        returns: true,
        quotes: true,
        eDocuments: false,
        warehouses: false,
        integrations: false,
        crm: false,
        fieldTeam: false,
        multiWarehouse: false,
        apiAccess: false,
      }),
      limits: JSON.stringify({
        maxUsers: 3,
        maxProducts: 500,
        maxCustomers: 200,
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
        fieldTeam: false,
        multiWarehouse: true,
        apiAccess: false,
      }),
      limits: JSON.stringify({
        maxUsers: 10,
        maxProducts: 5000,
        maxCustomers: 2000,
        maxWarehouses: 5,
        maxIntegrations: 5,
        storageGb: 25,
      }),
      is_active: true,
      sort_order: 2,
    },
    {
      name: 'Enterprise',
      code: 'enterprise',
      price: 1999.00,
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
