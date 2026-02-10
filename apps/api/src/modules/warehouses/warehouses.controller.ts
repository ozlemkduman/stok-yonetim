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
    return this.service.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      isActive,
      sortBy,
      sortOrder,
    });
  }

  @Get('transfers')
  async getTransfers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('status') status?: string,
  ) {
    return this.service.getTransfers({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      warehouseId,
      status,
    });
  }

  @Get('transfers/:id')
  async getTransferById(@Param('id') id: string) {
    return this.service.getTransferById(id);
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
    return this.service.getMovements({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      warehouseId,
      productId,
      movementType,
      startDate,
      endDate,
    });
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Get(':id/stocks')
  async getStocks(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('lowStock') lowStock?: string,
  ) {
    return this.service.getStocks(id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      lowStock,
    });
  }

  @Post()
  async create(@Body() dto: CreateWarehouseDto) {
    return this.service.create(dto);
  }

  @Post('transfers')
  async createTransfer(@Body() dto: CreateTransferDto) {
    return this.service.createTransfer(dto);
  }

  @Post('transfers/:id/complete')
  async completeTransfer(@Param('id') id: string) {
    return this.service.completeTransfer(id);
  }

  @Post('transfers/:id/cancel')
  async cancelTransfer(@Param('id') id: string) {
    return this.service.cancelTransfer(id);
  }

  @Post(':id/adjust-stock')
  async adjustStock(@Param('id') id: string, @Body() dto: AdjustStockDto) {
    return this.service.adjustStock(id, dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateWarehouseDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.service.delete(id);
    return { message: 'Depo silindi' };
  }
}
