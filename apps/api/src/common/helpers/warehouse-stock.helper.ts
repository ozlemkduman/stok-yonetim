import { Knex } from 'knex';

/**
 * warehouse_stocks tablosunu günceller (per-depo stok).
 *
 * Strateji: warehouseId verilirse o kullanılır; yoksa tenant'ın default deposu,
 * o da yoksa ilk aktif depo. Hiç depo yoksa null döner ve atlanır (iş akışını
 * bloklamamak için — products.stock_quantity zaten güncellendi).
 *
 * Upsert pattern: satır varsa quantity += delta, yoksa quantity = delta ile insert.
 * (Tenant'ın bu üründe hiç warehouse_stocks kaydı yoksa ve delta negatifse,
 * negatif kayıt oluşur — backfill migration sonrası bu durum olmamalı.)
 *
 * Returns: kullanılan warehouse_id veya null (kullanılabilir depo yoksa).
 */
export async function updateWarehouseStock(
  trx: Knex.Transaction,
  params: {
    productId: string;
    delta: number; // pozitif=giriş, negatif=çıkış
    warehouseId?: string | null;
  },
): Promise<string | null> {
  let warehouseId = params.warehouseId || null;

  if (!warehouseId) {
    const defaultWh = await trx('warehouses').where({ is_default: true, is_active: true }).first();
    warehouseId = defaultWh?.id || null;
  }
  if (!warehouseId) {
    const anyWh = await trx('warehouses').where({ is_active: true }).orderBy('created_at', 'asc').first();
    warehouseId = anyWh?.id || null;
  }
  if (!warehouseId) return null;

  const existing = await trx('warehouse_stocks')
    .where({ warehouse_id: warehouseId, product_id: params.productId })
    .forUpdate()
    .first();

  if (existing) {
    await trx('warehouse_stocks')
      .where({ id: existing.id })
      .update({
        quantity: Number(existing.quantity) + params.delta,
        updated_at: trx.fn.now(),
      });
  } else {
    await trx('warehouse_stocks').insert({
      warehouse_id: warehouseId,
      product_id: params.productId,
      quantity: params.delta,
      min_stock_level: 5,
    });
  }

  return warehouseId;
}
