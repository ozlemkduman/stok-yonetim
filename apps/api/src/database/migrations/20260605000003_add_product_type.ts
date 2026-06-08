import type { Knex } from 'knex';

/**
 * products.type kolonu — 'product' (stoklu) vs 'service' (stoksuz hizmet).
 * Hizmet için satışlarda stok kontrolü yapılmaz, stok hareketi oluşturulmaz.
 */
export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('products', 'type');
  if (!hasColumn) {
    await knex.schema.alterTable('products', (table) => {
      table.string('type', 10).notNullable().defaultTo('product');
      table.index('type');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('products', (table) => {
    table.dropIndex('type');
    table.dropColumn('type');
  });
}
