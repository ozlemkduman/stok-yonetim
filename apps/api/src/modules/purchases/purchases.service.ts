import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Knex } from 'knex';
import { PurchasesRepository, Purchase, PurchaseItem } from './purchases.repository';
import { SuppliersRepository } from '../suppliers/suppliers.repository';
import { CreatePurchaseDto } from './dto';
import { DatabaseService } from '../../database/database.service';
import { createPaginatedResult } from '../../common/dto/pagination.dto';
import { ActivityLogService } from '../../common/services/activity-log.service';
import { getCurrentTenantId } from '../../common/context/tenant.context';
import { accountTypeForPayment } from '../../common/helpers/account-movement.helper';
import { writeStockMovement } from '../../common/helpers/stock-movement.helper';
import { updateWarehouseStock } from '../../common/helpers/warehouse-stock.helper';

/**
 * Alış için tenant'ın kasa/banka hesabından gider hareketi yapar.
 * direction:  1 = alış (gider, hesap azalır)
 *            -1 = alış iptali (gelir, hesap artar)
 */
async function recordPurchaseAccountMovement(
  trx: Knex.Transaction,
  tenantId: string,
  paymentMethod: string,
  amount: number,
  purchaseId: string,
  purchaseNumber: string,
  direction: 1 | -1,
  movementDate: Date,
): Promise<void> {
  const accountType = accountTypeForPayment(paymentMethod);
  if (!accountType) return;

  const account =
    (await trx('accounts')
      .where({ tenant_id: tenantId, account_type: accountType, is_default: true, is_active: true })
      .first()) ||
    (await trx('accounts')
      .where({ tenant_id: tenantId, account_type: accountType, is_active: true })
      .orderBy('created_at', 'asc')
      .first());

  if (!account) return;

  // direction=1 → gider (hesap azalır), direction=-1 → gelir (hesap artar)
  const signedDelta = -direction * amount;
  const newBalance = (Number(account.current_balance) || 0) + signedDelta;

  await trx('account_movements').insert({
    tenant_id: tenantId,
    account_id: account.id,
    movement_type: direction === 1 ? 'gider' : 'gelir',
    amount,
    balance_after: newBalance,
    category: direction === 1 ? 'alış' : 'alış iptali',
    description: direction === 1 ? `Alış: ${purchaseNumber}` : `Alış iptali: ${purchaseNumber}`,
    reference_type: 'purchase',
    reference_id: purchaseId,
    movement_date: movementDate,
  });

  await trx('accounts').where('id', account.id).update({
    current_balance: newBalance,
    updated_at: trx.fn.now(),
  });
}

@Injectable()
export class PurchasesService {
  constructor(
    private readonly purchasesRepository: PurchasesRepository,
    private readonly suppliersRepository: SuppliersRepository,
    private readonly db: DatabaseService,
    private readonly activityLog: ActivityLogService,
  ) {}

  async findAll(params: any) {
    const { items, total } = await this.purchasesRepository.findAll(params);
    return createPaginatedResult(items, total, params.page, params.limit);
  }

  async findById(id: string): Promise<Purchase & { items: PurchaseItem[] }> {
    const purchase = await this.purchasesRepository.findById(id);
    if (!purchase) throw new NotFoundException(`Alış bulunamadı: ${id}`);
    const items = await this.purchasesRepository.findItemsByPurchaseId(id);
    return { ...purchase, items };
  }

