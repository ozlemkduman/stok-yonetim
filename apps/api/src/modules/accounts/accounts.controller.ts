import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto, UpdateAccountDto, CreateMovementDto, CreateTransferDto } from './dto';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly service: AccountsService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('accountType') accountType?: string,
    @Query('isActive') isActive?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const result = await this.service.findAll({
      page: pageNum,
      limit: limitNum,
      accountType,
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

  @Get('summary')
  async getSummary() {
    const data = await this.service.getSummary();
    return { success: true, data };
  }

  @Get('transfers')
  async getTransfers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('accountId') accountId?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const result = await this.service.getTransfers({
      page: pageNum,
      limit: limitNum,
      accountId,
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

  @Get(':id/movements')
  async getMovements(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('movementType') movementType?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const result = await this.service.getMovements(id, {
      page: pageNum,
      limit: limitNum,
      startDate,
      endDate,
      movementType,
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
  async create(@Body() dto: CreateAccountDto) {
    const data = await this.service.create(dto);
    return { success: true, data };
  }

  @Post('transfers')
  async createTransfer(@Body() dto: CreateTransferDto) {
    const data = await this.service.createTransfer(dto);
    return { success: true, data };
  }

  @Post(':id/movements')
  async addMovement(@Param('id') id: string, @Body() dto: CreateMovementDto) {
    const data = await this.service.addMovement(id, dto);
    return { success: true, data };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateAccountDto) {
    const data = await this.service.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.service.delete(id);
    return { success: true, message: 'Hesap silindi' };
  }
}
