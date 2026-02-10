import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { Knex } from 'knex';

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  manager_name: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface WarehouseStock {
  id: string;
  warehouse_id: string;
  product_id: string;
  quantity: number;
  min_stock_level: number;
  created_at: Date;
  updated_at: Date;
  product_name?: string;
  product_barcode?: string;
  warehouse_name?: string;
}

export interface StockTransfer {
  id: string;
  transfer_number: string;
  from_warehouse_id: string;
  to_warehouse_id: string;
  transfer_date: Date;
  status: string;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  from_warehouse_name?: string;
  to_warehouse_name?: string;
}

export interface StockTransferItem {
  id: string;
  transfer_id: string;
  product_id: string;
  quantity: number;
  created_at: Date;
  product_name?: string;
}

export interface StockMovement {
  id: string;
  warehouse_id: string;
  product_id: string;
  movement_type: string;
  quantity: number;
  stock_after: number;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  movement_date: Date;
  created_at: Date;
  warehouse_name?: string;
  product_name?: string;
}

@Injectable()
export class WarehousesRepository {
  constructor(private readonly db: DatabaseService) {}

  // Warehouses
  async findAll(params: {
    page: number;
    limit: number;
    isActive?: boolean;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }): Promise<{ items: Warehouse[]; total: number }> {
    const { page, limit, isActive, sortBy, sortOrder } = params;
    const offset = (page - 1) * limit;

    let query = this.db.knex('warehouses').select('*');
    let countQuery = this.db.knex('warehouses');

    if (isActive !== undefined) {
      query = query.where('is_active', isActive);
      countQuery = countQuery.where('is_active', isActive);
    }

    const [items, [{ count }]] = await Promise.all([
      query.orderBy(sortBy, sortOrder).limit(limit).offset(offset),
      countQuery.count('id as count'),
    ]);

    return { items, total: parseInt(count as string, 10) };
  }

  async findById(id: string): Promise<Warehouse | null> {
    return this.db.knex('warehouses').where('id', id).first() || null;
  }

  async findByCode(code: string): Promise<Warehouse | null> {
    return this.db.knex('warehouses').where('code', code).first() || null;
  }

  async findDefault(): Promise<Warehouse | null> {
    return this.db.knex('warehouses').where('is_default', true).where('is_active', true).first() || null;
  }

  async create(data: Partial<Warehouse>, trx?: Knex.Transaction): Promise<Warehouse> {
    const query = trx ? trx('warehouses') : this.db.knex('warehouses');
    const [warehouse] = await query.insert(data).returning('*');
    return warehouse;
  }

  async update(id: string, data: Partial<Warehouse>): Promise<Warehouse> {
    const [warehouse] = await this.db.knex('warehouses')
      .where('id', id)
      .update({ ...data, updated_at: this.db.knex.fn.now() })
      .returning('*');
    return warehouse;
  }

