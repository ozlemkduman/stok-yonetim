import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1. Create the Basic plan
  const basicFeatures = JSON.stringify({
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
  });
  const basicLimits = JSON.stringify({
    maxUsers: 1,
    maxProducts: 200,
    maxCustomers: 100,
    maxWarehouses: 1,
    maxIntegrations: 0,
    storageGb: 5,
  });

  // 2. Define Pro plan
  const proFeatures = JSON.stringify({
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
  });
  const proLimits = JSON.stringify({
    maxUsers: 5,
    maxProducts: 5000,
    maxCustomers: 2000,
    maxWarehouses: 3,
    maxIntegrations: 3,
    storageGb: 25,
  });

  // 3. Define Plus plan
  const plusFeatures = JSON.stringify({
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
  });
  const plusLimits = JSON.stringify({
    maxUsers: -1,
    maxProducts: -1,
    maxCustomers: -1,
    maxWarehouses: -1,
    maxIntegrations: -1,
    storageGb: 100,
  });

  // Get the basic plan id (we'll use it to migrate tenants)
  const basicPlan = await knex('plans').where({ code: 'basic' }).first();

  if (!basicPlan) {
    // Insert Basic plan first
    const [insertedBasic] = await knex('plans').insert({
      name: 'Basic',
      code: 'basic',
      price: 79.00,
      billing_period: 'monthly',
      features: basicFeatures,
      limits: basicLimits,
      is_active: true,
      sort_order: 1,
    }).returning('id');

    const basicId = insertedBasic.id || insertedBasic;

    // Migrate starter tenants to basic
    const starterPlan = await knex('plans').where({ code: 'starter' }).first();
    if (starterPlan) {
      await knex('tenants').where({ plan_id: starterPlan.id }).update({ plan_id: basicId });
      await knex('plans').where({ code: 'starter' }).delete();
    }

    // Migrate enterprise tenants to plus before deleting
    const enterprisePlan = await knex('plans').where({ code: 'enterprise' }).first();

    // Update existing Pro plan
    const existingPro = await knex('plans').where({ code: 'pro' }).first();
    if (existingPro) {
      await knex('plans').where({ code: 'pro' }).update({
        name: 'Pro',
        price: 179.00,
        features: proFeatures,
        limits: proLimits,
        sort_order: 2,
      });
    } else {
      await knex('plans').insert({
        name: 'Pro',
        code: 'pro',
        price: 179.00,
        billing_period: 'monthly',
        features: proFeatures,
        limits: proLimits,
        is_active: true,
        sort_order: 2,
      });
    }

    // Insert Plus plan
    const [insertedPlus] = await knex('plans').insert({
      name: 'Plus',
      code: 'plus',
      price: 349.00,
      billing_period: 'monthly',
      features: plusFeatures,
      limits: plusLimits,
      is_active: true,
      sort_order: 3,
    }).returning('id');

    const plusId = insertedPlus.id || insertedPlus;

    // Migrate enterprise tenants to plus
    if (enterprisePlan) {
      await knex('tenants').where({ plan_id: enterprisePlan.id }).update({ plan_id: plusId });
      await knex('plans').where({ code: 'enterprise' }).delete();
    }
  } else {
    // Basic already exists - update all plans idempotently
    await knex('plans').where({ code: 'basic' }).update({
      name: 'Basic',
      price: 79.00,
      features: basicFeatures,
      limits: basicLimits,
      sort_order: 1,
    });

    await knex('plans').where({ code: 'pro' }).update({
      name: 'Pro',
      price: 179.00,
      features: proFeatures,
      limits: proLimits,
      sort_order: 2,
    });

    const plusPlan = await knex('plans').where({ code: 'plus' }).first();
    if (plusPlan) {
      await knex('plans').where({ code: 'plus' }).update({
        name: 'Plus',
        price: 349.00,
        features: plusFeatures,
        limits: plusLimits,
        sort_order: 3,
      });
    } else {
      await knex('plans').insert({
        name: 'Plus',
        code: 'plus',
        price: 349.00,
        billing_period: 'monthly',
        features: plusFeatures,
        limits: plusLimits,
        is_active: true,
        sort_order: 3,
      });
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  // Revert to original Starter/Pro/Enterprise structure
  const starterFeatures = JSON.stringify({
    sales: true, returns: true, quotes: true, eDocuments: false,
    warehouses: false, integrations: false, crm: false, fieldTeam: false,
    multiWarehouse: false, apiAccess: false,
  });
  const starterLimits = JSON.stringify({
    maxUsers: 3, maxProducts: 500, maxCustomers: 200,
    maxWarehouses: 1, maxIntegrations: 0, storageGb: 5,
  });

  // Insert Starter back
  const [insertedStarter] = await knex('plans').insert({
    name: 'Starter',
    code: 'starter',
    price: 299.00,
    billing_period: 'monthly',
    features: starterFeatures,
    limits: starterLimits,
    is_active: true,
    sort_order: 1,
  }).returning('id');

  const starterId = insertedStarter.id || insertedStarter;

  // Migrate basic tenants to starter
  const basicPlan = await knex('plans').where({ code: 'basic' }).first();
  if (basicPlan) {
    await knex('tenants').where({ plan_id: basicPlan.id }).update({ plan_id: starterId });
    await knex('plans').where({ code: 'basic' }).delete();
  }

  // Revert Pro
  await knex('plans').where({ code: 'pro' }).update({
    price: 799.00,
    features: JSON.stringify({
      sales: true, returns: true, quotes: true, eDocuments: true,
      warehouses: true, integrations: true, crm: true, fieldTeam: false,
      multiWarehouse: true, apiAccess: false,
    }),
    limits: JSON.stringify({
      maxUsers: 10, maxProducts: 5000, maxCustomers: 2000,
      maxWarehouses: 5, maxIntegrations: 5, storageGb: 25,
    }),
    sort_order: 2,
  });

  // Insert Enterprise back, migrate plus tenants
  const [insertedEnterprise] = await knex('plans').insert({
    name: 'Enterprise',
    code: 'enterprise',
    price: 1999.00,
    billing_period: 'monthly',
    features: JSON.stringify({
      sales: true, returns: true, quotes: true, eDocuments: true,
      warehouses: true, integrations: true, crm: true, fieldTeam: true,
      multiWarehouse: true, apiAccess: true,
    }),
    limits: JSON.stringify({
      maxUsers: -1, maxProducts: -1, maxCustomers: -1,
      maxWarehouses: -1, maxIntegrations: -1, storageGb: 100,
    }),
    is_active: true,
    sort_order: 3,
  }).returning('id');

  const enterpriseId = insertedEnterprise.id || insertedEnterprise;

  const plusPlan = await knex('plans').where({ code: 'plus' }).first();
  if (plusPlan) {
    await knex('tenants').where({ plan_id: plusPlan.id }).update({ plan_id: enterpriseId });
    await knex('plans').where({ code: 'plus' }).delete();
  }
}