  async create(dto: CreatePurchaseDto, userId?: string): Promise<Purchase> {
    if (dto.supplier_id) {
      const supplier = await this.suppliersRepository.findSupplierById(dto.supplier_id);
      if (!supplier) throw new BadRequestException('Tedarikçi bulunamadı');
    }
    if (dto.payment_method === 'veresiye' && !dto.supplier_id) {
      throw new BadRequestException('Veresiye alış için tedarikçi seçilmelidir');
    }

    return this.db.transaction(async (trx) => {
      const purchaseNumber = await this.purchasesRepository.generatePurchaseNumber();
      let subtotal = 0;
      let vatTotal = 0;
      const purchaseItems: Partial<PurchaseItem>[] = [];

      for (const item of dto.items) {
        const product = await trx('products').where('id', item.product_id).forUpdate().first();
        if (!product) throw new BadRequestException(`Ürün bulunamadı: ${item.product_id}`);
        if (!product.is_active) throw new BadRequestException(`Ürün pasif durumda: ${product.name}`);

        const lineSubtotal = item.unit_price * item.quantity;
        const lineDiscount = lineSubtotal * (item.discount_rate || 0) / 100;
        const lineAfterDiscount = lineSubtotal - lineDiscount;
        const vatAmount = dto.include_vat ? lineAfterDiscount * (Number(product.vat_rate) || 0) / 100 : 0;
        const lineTotal = lineAfterDiscount + vatAmount;

        subtotal += lineAfterDiscount;
        vatTotal += vatAmount;

        purchaseItems.push({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_rate: item.discount_rate || 0,
          vat_rate: Number(product.vat_rate) || 0,
          vat_amount: vatAmount,
          line_total: lineTotal,
        });

        // Stok artır + ürünün referans alış fiyatını son alıştaki fiyata güncelle.
        // İskonto sonrası birim maliyet → kâr/zarar raporları için doğru COGS değeri.
        const effectiveUnitCost = item.quantity > 0 ? lineAfterDiscount / item.quantity : item.unit_price;
        await trx('products').where('id', item.product_id).update({
          stock_quantity: trx.raw('stock_quantity + ?', [item.quantity]),
          purchase_price: effectiveUnitCost,
          updated_at: trx.fn.now(),
        });
      }

      const discountAmount = dto.discount_amount || (subtotal * (dto.discount_rate || 0) / 100);
      if (discountAmount > subtotal) {
        throw new BadRequestException('İndirim tutarı ara toplamdan büyük olamaz');
      }
      const grandTotal = subtotal - discountAmount + vatTotal;
      const purchaseDate = dto.purchase_date ? new Date(dto.purchase_date) : new Date();

      const purchase = await this.purchasesRepository.createPurchase({
        purchase_number: purchaseNumber,
        supplier_id: dto.supplier_id || null,
        warehouse_id: dto.warehouse_id || null,
        purchase_date: purchaseDate,
        subtotal,
        discount_amount: discountAmount,
        discount_rate: dto.discount_rate || 0,
        vat_total: vatTotal,
        grand_total: grandTotal,
        include_vat: dto.include_vat !== false,
        payment_method: dto.payment_method,
        due_date: dto.due_date ? new Date(dto.due_date) : null,
        status: 'completed',
        supplier_invoice_no: dto.supplier_invoice_no || null,
        notes: dto.notes || null,
        created_by: userId || null,
      }, purchaseItems, trx);

      // Stok: warehouse_stocks güncelle + audit kaydı
      for (const item of dto.items) {
        await updateWarehouseStock(trx, {
          productId: item.product_id,
          delta: Number(item.quantity),
          warehouseId: dto.warehouse_id || null,
        });
        await writeStockMovement(trx, {
          productId: item.product_id,
          movementType: 'purchase',
          quantity: item.quantity,
          referenceType: 'purchase',
          referenceId: purchase.id,
          notes: `Alış: ${purchaseNumber}`,
          movementDate: purchaseDate,
          warehouseId: dto.warehouse_id || null,
        });
      }

      // Ödeme yöntemine göre yan etkiler
      if (dto.supplier_id && dto.payment_method === 'veresiye') {
        // Veresiye alış: tedarikçi bize alacaklı → supplier.balance -= grandTotal (negatif = bizim borcumuz)
        await trx('suppliers').where('id', dto.supplier_id).update({
          balance: trx.raw('balance - ?', [grandTotal]),
          updated_at: trx.fn.now(),
        });
      } else {
        // Peşin/kart/havale: kasa/banka hesabından gider
        const tenantId = getCurrentTenantId();
        if (tenantId) {
          await recordPurchaseAccountMovement(
            trx, tenantId, dto.payment_method, grandTotal, purchase.id, purchaseNumber, 1, purchaseDate,
          );
        }
      }

      await this.activityLog.log({
        action: 'purchase_created',
        entityType: 'purchase',
        entityId: purchase.id,
        newValues: { purchase_number: purchaseNumber, grand_total: grandTotal, payment_method: dto.payment_method, items_count: dto.items.length },
      });

      return purchase;
    });
  }

