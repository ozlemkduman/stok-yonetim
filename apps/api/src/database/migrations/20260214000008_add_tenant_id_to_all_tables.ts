import { Knex } from 'knex';

const TABLES_TO_UPDATE = [
  'customers',
  'products',
  'sales',
  'sale_items',
  'returns',
  'return_items',
  'payments',
  'expenses',
  'account_transactions',
  'accounts',
  'account_movements',
  'account_transfers',
  'warehouses',
  'warehouse_stocks',
  'stock_transfers',
  'stock_transfer_items',
  'stock_movements',
  'quotes',
  'quote_items',
  'e_documents',
  'e_document_logs',
  'integrations',
  'integration_logs',
  'e_commerce_orders',
  'bank_statements',
  'crm_contacts',
  'crm_activities',
  'field_team_routes',
  'field_team_visits',
];

export async function up(knex: Knex): Promise<void> {
  for (const tableName of TABLES_TO_UPDATE) {
    const hasTable = await knex.schema.hasTable(tableName);
    if (hasTable) {
      const hasColumn = await knex.schema.hasColumn(tableName, 'tenant_id');
      if (!hasColumn) {
        await knex.schema.alterTable(tableName, (table) => {
          table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE').nullable();
          table.index('tenant_id');
        });
      }
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  for (const tableName of TABLES_TO_UPDATE.reverse()) {
    const hasTable = await knex.schema.hasTable(tableName);
    if (hasTable) {
      const hasColumn = await knex.schema.hasColumn(tableName, 'tenant_id');
      if (hasColumn) {
        await knex.schema.alterTable(tableName, (table) => {
          table.dropForeign(['tenant_id']);
          table.dropColumn('tenant_id');
        });
      }
    }
  }
}