  async setDefault(id: string): Promise<void> {
    await this.db.knex.transaction(async (trx) => {
      await trx('warehouses').update({ is_default: false });
      await trx('warehouses').where('id', id).update({ is_default: true, updated_at: trx.fn.now() });
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.knex('warehouses').where('id', id).update({ is_active: false, updated_at: this.db.knex.fn.now() });
  }

  // Warehouse Stocks
  async getStocks(params: {
    warehouseId: string;
    page: number;
    limit: number;
    search?: string;
    lowStock?: boolean;
  }): Promise<{ items: WarehouseStock[]; total: number }> {
    const { warehouseId, page, limit, search, lowStock } = params;
    const offset = (page - 1) * limit;

    let query = this.db.knex('warehouse_stocks')
      .leftJoin('products', 'warehouse_stocks.product_id', 'products.id')
      .select('warehouse_stocks.*', 'products.name as product_name', 'products.barcode as product_barcode')
      .where('warehouse_stocks.warehouse_id', warehouseId);

    let countQuery = this.db.knex('warehouse_stocks').where('warehouse_id', warehouseId);

    if (search) {
      query = query.where((b) => b.whereILike('products.name', `%${search}%`).orWhereILike('products.barcode', `%${search}%`));
    }

    if (lowStock) {
      query = query.whereRaw('warehouse_stocks.quantity <= warehouse_stocks.min_stock_level');
      countQuery = countQuery.whereRaw('quantity <= min_stock_level');
    }

    const [items, [{ count }]] = await Promise.all([
      query.orderBy('products.name', 'asc').limit(limit).offset(offset),
      countQuery.count('id as count'),
    ]);

    return { items, total: parseInt(count as string, 10) };
  }

  async getStockByProduct(warehouseId: string, productId: string): Promise<WarehouseStock | null> {
    return this.db.knex('warehouse_stocks')
      .where('warehouse_id', warehouseId)
      .where('product_id', productId)
      .first() || null;
  }

  async updateStock(warehouseId: string, productId: string, quantity: number, trx?: Knex.Transaction): Promise<void> {
    const query = trx ? trx('warehouse_stocks') : this.db.knex('warehouse_stocks');

    const existing = await query.clone()
      .where('warehouse_id', warehouseId)
      .where('product_id', productId)
      .first();

    if (existing) {
      await query
        .where('warehouse_id', warehouseId)
        .where('product_id', productId)
        .update({ quantity, updated_at: this.db.knex.fn.now() });
    } else {
      await query.insert({ warehouse_id: warehouseId, product_id: productId, quantity });
    }
  }

  async incrementStock(warehouseId: string, productId: string, amount: number, trx?: Knex.Transaction): Promise<number> {
    const query = trx ? trx('warehouse_stocks') : this.db.knex('warehouse_stocks');

    const existing = await query.clone()
      .where('warehouse_id', warehouseId)
      .where('product_id', productId)
      .first();

    if (existing) {
      const newQty = Number(existing.quantity) + amount;
      await query
        .where('warehouse_id', warehouseId)
        .where('product_id', productId)
        .update({ quantity: newQty, updated_at: this.db.knex.fn.now() });
      return newQty;
    } else {
      await query.insert({ warehouse_id: warehouseId, product_id: productId, quantity: amount > 0 ? amount : 0 });
      return amount > 0 ? amount : 0;
    }
  }

  // Stock Transfers
  async findTransfers(params: {
    page: number;
    limit: number;
    warehouseId?: string;
    status?: string;
  }): Promise<{ items: StockTransfer[]; total: number }> {
    const { page, limit, warehouseId, status } = params;
    const offset = (page - 1) * limit;

    let query = this.db.knex('stock_transfers')
      .leftJoin('warehouses as from_wh', 'stock_transfers.from_warehouse_id', 'from_wh.id')
      .leftJoin('warehouses as to_wh', 'stock_transfers.to_warehouse_id', 'to_wh.id')
      .select('stock_transfers.*', 'from_wh.name as from_warehouse_name', 'to_wh.name as to_warehouse_name');

    let countQuery = this.db.knex('stock_transfers');

    if (warehouseId) {
      query = query.where((b) => b.where('from_warehouse_id', warehouseId).orWhere('to_warehouse_id', warehouseId));
      countQuery = countQuery.where((b) => b.where('from_warehouse_id', warehouseId).orWhere('to_warehouse_id', warehouseId));
    }

    if (status) {
      query = query.where('stock_transfers.status', status);
      countQuery = countQuery.where('status', status);
    }

    const [items, [{ count }]] = await Promise.all([
      query.orderBy('stock_transfers.transfer_date', 'desc').limit(limit).offset(offset),
      countQuery.count('stock_transfers.id as count'),
    ]);

    return { items, total: parseInt(count as string, 10) };
  }

  async findTransferById(id: string): Promise<StockTransfer | null> {
    return this.db.knex('stock_transfers')
      .leftJoin('warehouses as from_wh', 'stock_transfers.from_warehouse_id', 'from_wh.id')
      .leftJoin('warehouses as to_wh', 'stock_transfers.to_warehouse_id', 'to_wh.id')
      .select('stock_transfers.*', 'from_wh.name as from_warehouse_name', 'to_wh.name as to_warehouse_name')
      .where('stock_transfers.id', id)
      .first() || null;
  }

  async findTransferItems(transferId: string): Promise<StockTransferItem[]> {
    return this.db.knex('stock_transfer_items')
      .leftJoin('products', 'stock_transfer_items.product_id', 'products.id')
      .select('stock_transfer_items.*', 'products.name as product_name')
      .where('stock_transfer_items.transfer_id', transferId);
  }

  async generateTransferNumber(): Promise<string> {
    const today = new Date();
    const prefix = `TRN${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
    const [result] = await this.db.knex('stock_transfers').whereILike('transfer_number', `${prefix}%`).count('id as count');
    const count = parseInt(result.count as string, 10) + 1;
    return `${prefix}${String(count).padStart(4, '0')}`;
  }

  async createTransfer(data: Partial<StockTransfer>, items: { product_id: string; quantity: number }[], trx: Knex.Transaction): Promise<StockTransfer> {
    const [transfer] = await trx('stock_transfers').insert(data).returning('*');

    if (items.length > 0) {
      await trx('stock_transfer_items').insert(
        items.map((item) => ({ ...item, transfer_id: transfer.id }))
      );
    }

    return transfer;
  }

  async updateTransferStatus(id: string, status: string, trx?: Knex.Transaction): Promise<void> {
    const query = trx ? trx('stock_transfers') : this.db.knex('stock_transfers');
    await query.where('id', id).update({ status, updated_at: this.db.knex.fn.now() });
  }

  // Stock Movements
  async findMovements(params: {
    page: number;
    limit: number;
    warehouseId?: string;
    productId?: string;
    movementType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ items: StockMovement[]; total: number }> {
    const { page, limit, warehouseId, productId, movementType, startDate, endDate } = params;
    const offset = (page - 1) * limit;

    let query = this.db.knex('stock_movements')
      .leftJoin('warehouses', 'stock_movements.warehouse_id', 'warehouses.id')
      .leftJoin('products', 'stock_movements.product_id', 'products.id')
      .select('stock_movements.*', 'warehouses.name as warehouse_name', 'products.name as product_name');

    let countQuery = this.db.knex('stock_movements');

    if (warehouseId) {
      query = query.where('stock_movements.warehouse_id', warehouseId);
      countQuery = countQuery.where('warehouse_id', warehouseId);
    }

    if (productId) {
      query = query.where('stock_movements.product_id', productId);
      countQuery = countQuery.where('product_id', productId);
    }

    if (movementType) {
      query = query.where('stock_movements.movement_type', movementType);
      countQuery = countQuery.where('movement_type', movementType);
    }

    if (startDate) {
      query = query.where('stock_movements.movement_date', '>=', startDate);
      countQuery = countQuery.where('movement_date', '>=', startDate);
    }

    if (endDate) {
      query = query.where('stock_movements.movement_date', '<=', endDate);
      countQuery = countQuery.where('movement_date', '<=', endDate);
    }

    const [items, [{ count }]] = await Promise.all([
      query.orderBy('stock_movements.movement_date', 'desc').limit(limit).offset(offset),
      countQuery.count('stock_movements.id as count'),
    ]);

    return { items, total: parseInt(count as string, 10) };
  }

  async createMovement(data: Partial<StockMovement>, trx?: Knex.Transaction): Promise<StockMovement> {
    const query = trx ? trx('stock_movements') : this.db.knex('stock_movements');
    const [movement] = await query.insert(data).returning('*');
    return movement;
  }
}
