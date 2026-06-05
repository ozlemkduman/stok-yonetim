import type { Knex } from 'knex';

/**
 * Stok Sayım modülü:
 * - stock_count_sessions: bir sayım oturumu (header). Açılır, sayılır, tamamlanır.
 * - stock_count_items: her ürün için snapshot (expected_quantity) + sayılan (counted_quantity).
 *   Oturum tamamlanırken difference = counted - expected hesaplanır ve products.stock_quantity
 *   buna göre güncellenir (adjustment hareketi olarak).
 */
export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('stock_count_sessions'))) {
    await knex.schema.createTable('stock_count_sessions', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
      table.string('count_number', 50).notNullable();
      table.uuid('warehouse_id').references('id').inTable('warehouses').onDelete('SET NULL');
      table.timestamp('started_at').notNullable().defaultTo(knex.fn.now());
      table.timestamp('completed_at');
      table.string('status', 20).defaultTo('in_progress'); // in_progress / completed / cancelled
      table.text('notes');
      table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
      table.timestamps(true, true);

      table.unique(['tenant_id', 'count_number']);
      table.index('tenant_id');
      table.index('warehouse_id');
      table.index('status');
      table.index('started_at');
    });
  }

  if (!(await knex.schema.hasTable('stock_count_items'))) {
    await knex.schema.createTable('stock_count_items', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
      table.uuid('session_id').notNullable().references('id').inTable('stock_count_sessions').onDelete('CASCADE');
      table.uuid('product_id').references('id').inTable('products').onDelete('SET NULL');
      table.decimal('expected_quantity', 14, 3).notNullable().defaultTo(0);
      table.decimal('counted_quantity', 14, 3); // NULL = henüz sayılmadı
      table.text('notes');
      table.timestamp('counted_at');
      table.uuid('counted_by').references('id').inTable('users').onDelete('SET NULL');
      table.timestamps(true, true);

      table.unique(['session_id', 'product_id']);
      table.index('session_id');
      table.index('product_id');
      table.index('tenant_id');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('stock_count_items');
  await knex.schema.dropTableIfExists('stock_count_sessions');
}
