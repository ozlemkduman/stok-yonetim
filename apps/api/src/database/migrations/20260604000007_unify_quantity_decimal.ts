import type { Knex } from 'knex';

/**
 * Tüm 'quantity' tipindeki sütunları DECIMAL(14,3)'e hizala.
 *
 * Önceden karışıktı:
 * - sale_items.quantity INTEGER (kesirli satış engelleniyordu)
 * - return_items.quantity INTEGER
 * - products.stock_quantity INTEGER (kesirli stok kaybediliyordu)
 * - stock_transfer_items.quantity INTEGER
 * - purchase_items / opening_stock_items / warehouse_stocks / stock_movements
 *   zaten DECIMAL(14,3)
 *
 * INTEGER → DECIMAL dönüşümü PostgreSQL'de güvenli (veri kaybı yok).
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('sale_items', (table) => {
    table.decimal('quantity', 14, 3).notNullable().alter();
  });
  await knex.schema.alterTable('return_items', (table) => {
    table.decimal('quantity', 14, 3).notNullable().alter();
  });
  await knex.schema.alterTable('products', (table) => {
    table.decimal('stock_quantity', 14, 3).defaultTo(0).alter();
  });
  await knex.schema.alterTable('stock_transfer_items', (table) => {
    table.decimal('quantity', 14, 3).notNullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  // Geri dönmek kesirli verileri yuvarlar — uyarı amaçlı tanımlı.
  await knex.schema.alterTable('sale_items', (table) => {
    table.integer('quantity').notNullable().alter();
  });
  await knex.schema.alterTable('return_items', (table) => {
    table.integer('quantity').notNullable().alter();
  });
  await knex.schema.alterTable('products', (table) => {
    table.integer('stock_quantity').defaultTo(0).alter();
  });
  await knex.schema.alterTable('stock_transfer_items', (table) => {
    table.integer('quantity').notNullable().alter();
  });
}
