import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { StockCountRepository, StockCountSession, StockCountItem } from './stock-count.repository';
import { CreateStockCountDto, UpdateStockCountItemDto } from './dto';
import { DatabaseService } from '../../database/database.service';
import { createPaginatedResult } from '../../common/dto/pagination.dto';
import { ActivityLogService } from '../../common/services/activity-log.service';
import { writeStockMovement } from '../../common/helpers/stock-movement.helper';
import { updateWarehouseStock } from '../../common/helpers/warehouse-stock.helper';
import { getCurrentTenantId } from '../../common/context/tenant.context';

@Injectable()
export class StockCountService {
  constructor(
    private readonly repository: StockCountRepository,
    private readonly db: DatabaseService,
    private readonly activityLog: ActivityLogService,
  ) {}

  async findAll(params: any) {
    const { items, total } = await this.repository.findAll(params);
    return createPaginatedResult(items, total, params.page, params.limit);
  }

  async findById(id: string): Promise<StockCountSession & { items: StockCountItem[] }> {
    const session = await this.repository.findById(id);
    if (!session) throw new NotFoundException(`Sayım bulunamadı: ${id}`);
    const items = await this.repository.findItemsBySessionId(id);
    return { ...session, items };
  }

  /**
   * Yeni sayım oturumu oluşturur:
   * - Tenant'ın tüm aktif ürünlerinin mevcut stoğunu snapshot olarak alır
   * - Her ürün için stock_count_items satırı yaratır (counted_quantity başlangıçta NULL)
   * - Kullanıcı tek tek doldurur, sonra complete() çağrılır
   */
  async create(dto: CreateStockCountDto, userId?: string): Promise<StockCountSession> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) throw new BadRequestException('Tenant context bulunamadı');

    return this.db.transaction(async (trx) => {
      const countNumber = await this.repository.generateCountNumber();

      // Depo zorunlu — opsiyonel gönderildiyse default depo bul
      let warehouseId = dto.warehouse_id || null;
      if (!warehouseId) {
        const defaultWh =
          (await trx('warehouses').where({ tenant_id: tenantId, is_default: true, is_active: true }).first()) ||
          (await trx('warehouses').where({ tenant_id: tenantId, is_active: true }).orderBy('created_at', 'asc').first());
        warehouseId = defaultWh?.id || null;
      }
      if (!warehouseId) {
        throw new BadRequestException('Sayım için en az bir aktif depo gerekli');
      }

      // Tüm aktif ürünleri snapshot al
      const products = await trx('products')
        .where({ tenant_id: tenantId, is_active: true })
        .select('id', 'stock_quantity');

      if (products.length === 0) {
        throw new BadRequestException('Sayılacak aktif ürün yok');
      }

      const items: Partial<StockCountItem>[] = products.map((p) => ({
        product_id: p.id,
        expected_quantity: Number(p.stock_quantity) || 0,
        counted_quantity: null,
      }));

      const session = await this.repository.createSession({
        count_number: countNumber,
        warehouse_id: warehouseId,
        started_at: new Date(),
        status: 'in_progress',
        notes: dto.notes || null,
        created_by: userId || null,
      }, items, trx);

      await this.activityLog.log({
        action: 'stock_count_started',
        entityType: 'stock_count',
        entityId: session.id,
        newValues: { count_number: countNumber, items_count: items.length },
      });

      return session;
    });
  }

  /**
   * Tek bir kalemin sayılan miktarını günceller.
   */
  async updateItem(sessionId: string, itemId: string, dto: UpdateStockCountItemDto, userId?: string): Promise<StockCountItem> {
    const session = await this.repository.findById(sessionId);
    if (!session) throw new NotFoundException('Sayım bulunamadı');
    if (session.status !== 'in_progress') {
      throw new BadRequestException('Bu sayım artık güncellenemez (durum: ' + session.status + ')');
    }

    const [item] = await this.db.knex('stock_count_items')
      .where({ id: itemId, session_id: sessionId })
      .update({
        counted_quantity: dto.counted_quantity,
        notes: dto.notes ?? null,
        counted_at: new Date(),
        counted_by: userId || null,
        updated_at: this.db.knex.fn.now(),
      })
      .returning('*');

    if (!item) throw new NotFoundException('Sayım satırı bulunamadı');
    return item;
  }

  /**
   * Sayımı tamamlar:
   * - Her satır için difference = counted - expected hesaplanır
   * - 0 olmayan farklar için adjustment movement_type ile stock_movements kaydı atılır
   * - products.stock_quantity ve warehouse_stocks counted değerine güncellenir
   * - Sayılmayan satırlar (counted_quantity IS NULL) ATLANIR — sistem stoğu korunur
   */
  async complete(id: string, userId?: string): Promise<{ updated: number; unchanged: number; skipped: number }> {
    const session = await this.findById(id);
    if (session.status !== 'in_progress') {
      throw new BadRequestException('Sayım zaten ' + session.status);
    }

    return this.db.transaction(async (trx) => {
      let updated = 0, unchanged = 0, skipped = 0;

      for (const item of session.items) {
        if (item.counted_quantity == null) {
          skipped++;
          continue;
        }
        const counted = Number(item.counted_quantity);
        const expected = Number(item.expected_quantity);
        const diff = counted - expected;

        if (diff === 0) {
          unchanged++;
          continue;
        }
        if (!item.product_id) {
          skipped++;
          continue;
        }

        // products.stock_quantity'i counted değerine set et
        await trx('products').where('id', item.product_id).update({
          stock_quantity: counted,
          updated_at: trx.fn.now(),
        });

        // warehouse_stocks'a delta uygula
        await updateWarehouseStock(trx, {
          productId: item.product_id,
          delta: diff,
          warehouseId: session.warehouse_id || null,
        });

        // Audit
        await writeStockMovement(trx, {
          productId: item.product_id,
          movementType: 'adjustment',
          quantity: diff,
          referenceType: 'stock_count',
          referenceId: session.id,
          notes: `Sayım farkı (${session.count_number}): ${expected} → ${counted}`,
          warehouseId: session.warehouse_id || null,
        });

        updated++;
      }

      await trx('stock_count_sessions').where('id', id).update({
        status: 'completed',
        completed_at: new Date(),
        updated_at: trx.fn.now(),
      });

      await this.activityLog.log({
        action: 'stock_count_completed',
        entityType: 'stock_count',
        entityId: id,
        newValues: { count_number: session.count_number, updated, unchanged, skipped },
      });

      return { updated, unchanged, skipped };
    });
  }

  async cancel(id: string): Promise<void> {
    const session = await this.repository.findById(id);
    if (!session) throw new NotFoundException('Sayım bulunamadı');
    if (session.status !== 'in_progress') {
      throw new BadRequestException('Sayım zaten ' + session.status);
    }
    await this.db.knex('stock_count_sessions').where('id', id).update({
      status: 'cancelled',
      updated_at: this.db.knex.fn.now(),
    });
    await this.activityLog.log({
      action: 'stock_count_cancelled',
      entityType: 'stock_count',
      entityId: id,
      oldValues: { status: session.status, count_number: session.count_number },
    });
  }
}
