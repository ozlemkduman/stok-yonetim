import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto, UpdateWarehouseDto, CreateTransferDto, AdjustStockDto } from './dto';

@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly service: WarehousesService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isActive') isActive?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const result = await this.service.findAll({
      page: pageNum,
      limit: limitNum,
      isActive,
      sortBy,
      sortOrder,
    });
    return {
      success: true,
      data: result.items,
      meta: {
        page: pageNum,
        limit: limitNum,
        total: result.total,
        totalPages: Math.ceil(result.total / limitNum),
      },
    };
  }

  @Get('transfers')
  async getTransfers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const result = await this.service.getTransfers({
      page: pageNum,
      limit: limitNum,
      warehouseId,
      status,
    });
    return {
      success: true,
      data: result.items,
      meta: {
        page: pageNum,
        limit: limitNum,
        total: result.total,
        totalPages: Math.ceil(result.total / limitNum),
      },
    };
  }

  @Get('transfers/:id')
  async getTransferById(@Param('id') id: string) {
    const data = await this.service.getTransferById(id);
    return { success: true, data };
  }

  @Get('movements')
  async getMovements(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('productId') productId?: string,
    @Query('movementType') movementType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const result = await this.service.getMovements({
      page: pageNum,
      limit: limitNum,
      warehouseId,
      productId,
      movementType,
      startDate,
      endDate,
    });
    return {
      success: true,
      data: result.items,
      meta: {
        page: pageNum,
        limit: limitNum,
        total: result.total,
        totalPages: Math.ceil(result.total / limitNum),
      },
    };
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const data = await this.service.findById(id);
    return { success: true, data };
  }

  @Get(':id/detail')
  async getDetail(@Param('id') id: string) {
    const data = await this.service.getDetail(id);
    return { success: true, data };
  }

  @Get(':id/stocks')
  async getStocks(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('lowStock') lowStock?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const result = await this.service.getStocks(id, {
      page: pageNum,
      limit: limitNum,
      search,
      lowStock,
    });
    return {
      success: true,
      data: result.items,
      meta: {
        page: pageNum,
        limit: limitNum,
        total: result.total,
        totalPages: Math.ceil(result.total / limitNum),
      },
    };
  }

  @Post()
  async create(@Body() dto: CreateWarehouseDto) {
    const data = await this.service.create(dto);
    return { success: true, data };
  }

  @Post('transfers')
  async createTransfer(@Body() dto: CreateTransferDto) {
    const data = await this.service.createTransfer(dto);
    return { success: true, data };
  }

  @Post('transfers/:id/complete')
  async completeTransfer(@Param('id') id: string) {
    const data = await this.service.completeTransfer(id);
    return { success: true, data };
  }

  @Post('transfers/:id/cancel')
  async cancelTransfer(@Param('id') id: string) {
    const data = await this.service.cancelTransfer(id);
    return { success: true, data };
  }

  @Post(':id/adjust-stock')
  async adjustStock(@Param('id') id: string, @Body() dto: AdjustStockDto) {
    const data = await this.service.adjustStock(id, dto);
    return { success: true, data };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateWarehouseDto) {
    const data = await this.service.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.service.delete(id);
    return { success: true, message: 'Depo silindi' };
  }
}
