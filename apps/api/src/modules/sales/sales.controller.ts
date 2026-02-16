import { Controller, Get, Post, Patch, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { validateSortColumn } from '../../common/utils/validate-sort';

const ALLOWED_SORT_COLUMNS = ['sale_date', 'grand_total', 'invoice_number', 'status', 'created_at'];

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  async findAll(@Query() query: PaginationDto & { customerId?: string; status?: string; startDate?: string; endDate?: string; includeVat?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const result = await this.salesService.findAll({
      page,
      limit,
      search: query.search,
      customerId: query.customerId,
      status: query.status,
      startDate: query.startDate,
      endDate: query.endDate,
      includeVat: query.includeVat,
      sortBy: validateSortColumn(query.sortBy || 'sale_date', ALLOWED_SORT_COLUMNS, 'sale_date'),
      sortOrder: query.sortOrder || 'desc',
    });
    return {
      success: true,
      data: result.items,
      meta: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.salesService.findById(id);
    return { success: true, data };
  }

  @Get(':id/detail')
  async findDetail(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.salesService.findDetail(id);
    return { success: true, data };
  }

  @Post()
  async create(@Body() dto: CreateSaleDto) {
    const data = await this.salesService.create(dto);
    return { success: true, data };
  }

  @Patch(':id/cancel')
  async cancel(@Param('id', ParseUUIDPipe) id: string) {
    await this.salesService.cancel(id);
    return { success: true, message: 'Satis iptal edildi' };
  }
}
