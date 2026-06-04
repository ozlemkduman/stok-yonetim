import type { Knex } from 'knex';

/**
 * 1) warehouse_stocks.quantity INTEGER → DECIMAL(14,3) (kesirli stok desteği)
 * 2) Backfill: products.stock_quantity ile warehouse_stocks SUM'ı arasındaki farkı
 *    her tenant'ın default deposuna ekleyerek senkronize et.
 *
 * Önceden alış/satış/iade sadece products.stock_quantity'i değiştiriyordu,
 * warehouse_stocks sadece transferlerde güncelleniyordu. Bu nedenle iki tablo
 * arasında ciddi divergence olmuş olabilir.
 */
export async function up(knex: Knex): Promise<void> {
  // 1) Kolon tipi
  await knex.schema.alterTable('warehouse_stocks', (table) => {
    table.decimal('quantity', 14, 3).notNullable().defaultTo(0).alter();
    table.decimal('min_stock_level', 14, 3).defaultTo(5).alter();
  });

  // 2) Backfill: products.stock_quantity vs SUM(warehouse_stocks.quantity)
  const rows = await knex.raw(`
    SELECT
      p.id AS product_id,
      p.tenant_id AS tenant_id,
      COALESCE(p.stock_quantity, 0) AS target_qty,
      COALESCE(ws.sum_qty, 0) AS existing_sum
    FROM products p
    LEFT JOIN (
      SELECT product_id, SUM(quantity) AS sum_qty
      FROM warehouse_stocks
      GROUP BY product_id
    ) ws ON ws.product_id = p.id
    WHERE COALESCE(p.stock_quantity, 0) <> COALESCE(ws.sum_qty, 0)
  `);

  for (const r of rows.rows as any[]) {
    const tenantId = r.tenant_id;
    const productId = r.product_id;
    const diff = Number(r.target_qty) - Number(r.existing_sum);
    if (diff === 0 || !tenantId) continue;

    // Tenant'ın default deposu, yoksa ilk aktif depo
    const defaultWh =
      (await knex('warehouses').where({ tenant_id: tenantId, is_default: true, is_active: true }).first()) ||
      (await knex('warehouses').where({ tenant_id: tenantId, is_active: true }).orderBy('created_at', 'asc').first());

    if (!defaultWh) continue; // Tenant'ın hiç deposu yok → atla

    const existing = await knex('warehouse_stocks')
      .where({ warehouse_id: defaultWh.id, product_id: productId })
      .first();

    if (existing) {
      await knex('warehouse_stocks')
        .where({ id: existing.id })
        .update({
          quantity: Number(existing.quantity) + diff,
          updated_at: knex.fn.now(),
        });
    } else {
      // Backfill durumunda diff hep pozitif olmalı (eksikse mantık hatası);
      // negatif olursa yine de kayıt atılır, sonradan düzeltilebilir.
      await knex('warehouse_stocks').insert({
        warehouse_id: defaultWh.id,
        product_id: productId,
        quantity: diff,
        min_stock_level: 5,
      });
    }
  }
}

export async function down(knex: Knex): Promise<void> {
  // Geri dönmek: backfill çekilmesi pratik değil. Sadece kolon tipini integer'a indir.
  await knex.schema.alterTable('warehouse_stocks', (table) => {
    table.integer('quantity').notNullable().defaultTo(0).alter();
    table.integer('min_stock_level').defaultTo(5).alter();
  });
}