  async cancel(id: string): Promise<void> {
    const purchase = await this.findById(id);
    if (purchase.status === 'cancelled') throw new BadRequestException('Alış zaten iptal edilmiş');

    await this.db.transaction(async (trx) => {
      // Stokları geri al (azalt) — yeterli stok olmalı
      for (const item of purchase.items) {
        const product = await trx('products').where('id', item.product_id).forUpdate().first();
        if (product && Number(product.stock_quantity) < Number(item.quantity)) {
          throw new BadRequestException(`İptal edilemiyor: ${product.name} stoğu yetersiz (alış sonrası ürün satılmış olabilir)`);
        }
        await trx('products').where('id', item.product_id).update({
          stock_quantity: trx.raw('stock_quantity - ?', [item.quantity]),
          updated_at: trx.fn.now(),
        });
        await updateWarehouseStock(trx, {
          productId: item.product_id,
          delta: -Number(item.quantity),
          warehouseId: purchase.warehouse_id || null,
        });
        await writeStockMovement(trx, {
          productId: item.product_id,
          movementType: 'purchase_cancel',
          quantity: -Number(item.quantity),
          referenceType: 'purchase',
          referenceId: purchase.id,
          notes: `Alış iptali: ${purchase.purchase_number}`,
          warehouseId: purchase.warehouse_id || null,
        });
      }

      if (purchase.supplier_id && purchase.payment_method === 'veresiye') {
        // Veresiye iptal: tedarikçi cariye yansıyan borç silinir
        await trx('suppliers').where('id', purchase.supplier_id).update({
          balance: trx.raw('balance + ?', [purchase.grand_total]),
          updated_at: trx.fn.now(),
        });
      } else {
        const tenantId = getCurrentTenantId();
        if (tenantId) {
          await recordPurchaseAccountMovement(
            trx, tenantId, purchase.payment_method, Number(purchase.grand_total),
            purchase.id, purchase.purchase_number, -1, new Date(),
          );
        }
      }

      await trx('purchases').where('id', id).update({ status: 'cancelled', updated_at: trx.fn.now() });

      await this.activityLog.log({
        action: 'purchase_cancelled',
        entityType: 'purchase',
        entityId: id,
        oldValues: { status: purchase.status, purchase_number: purchase.purchase_number, grand_total: purchase.grand_total },
      });
    });
  }

  async getStats(params: any) {
    let q = this.purchasesRepository['query'].clone();
    if (params.supplierId) q = q.where('supplier_id', params.supplierId);
    if (params.status) q = q.where('status', params.status);
    if (params.startDate) q = q.where('purchase_date', '>=', params.startDate);
    if (params.endDate) q = q.where('purchase_date', '<=', params.endDate);
    if (params.search) q = q.whereILike('purchase_number', `%${params.search}%`);

    const knex = this.db.knex;
    const [result] = await q.select(
      knex.raw("COUNT(*) FILTER (WHERE status != 'cancelled') as count"),
      knex.raw("COALESCE(SUM(grand_total) FILTER (WHERE status != 'cancelled'), 0) as total"),
      knex.raw("COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count"),
      knex.raw("COALESCE(SUM(grand_total) FILTER (WHERE status = 'cancelled'), 0) as cancelled_total"),
    );
    return {
      count: parseInt((result as any).count || '0', 10),
      total: parseFloat((result as any).total || '0'),
      cancelledCount: parseInt((result as any).cancelled_count || '0', 10),
      cancelledTotal: parseFloat((result as any).cancelled_total || '0'),
    };
  }
}
