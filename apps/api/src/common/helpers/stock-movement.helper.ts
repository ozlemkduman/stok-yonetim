import { Knex } from 'knex';
import { getCurrentTenantId } from '../context/tenant.context';

/**
 * Stok hareketi audit kaydı atar (stock_movements tablosuna).
 *
 * stock_movements.warehouse_id NOT NULL olduğu için: önce default depo, yoksa
 * herhangi bir aktif depo bulunur. Hiç depo yoksa kayıt sessizce atlanır
 * (satış/alış akışlarını bloklamamak için — audit ikincil bir endişe).
 *
 * stock_after, mevcut products.stock_quantity'sinden okunur — bu helper çağrılmadan
 * ÖNCE stok güncellemesi yapılmış olmalı.
 */
export async function writeStockMovement(
  trx: Knex.Transaction,
  params: {
    productId: string;
    movementType: string; // sale, sale_cancel, return, purchase, purchase_cancel, opening, opening_cancel, adjustment, transfer_in, transfer_out
    quantity: number; // pozitif=giriş, negatif=çıkış
    referenceType: string; // sale, purchase, return, opening_stock, transfer, adjustment
    referenceId: string;
    notes?: string;
    movementDate?: Date;
    warehouseId?: string | null;
  },
): Promise<void> {
  const tenantId = getCurrentTenantId();
  if (!tenantId) return; // Tenant context yoksa cross-tenant leak'i önle

  let warehouseId = params.warehouseId || null;

  if (!warehouseId) {
    const defaultWarehouse = await trx('warehouses')
      .where({ tenant_id: tenantId, is_default: true, is_active: true })
      .first();
    warehouseId = defaultWarehouse?.id || null;
  }
  if (!warehouseId) {
    const anyWarehouse = await trx('warehouses').where({ tenant_id: tenantId, is_active: true }).orderBy('created_at', 'asc').first();
    warehouseId = anyWarehouse?.id || null;
  }
  if (!warehouseId) {
    // Tenant'ın hiç deposu yok — audit'i atla, iş akışını bloklama.
    return;
  }

  const product = await trx('products').where('id', params.productId).first();
  const stockAfter = Number(product?.stock_quantity) || 0;

  await trx('stock_movements').insert({
    tenant_id: tenantId,
    warehouse_id: warehouseId,
    product_id: params.productId,
    movement_type: params.movementType,
    quantity: params.quantity,
    stock_after: stockAfter,
    reference_type: params.referenceType,
    reference_id: params.referenceId,
    notes: params.notes || null,
    movement_date: params.movementDate || new Date(),
  });
}
