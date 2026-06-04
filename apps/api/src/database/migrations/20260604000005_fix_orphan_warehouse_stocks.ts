import type { Knex } from 'knex';

/**
 * Önceki migration (20260604000004) backfill INSERT'inde tenant_id geçmiyordu.
 * Sonuç: backfill sırasında yaratılan warehouse_stocks satırları tenant_id=NULL
 * ile yazıldı → applyTenantFilter tarafından filtrelenince görünmez oldular.
 *
 * Bu migration: warehouse'tan tenant_id'yi alarak orphan satırları onarır.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    UPDATE warehouse_stocks ws
    SET tenant_id = w.tenant_id, updated_at = NOW()
    FROM warehouses w
    WHERE ws.warehouse_id = w.id
      AND ws.tenant_id IS NULL
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Geri dönmek anlamsız — orphan'ı tekrar yaratmak istemeyiz.
}
