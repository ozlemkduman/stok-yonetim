import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // opening_stock_entries — açılış (devir) stok belgesi (header)
  // Gerçek alıştan ayrı tutulur: stok artar + COGS set olur, ama kasa/tedarikçi hareketi YOK.
  if (!(await knex.schema.hasTable('opening_stock_entries'))) {
    await knex.schema.createTable('opening_stock_entries', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
      table.string('entry_number', 50).notNullable();
      table.uuid('warehouse_id').references('id').inTable('warehouses').onDelete('SET NULL');
      table.timestamp('entry_date').notNullable().defaultTo(knex.fn.now());
      table.string('status', 20).defaultTo('completed'); // completed / cancelled
      table.text('notes');
      table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
      table.timestamps(true, true);

      table.unique(['tenant_id', 'entry_number']);
      table.index('tenant_id');
      table.index('entry_date');
      table.index('status');
    });
  }

  // opening_stock_items — açılış belgesi satırları
  if (!(await knex.schema.hasTable('opening_stock_items'))) {
    await knex.schema.createTable('opening_stock_items', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
      table.uuid('entry_id').notNullable().references('id').inTable('opening_stock_entries').onDelete('CASCADE');
      table.uuid('product_id').references('id').inTable('products').onDelete('SET NULL');
      table.decimal('quantity', 14, 3).notNullable();
      table.decimal('unit_cost', 14, 2).notNullable();
      table.timestamps(true, true);

      table.index('entry_id');
      table.index('product_id');
      table.index('tenant_id');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('opening_stock_items');
  await knex.schema.dropTableIfExists('opening_stock_entries');
}
