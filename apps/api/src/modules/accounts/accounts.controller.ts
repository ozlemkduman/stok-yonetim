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
    return this.service.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      accountType,
      isActive,
      sortBy,
      sortOrder,
    });
  }

  @Get('summary')
  async getSummary() {
    return this.service.getSummary();
  }

  @Get('transfers')
  async getTransfers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('accountId') accountId?: string,
  ) {
    return this.service.getTransfers({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      accountId,
    });
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
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
    return this.service.getMovements(id, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      startDate,
      endDate,
      movementType,
    });
  }

  @Post()
  async create(@Body() dto: CreateAccountDto) {
    return this.service.create(dto);
  }

  @Post('transfers')
  async createTransfer(@Body() dto: CreateTransferDto) {
    return this.service.createTransfer(dto);
  }

  @Post(':id/movements')
  async addMovement(@Param('id') id: string, @Body() dto: CreateMovementDto) {
    return this.service.addMovement(id, dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateAccountDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.service.delete(id);
    return { message: 'Hesap silindi' };
  }
}
