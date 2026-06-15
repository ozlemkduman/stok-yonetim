import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Knex } from 'knex';
import { ServiceOrdersRepository, ServiceOrder, ServiceOrderItem } from './service-orders.repository';
import { VehiclesRepository } from '../vehicles/vehicles.repository';
import { CreateServiceOrderDto, UpdateServiceOrderDto, ServiceOrderItemDto, RecordInvoiceDto } from './dto';
import { createPaginatedResult } from '../../../common/dto/pagination.dto';
import { ActivityLogService } from '../../../common/services/activity-log.service';
import { DatabaseService } from '../../../database/database.service';
import { getCurrentTenantId } from '../../../common/context/tenant.context';
import { updateWarehouseStock } from '../../../common/helpers/warehouse-stock.helper';
import { writeStockMovement } from '../../../common/helpers/stock-movement.helper';
import { accountTypeForPayment } from '../../../common/helpers/account-movement.helper';

const STOCK_STATUSES = ['completed', 'delivered'];

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function computeTotal(labor: number, parts: number, discount: number): number {
  return Math.max(0, (Number(labor) || 0) + (Number(parts) || 0) - (Number(discount) || 0));
}

@Injectable()
export class ServiceOrdersService {
  constructor(
    private readonly repository: ServiceOrdersRepository,
    private readonly vehiclesRepository: VehiclesRepository,
    private readonly activityLog: ActivityLogService,
    private readonly db: DatabaseService,
  ) {}

  async findAll(params: any) {
    const { items, total } = await this.repository.findAll(params);
    return createPaginatedResult(items, total, params.page, params.limit);
  }

  async findById(id: string): Promise<ServiceOrder> {
    const order = await this.repository.findByIdDetailed(id);
    if (!order) throw new NotFoundException('İş emri bulunamadı');
    return order;
  }

  /**
   * Kalem DTO'larını fiyat/KDV ile zenginleştirip satır toplamlarını hesaplar.
   * Birim fiyat/KDV verilmemişse üründen alınır. parts_cost = KDV dahil satır toplamları.
   */
  private async buildItems(
    itemsDto: ServiceOrderItemDto[] | undefined,
    trx: Knex.Transaction,
  ): Promise<{ rows: Partial<ServiceOrderItem>[]; partsCost: number }> {
    if (!itemsDto || itemsDto.length === 0) return { rows: [], partsCost: 0 };
    const tenantId = getCurrentTenantId();
    const rows: Partial<ServiceOrderItem>[] = [];
    let partsCost = 0;

    for (const it of itemsDto) {
      let pq = trx('products').where('id', it.product_id);
      if (tenantId) pq = pq.where('tenant_id', tenantId);
      const product = await pq.first();
      if (!product) throw new BadRequestException('Geçersiz ürün kalemi');

      const quantity = Number(it.quantity);
      const unitPrice = it.unit_price ?? Number(product.sale_price) ?? 0;
      const vatRate = it.vat_rate ?? Number(product.vat_rate) ?? 0;
      const lineTotal = round2(quantity * unitPrice * (1 + vatRate / 100));
      partsCost += lineTotal;

      rows.push({
        tenant_id: tenantId || null,
        product_id: it.product_id,
        quantity,
        unit_price: unitPrice,
        vat_rate: vatRate,
        line_total: lineTotal,
      });
    }
    return { rows, partsCost: round2(partsCost) };
  }

  /**
   * Kalemleri stoktan düşer (sign=-1) veya geri ekler (sign=+1).
   * type='service' ürünler stok hareketi yapmaz. Düşümde yetersiz stok hata verir.
   */
  private async applyStock(order: ServiceOrder, items: ServiceOrderItem[], sign: 1 | -1, trx: Knex.Transaction): Promise<void> {
    const tenantId = getCurrentTenantId();
    for (const item of items) {
      let pq = trx('products').where('id', item.product_id);
      if (tenantId) pq = pq.where('tenant_id', tenantId);
      const product = await pq.forUpdate().first();
      if (!product) continue;
      if (product.type === 'service') continue; // hizmet kalemleri stoktan düşmez

      const qty = Number(item.quantity);
      if (sign < 0 && Number(product.stock_quantity) < qty) {
        throw new BadRequestException(`Yetersiz stok: ${product.name} (mevcut ${product.stock_quantity})`);
      }

      let uq = trx('products').where('id', item.product_id);
      if (tenantId) uq = uq.where('tenant_id', tenantId);
      await uq.update({
        stock_quantity: trx.raw('stock_quantity + ?', [sign * qty]),
        updated_at: trx.fn.now(),
      });

      await updateWarehouseStock(trx, { productId: item.product_id, delta: sign * qty, warehouseId: order.warehouse_id });
      await writeStockMovement(trx, {
        productId: item.product_id,
        movementType: sign < 0 ? 'service_parts' : 'service_parts_cancel',
        quantity: sign * qty,
        referenceType: 'service_order',
        referenceId: order.id,
        notes: `İş emri: ${order.order_number}`,
        warehouseId: order.warehouse_id,
      });
    }
  }

