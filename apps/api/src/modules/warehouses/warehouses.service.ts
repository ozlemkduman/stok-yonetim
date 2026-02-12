import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { WarehousesRepository, Warehouse, StockTransfer } from './warehouses.repository';
import { CreateWarehouseDto, UpdateWarehouseDto, CreateTransferDto, AdjustStockDto } from './dto';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class WarehousesService {
  constructor(
    private readonly repository: WarehousesRepository,
    private readonly db: DatabaseService,
  ) {}

  // Warehouses
  async findAll(params: {
    page?: number;
    limit?: number;
    isActive?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const sortBy = params.sortBy || 'created_at';
    const sortOrder = params.sortOrder || 'desc';
    const isActive = params.isActive === 'true' ? true : params.isActive === 'false' ? false : undefined;

    return this.repository.findAll({ page, limit, isActive, sortBy, sortOrder });
  }

  async findById(id: string): Promise<Warehouse> {
    const warehouse = await this.repository.findById(id);
    if (!warehouse) {
      throw new NotFoundException('Depo bulunamadi');
    }
    return warehouse;
  }

  async getDetail(id: string) {
    const warehouse = await this.findById(id);

    const [stocksResult, movementsResult, transfersResult] = await Promise.all([
      this.repository.getStocks({ warehouseId: id, page: 1, limit: 100 }),
      this.repository.findMovements({ warehouseId: id, page: 1, limit: 50 }),
      this.repository.findTransfers({ warehouseId: id, page: 1, limit: 50 }),
    ]);

    // Calculate stats
    const totalProducts = stocksResult.total;
    const totalQuantity = stocksResult.items.reduce((sum, s) => sum + Number(s.quantity), 0);
    const lowStockCount = stocksResult.items.filter(s => Number(s.quantity) <= Number(s.min_stock_level)).length;
    const pendingTransfers = transfersResult.items.filter(t => t.status === 'pending').length;

    return {
      warehouse,
      stocks: stocksResult.items,
      movements: movementsResult.items,
      transfers: transfersResult.items,
      stats: {
        totalProducts,
        totalQuantity,
        lowStockCount,
        pendingTransfers,
        movementsCount: movementsResult.total,
        transfersCount: transfersResult.total,
      },
    };
  }

  async create(dto: CreateWarehouseDto): Promise<Warehouse> {
    // Check code uniqueness
    const existing = await this.repository.findByCode(dto.code);
    if (existing) {
      throw new ConflictException('Bu depo kodu zaten kullanimda');
    }

    if (dto.is_default) {
      await this.db.knex('warehouses').update({ is_default: false });
    }

    return this.repository.create({
      name: dto.name,
      code: dto.code.toUpperCase(),
      address: dto.address,
      phone: dto.phone,
      manager_name: dto.manager_name,
      is_default: dto.is_default || false,
    });
  }

  async update(id: string, dto: UpdateWarehouseDto): Promise<Warehouse> {
    await this.findById(id);

    if (dto.is_default === true) {
      await this.repository.setDefault(id);
    }

    return this.repository.update(id, dto);
  }

  async delete(id: string): Promise<void> {
    const warehouse = await this.findById(id);

    if (warehouse.is_default) {
      throw new BadRequestException('Varsayilan depo silinemez');
    }

    await this.repository.delete(id);
  }

  // Stocks
  async getStocks(warehouseId: string, params: {
    page?: number;
    limit?: number;
    search?: string;
    lowStock?: string;
  }) {
    await this.findById(warehouseId);

    return this.repository.getStocks({
      warehouseId,
      page: params.page || 1,
      limit: params.limit || 20,
      search: params.search,
      lowStock: params.lowStock === 'true',
    });
  }

  async adjustStock(warehouseId: string, dto: AdjustStockDto) {
    const warehouse = await this.findById(warehouseId);

    if (!warehouse.is_active) {
      throw new BadRequestException('Pasif depoda stok ayarlamasi yapilamaz');
    }

    return this.db.transaction(async (trx) => {
      const currentStock = await this.repository.getStockByProduct(warehouseId, dto.product_id);
      const currentQty = currentStock?.quantity || 0;

      let newQty: number;
      let movementQty: number;

      switch (dto.adjustment_type) {
        case 'add':
          newQty = currentQty + dto.quantity;
          movementQty = dto.quantity;
          break;
        case 'subtract':
          newQty = currentQty - dto.quantity;
          if (newQty < 0) {
            throw new BadRequestException('Yetersiz stok');
          }
          movementQty = -dto.quantity;
          break;
        case 'set':
          newQty = dto.quantity;
          movementQty = dto.quantity - currentQty;
          break;
      }

      await this.repository.updateStock(warehouseId, dto.product_id, newQty, trx);

      await this.repository.createMovement({
        warehouse_id: warehouseId,
        product_id: dto.product_id,
        movement_type: 'adjustment',
        quantity: movementQty,
        stock_after: newQty,
        reference_type: 'adjustment',
        notes: dto.notes,
        movement_date: new Date(),
      }, trx);

      return { success: true, new_quantity: newQty };
    });
  }

  // Transfers
  async getTransfers(params: {
    page?: number;
    limit?: number;
    warehouseId?: string;
    status?: string;
  }) {
    return this.repository.findTransfers({
      page: params.page || 1,
      limit: params.limit || 20,
      warehouseId: params.warehouseId,
      status: params.status,
    });
  }

  async getTransferById(id: string) {
    const transfer = await this.repository.findTransferById(id);
    if (!transfer) {
      throw new NotFoundException('Transfer bulunamadi');
    }

    const items = await this.repository.findTransferItems(id);
    return { ...transfer, items };
  }

  async createTransfer(dto: CreateTransferDto): Promise<StockTransfer> {
    if (dto.from_warehouse_id === dto.to_warehouse_id) {
      throw new BadRequestException('Ayni depolar arasinda transfer yapilamaz');
    }

    const fromWarehouse = await this.findById(dto.from_warehouse_id);
    const toWarehouse = await this.findById(dto.to_warehouse_id);

    if (!fromWarehouse.is_active || !toWarehouse.is_active) {
      throw new BadRequestException('Pasif depolar arasinda transfer yapilamaz');
    }

    // Check stock availability
    for (const item of dto.items) {
      const stock = await this.repository.getStockByProduct(dto.from_warehouse_id, item.product_id);
      if (!stock || stock.quantity < item.quantity) {
        throw new BadRequestException(`Yetersiz stok: ${item.product_id}`);
      }
    }

    return this.db.transaction(async (trx) => {
      const transferNumber = await this.repository.generateTransferNumber();
      const transferDate = dto.transfer_date ? new Date(dto.transfer_date) : new Date();

      const transfer = await this.repository.createTransfer({
        transfer_number: transferNumber,
        from_warehouse_id: dto.from_warehouse_id,
        to_warehouse_id: dto.to_warehouse_id,
        transfer_date: transferDate,
        status: 'pending',
        notes: dto.notes,
      }, dto.items, trx);

      // Deduct from source warehouse
      for (const item of dto.items) {
        const newQty = await this.repository.incrementStock(dto.from_warehouse_id, item.product_id, -item.quantity, trx);

        await this.repository.createMovement({
          warehouse_id: dto.from_warehouse_id,
          product_id: item.product_id,
          movement_type: 'transfer_out',
          quantity: -item.quantity,
          stock_after: newQty,
          reference_type: 'transfer',
          reference_id: transfer.id,
          movement_date: transferDate,
        }, trx);
      }

      return transfer;
    });
  }

  async completeTransfer(id: string): Promise<StockTransfer> {
    const transfer = await this.repository.findTransferById(id);

    if (!transfer) {
      throw new NotFoundException('Transfer bulunamadi');
    }

    if (transfer.status === 'completed') {
      throw new BadRequestException('Transfer zaten tamamlanmis');
    }

    if (transfer.status === 'cancelled') {
      throw new BadRequestException('Iptal edilmis transfer tamamlanamaz');
    }

    const items = await this.repository.findTransferItems(id);

    return this.db.transaction(async (trx) => {
      // Add to destination warehouse
      for (const item of items) {
        const newQty = await this.repository.incrementStock(transfer.to_warehouse_id, item.product_id, item.quantity, trx);

        await this.repository.createMovement({
          warehouse_id: transfer.to_warehouse_id,
          product_id: item.product_id,
          movement_type: 'transfer_in',
          quantity: item.quantity,
          stock_after: newQty,
          reference_type: 'transfer',
          reference_id: transfer.id,
          movement_date: new Date(),
        }, trx);
      }

      await this.repository.updateTransferStatus(id, 'completed', trx);

      return { ...transfer, status: 'completed' };
    });
  }

  async cancelTransfer(id: string): Promise<StockTransfer> {
    const transfer = await this.repository.findTransferById(id);

    if (!transfer) {
      throw new NotFoundException('Transfer bulunamadi');
    }

    if (transfer.status === 'completed') {
      throw new BadRequestException('Tamamlanmis transfer iptal edilemez');
    }

    if (transfer.status === 'cancelled') {
      throw new BadRequestException('Transfer zaten iptal edilmis');
    }

    const items = await this.repository.findTransferItems(id);

    return this.db.transaction(async (trx) => {
      // Return stock to source warehouse
      for (const item of items) {
        const newQty = await this.repository.incrementStock(transfer.from_warehouse_id, item.product_id, item.quantity, trx);

        await this.repository.createMovement({
          warehouse_id: transfer.from_warehouse_id,
          product_id: item.product_id,
          movement_type: 'adjustment',
          quantity: item.quantity,
          stock_after: newQty,
          reference_type: 'transfer',
          reference_id: transfer.id,
          notes: 'Transfer iptali',
          movement_date: new Date(),
        }, trx);
      }

      await this.repository.updateTransferStatus(id, 'cancelled', trx);

      return { ...transfer, status: 'cancelled' };
    });
  }

  // Movements
  async getMovements(params: {
    page?: number;
    limit?: number;
    warehouseId?: string;
    productId?: string;
    movementType?: string;
    startDate?: string;
    endDate?: string;
  }) {
    return this.repository.findMovements({
      page: params.page || 1,
      limit: params.limit || 20,
      warehouseId: params.warehouseId,
      productId: params.productId,
      movementType: params.movementType,
      startDate: params.startDate,
      endDate: params.endDate,
    });
  }
}
