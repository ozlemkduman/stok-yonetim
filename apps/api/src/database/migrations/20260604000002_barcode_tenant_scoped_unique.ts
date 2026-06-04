import type { Knex } from 'knex';

/**
 * Barkod benzersizliğini global'dan tenant-scoped'a çek.
 * Eski: products.barcode globally unique → bir tenant '1234' alırsa diğeri alamıyordu.
 * Yeni: (tenant_id, barcode) composite unique → her tenant kendi barkodunu özgürce kullanır.
 *
 * Mevcut veri etkilenmez (zaten global unique olduğu için duplicate yoktur).
 */
export async function up(knex: Knex): Promise<void> {
  // Knex default constraint adı: products_barcode_unique
  await knex.raw('ALTER TABLE products DROP CONSTRAINT IF EXISTS products_barcode_unique');

  // Composite unique: NULL barkodlar dahil edilmez (PostgreSQL default davranışı), bu istenen.
  await knex.schema.alterTable('products', (table) => {
    table.unique(['tenant_id', 'barcode']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('products', (table) => {
    table.dropUnique(['tenant_id', 'barcode']);
  });
  // Geri dönerken global unique eklemek tehlikeli (artık duplicate olabilir) — ekleme.
}
