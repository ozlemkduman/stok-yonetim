import type { Knex } from 'knex';

/**
 * stock_movements.quantity ve stock_after sütunlarını INTEGER'dan DECIMAL(14,3)'e çevir.
 *
 * Sorun: products.stock_quantity ve purchase_items.quantity DECIMAL(14,3) — kesirli
 * stok destekleniyor (örn. 2.5 kg, 0.75 m). Ama stock_movements INTEGER olduğu için
 * audit izinde kesir kısmı yuvarlanarak kayboluyordu.
 *
 * INTEGER → DECIMAL dönüşümü PostgreSQL'de güvenli (veri kaybı yok).
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('stock_movements', (table) => {
    table.decimal('quantity', 14, 3).notNullable().alter();
    table.decimal('stock_after', 14, 3).notNullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  // Geri dönerken kesirli değerler yuvarlanır — uyarı amaçlı.
  await knex.schema.alterTable('stock_movements', (table) => {
    table.integer('quantity').notNullable().alter();
    table.integer('stock_after').notNullable().alter();
  });
}
