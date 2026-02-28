import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add warehouse_id to sales table
  if (!(await knex.schema.hasColumn('sales', 'warehouse_id'))) {
    await knex.schema.alterTable('sales', (table) => {
      table.uuid('warehouse_id').references('id').inTable('warehouses').onDelete('SET NULL');
      table.index('warehouse_id');
    });
  }

  // Add warehouse_id to returns table
  if (!(await knex.schema.hasColumn('returns', 'warehouse_id'))) {
    await knex.schema.alterTable('returns', (table) => {
      table.uuid('warehouse_id').references('id').inTable('warehouses').onDelete('SET NULL');
      table.index('warehouse_id');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('sales', (table) => {
    table.dropColumn('warehouse_id');
  });

  await knex.schema.alterTable('returns', (table) => {
    table.dropColumn('warehouse_id');
  });
}
