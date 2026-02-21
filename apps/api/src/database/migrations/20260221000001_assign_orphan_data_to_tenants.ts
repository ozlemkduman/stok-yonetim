import { Knex } from 'knex';

/**
 * Assigns orphan records (tenant_id IS NULL) to the oldest active tenant.
 * These records were created before multi-tenant enforcement was in place.
 */
export async function up(knex: Knex): Promise<void> {
  // Find the oldest tenant to assign orphan data to
  const tenant = await knex('tenants')
    .orderBy('created_at', 'asc')
    .first();

  if (!tenant) {
    console.log('No tenants found, skipping orphan data assignment');
    return;
  }

  console.log(`Assigning orphan data to tenant: ${tenant.name} (${tenant.id})`);

  const tables = [
    'products',
    'customers',
    'sales',
    'sale_items',
    'payments',
    'expenses',
    'returns',
    'return_items',
    'account_transactions',
    'accounts',
    'warehouses',
    'quotes',
  ];

  for (const table of tables) {
    const hasColumn = await knex.schema.hasColumn(table, 'tenant_id');
    if (!hasColumn) continue;

    const result = await knex(table)
      .whereNull('tenant_id')
      .update({ tenant_id: tenant.id });

    if (result > 0) {
      console.log(`  ${table}: ${result} records updated`);
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  // No rollback - data assignment is intentional
}
