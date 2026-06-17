import type { Knex } from 'knex';

/**
 * Depo kodu (warehouses.code) benzersizliğini global'dan tenant-scoped'a çek.
 * Eski: code globally unique → bir tenant 'ANA' kodunu alırsa diğeri alamıyordu;
 *       app-içi kontrol tenant-filtreli olduğundan çakışma DB hatası (500) veriyordu.
 * Yeni: (tenant_id, code) composite unique → her tenant kendi kodunu özgürce kullanır.
 *
 * products.barcode ve stock_transfers.transfer_number için yapılanla aynı düzeltme.
 * code NOT NULL olduğundan NULL/boş kod çakışması söz konusu değil.
 */
export async function up(knex: Knex): Promise<void> {
  // Knex default constraint adı: warehouses_code_unique
  await knex.raw('ALTER TABLE warehouses DROP CONSTRAINT IF EXISTS warehouses_code_unique');

  await knex.schema.alterTable('warehouses', (table) => {
    table.unique(['tenant_id', 'code']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('warehouses', (table) => {
    table.dropUnique(['tenant_id', 'code']);
  });
  // Geri dönerken global unique eklemek tehlikeli (artık tenant'lar arası duplicate olabilir) — ekleme.
}
