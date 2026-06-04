import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { OpeningStockRepository, OpeningStockEntry, OpeningStockItem } from './opening-stock.repository';
import { CreateOpeningStockDto } from './dto';
import { DatabaseService } from '../../database/database.service';
import { createPaginatedResult } from '../../common/dto/pagination.dto';
import { ActivityLogService } from '../../common/services/activity-log.service';
import { updateWarehouseStock } from '../../common/helpers/warehouse-stock.helper';

@Injectable()
export class OpeningStockService {
  constructor(
    private readonly repository: OpeningStockRepository,
    private readonly db: DatabaseService,
    private readonly activityLog: ActivityLogService,
  ) {}

  async findAll(params: any) {
    const { items, total } = await this.repository.findAll(params);
    return createPaginatedResult(items, total, params.page, params.limit);
  }

  async findById(id: string): Promise<OpeningStockEntry & { items: OpeningStockItem[] }> {
    const entry = await this.repository.findById(id);
    if (!entry) throw new NotFoundException(`Açılış stoğu bulunamadı: ${id}`);
    const items = await this.repository.findItemsByEntryId(id);
    return { ...entry, items };
  }

  async create(dto: CreateOpeningStockDto, userId?: string): Promise<OpeningStockEntry> {
    return this.db.transaction(async (trx) => {
      const entryNumber = await this.repository.generateEntryNumber();
      const entryDate = dto.entry_date ? new Date(dto.entry_date) : new Date();
      const items: Partial<OpeningStockItem>[] = [];

      // Depo zorunlu — audit izi (stock_movements) için warehouse_id NOT NULL.
      // Form'da seçilmediyse tenant'ın default deposunu, yoksa ilk aktif depoyu seç.
      let warehouseId = dto.warehouse_id || null;
      if (!warehouseId) {
        const defaultWarehouse = await trx('warehouses')
          .where({ is_default: true, is_active: true })
          .first();
        warehouseId = defaultWarehouse?.id || null;
      }
      if (!warehouseId) {
        const anyWarehouse = await trx('warehouses').where({ is_active: true }).orderBy('created_at', 'asc').first();
        warehouseId = anyWarehouse?.id || null;
      }
      if (!warehouseId) {
        throw new BadRequestException(
          'Açılış stoğu kaydedilemedi: en az bir aktif depo gereklidir. Lütfen önce Depolar sayfasından depo ekleyin.',
        );
      }

      for (const item of dto.items) {
        const product = await trx('products').where('id', item.product_id).forUpdate().first();
        if (!product) throw new BadRequestException(`Ürün bulunamadı: ${item.product_id}`);
        if (!product.is_active) throw new BadRequestException(`Ürün pasif durumda: ${product.name}`);

        items.push({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
        });

        // Stok artır + maliyeti set et (alış servisiyle aynı mantık,
        // ama burası açılış olduğu için kasa/tedarikçi hareketi YOK)
        await trx('products').where('id', item.product_id).update({
          stock_quantity: trx.raw('stock_quantity + ?', [item.quantity]),
          purchase_price: item.unit_cost,
          updated_at: trx.fn.now(),
        });
        await updateWarehouseStock(trx, {
          productId: item.product_id,
          delta: Number(item.quantity),
          warehouseId: warehouseId,
        });
      }

      const entry = await this.repository.createEntry({
        entry_number: entryNumber,
        warehouse_id: warehouseId,
        entry_date: entryDate,
        status: 'completed',
        notes: dto.notes || null,
        created_by: userId || null,
      }, items, trx);

      // Stok hareketleri kaydı (audit izi) — depo yukarıda garanti edildi.
      for (const item of dto.items) {
        const product = await trx('products').where('id', item.product_id).first();
        await trx('stock_movements').insert({
          warehouse_id: warehouseId,
          product_id: item.product_id,
          movement_type: 'opening',
          quantity: item.quantity,
          stock_after: Number(product.stock_quantity) || 0,
          reference_type: 'opening_stock',
          reference_id: entry.id,
          notes: `Açılış: ${entryNumber}`,
          movement_date: entryDate,
        });
      }

      await this.activityLog.log({
        action: 'opening_stock_created',
        entityType: 'opening_stock',
        entityId: entry.id,
        newValues: { entry_number: entryNumber, items_count: dto.items.length },
      });

      return entry;
    });
  }

  async cancel(id: string): Promise<void> {
    const entry = await this.findById(id);
    if (entry.status === 'cancelled') throw new BadRequestException('Açılış kaydı zaten iptal edilmiş');

    await this.db.transaction(async (trx) => {
      // Stokları geri al — yeterli stok olmalı (açılıştan sonra satış yapılmış olabilir)
      for (const item of entry.items) {
        if (!item.product_id) continue;
        const product = await trx('products').where('id', item.product_id).forUpdate().first();
        if (product && Number(product.stock_quantity) < Number(item.quantity)) {
          throw new BadRequestException(
            `İptal edilemiyor: ${product.name} stoğu yetersiz (açılış sonrası ürün satılmış olabilir)`,
          );
        }
        await trx('products').where('id', item.product_id).update({
          stock_quantity: trx.raw('stock_quantity - ?', [item.quantity]),
          updated_at: trx.fn.now(),
        });
        await updateWarehouseStock(trx, {
          productId: item.product_id,
          delta: -Number(item.quantity),
          warehouseId: entry.warehouse_id || null,
        });
      }

      await trx('opening_stock_entries').where('id', id).update({ status: 'cancelled', updated_at: trx.fn.now() });

      // Ters stok hareketi
      if (entry.warehouse_id) {
        for (const item of entry.items) {
          if (!item.product_id) continue;
          const product = await trx('products').where('id', item.product_id).first();
          await trx('stock_movements').insert({
            warehouse_id: entry.warehouse_id,
            product_id: item.product_id,
            movement_type: 'opening_cancel',
            quantity: -Number(item.quantity),
            stock_after: Number(product.stock_quantity) || 0,
            reference_type: 'opening_stock',
            reference_id: entry.id,
            notes: `Açılış iptali: ${entry.entry_number}`,
            movement_date: new Date(),
          });
        }
      }

      await this.activityLog.log({
        action: 'opening_stock_cancelled',
        entityType: 'opening_stock',
        entityId: id,
        oldValues: { status: entry.status, entry_number: entry.entry_number },
      });
    });
  }
}