  async create(dto: CreateServiceOrderDto, userId?: string): Promise<ServiceOrder> {
    const vehicle = await this.vehiclesRepository.findById(dto.vehicle_id);
    if (!vehicle) throw new BadRequestException('Geçersiz araç');

    const orderId = await this.db.transaction(async (trx) => {
      const { rows, partsCost } = await this.buildItems(dto.items, trx);
      const laborCost = dto.labor_cost ?? 0;
      const discount = dto.discount ?? 0;
      const status = dto.status ?? 'open';
      const orderNumber = await this.repository.generateOrderNumber();

      const order = await this.repository.createOrder({
        order_number: orderNumber,
        vehicle_id: dto.vehicle_id,
        customer_id: dto.customer_id ?? vehicle.customer_id ?? null,
        assigned_employee_id: dto.assigned_employee_id ?? null,
        warehouse_id: dto.warehouse_id ?? null,
        status,
        mileage_in: dto.mileage_in ?? null,
        complaint: dto.complaint ?? null,
        diagnosis: dto.diagnosis ?? null,
        labor_cost: laborCost,
        parts_cost: partsCost,
        discount,
        total_amount: computeTotal(laborCost, partsCost, discount),
        stock_deducted: false,
        completed_at: status === 'completed' ? (new Date() as any) : null,
        delivered_at: status === 'delivered' ? (new Date() as any) : null,
        created_by: userId || null,
      }, trx);

      if (rows.length) {
        await this.repository.insertItems(rows.map((r) => ({ ...r, service_order_id: order.id })), trx);
      }

      // Açılışta direkt tamamlandı/teslim ise stoğu düş
      if (STOCK_STATUSES.includes(status) && rows.length) {
        const items = rows.map((r) => ({ ...r, service_order_id: order.id })) as ServiceOrderItem[];
        await this.applyStock(order, items, -1, trx);
        await this.repository.updateOrder(order.id, { stock_deducted: true }, trx);
      }

      await this.activityLog.log({
        action: 'service_order_created',
        entityType: 'service_order',
        entityId: order.id,
        newValues: { order_number: order.order_number, vehicle_id: order.vehicle_id, total_amount: order.total_amount },
      });
      return order.id;
    });

    return this.findById(orderId);
  }

