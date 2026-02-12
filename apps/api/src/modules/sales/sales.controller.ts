import { Controller, Get, Post, Patch, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  async findAll(@Query() query: PaginationDto & { customerId?: string; status?: string; startDate?: string; endDate?: string }) {
    return this.salesService.findAll({
      page: query.page || 1,
      limit: query.limit || 20,
      search: query.search,
      customerId: query.customerId,
      status: query.status,
      startDate: query.startDate,
      endDate: query.endDate,
      sortBy: query.sortBy || 'sale_date',
      sortOrder: query.sortOrder || 'desc',
    });
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.salesService.findById(id);
  }

  @Get(':id/detail')
  async findDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.salesService.findDetail(id);
  }

  @Post()
  async create(@Body() dto: CreateSaleDto) {
    return this.salesService.create(dto);
  }

  @Patch(':id/cancel')
  async cancel(@Param('id', ParseUUIDPipe) id: string) {
    await this.salesService.cancel(id);
    return { message: 'Satis iptal edildi' };
  }
}