  async update(id: string, dto: UpdateServiceOrderDto): Promise<ServiceOrder> {
    const current = await this.findById(id);

    await this.db.transaction(async (trx) => {
      if (dto.items && current.stock_deducted) {
        throw new BadRequestException('Stok düşülmüş iş emrinde parça kalemleri değiştirilemez');
      }

      const updateData: Partial<ServiceOrder> = {};
      // Skaler alanlar
      for (const k of ['customer_id', 'assigned_employee_id', 'warehouse_id', 'status', 'mileage_in', 'complaint', 'diagnosis', 'notes'] as const) {
        if (dto[k] !== undefined) (updateData as any)[k] = dto[k];
      }

      // Kalemleri değiştir
      let effectiveItems = current.items || [];
      let partsCost = Number(current.parts_cost) || 0;
      if (dto.items) {
        const built = await this.buildItems(dto.items, trx);
        partsCost = built.partsCost;
        await this.repository.deleteItems(id, trx);
        const withOrder = built.rows.map((r) => ({ ...r, service_order_id: id }));
        await this.repository.insertItems(withOrder, trx);
        effectiveItems = withOrder as ServiceOrderItem[];
        updateData.parts_cost = partsCost;
      }

      // Toplam — maliyet alanlarından biri değiştiyse yeniden hesapla
      const labor = dto.labor_cost ?? current.labor_cost;
      const discount = dto.discount ?? current.discount;
      if (dto.labor_cost !== undefined) updateData.labor_cost = labor;
      if (dto.discount !== undefined) updateData.discount = discount;
      if (dto.labor_cost !== undefined || dto.discount !== undefined || dto.items) {
        updateData.total_amount = computeTotal(labor, partsCost, discount);
      }

      // Durum geçişleri
      const newStatus = dto.status ?? current.status;
      if (dto.status && dto.status !== current.status) {
        if (dto.status === 'completed' && !current.completed_at) updateData.completed_at = new Date() as any;
        if (dto.status === 'delivered' && !current.delivered_at) updateData.delivered_at = new Date() as any;
      }

      // Stok yan etkileri (depo, güncel kalemlerle)
      const orderForStock: ServiceOrder = { ...current, warehouse_id: dto.warehouse_id ?? current.warehouse_id };
      const shouldBeDeducted = STOCK_STATUSES.includes(newStatus);
      if (!current.stock_deducted && shouldBeDeducted && effectiveItems.length) {
        await this.applyStock(orderForStock, effectiveItems, -1, trx);
        updateData.stock_deducted = true;
      } else if (current.stock_deducted && newStatus === 'cancelled') {
        await this.applyStock(orderForStock, current.items || [], 1, trx);
        updateData.stock_deducted = false;
      }

      await this.repository.updateOrder(id, updateData, trx);
      await this.activityLog.log({
        action: 'service_order_updated',
        entityType: 'service_order',
        entityId: id,
        newValues: dto as any,
      });
    });

    return this.findById(id);
  }

  /**
   * Harici portalda kesilmiş faturayı iş emrine kaydeder ve seçime göre
   * tutarı cariye (veresiye) veya kasa/bankaya (nakit/kart/havale) işler.
   */
  async recordInvoice(id: string, dto: RecordInvoiceDto): Promise<ServiceOrder> {
    const order = await this.findById(id);
    const posting = dto.posting || 'none';
    const amount = Number(dto.invoice_amount) || 0;
    const tenantId = getCurrentTenantId();

    await this.db.transaction(async (trx) => {
      if (posting === 'veresiye') {
        if (!order.customer_id) throw new BadRequestException('Veresiye için iş emrinde müşteri olmalı');
        await trx('customers').where('id', order.customer_id).update({
          balance: trx.raw('balance - ?', [amount]),
          updated_at: trx.fn.now(),
        });
        await trx('account_transactions').insert({
          customer_id: order.customer_id,
          type: 'borc',
          amount,
          description: `Servis faturası: ${dto.invoice_number}`,
          reference_type: 'service_order',
          reference_id: order.id,
          transaction_date: new Date(),
        });
      } else if (accountTypeForPayment(posting) && tenantId) {
        const accountType = accountTypeForPayment(posting)!;
        const account =
          (await trx('accounts').where({ tenant_id: tenantId, account_type: accountType, is_default: true, is_active: true }).first()) ||
          (await trx('accounts').where({ tenant_id: tenantId, account_type: accountType, is_active: true }).orderBy('created_at', 'asc').first());
        if (account) {
          const newBalance = (Number(account.current_balance) || 0) + amount;
          await trx('account_movements').insert({
            tenant_id: tenantId,
            account_id: account.id,
            movement_type: 'gelir',
            amount,
            balance_after: newBalance,
            category: 'servis',
            description: `Servis faturası: ${dto.invoice_number}`,
            reference_type: 'service_order',
            reference_id: order.id,
            movement_date: new Date(),
          });
          await trx('accounts').where('id', account.id).update({ current_balance: newBalance, updated_at: trx.fn.now() });
        }
      }

      await this.repository.updateOrder(id, {
        invoice_number: dto.invoice_number,
        invoice_date: (dto.invoice_date ? new Date(dto.invoice_date) : new Date()) as any,
        invoice_amount: amount,
        invoice_file_url: dto.invoice_file_url || null,
        posted_payment_method: posting,
      }, trx);

      await this.activityLog.log({
        action: 'service_order_invoiced',
        entityType: 'service_order',
        entityId: id,
        newValues: { invoice_number: dto.invoice_number, invoice_amount: amount, posting },
      });
    });

    return this.findById(id);
  }
}
