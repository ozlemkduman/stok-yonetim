import { Controller, Get, Post, Patch, Body, Param, Query, ParseUUIDPipe, Req } from '@nestjs/common';
import { OpeningStockService } from './opening-stock.service';
import { CreateOpeningStockDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { validateSortColumn } from '../../common/utils/validate-sort';

const ALLOWED_SORT = ['entry_date', 'entry_number', 'status', 'created_at'];

@Controller('opening-stock')
export class OpeningStockController {
  constructor(private readonly service: OpeningStockService) {}

  @Get()
  async findAll(@Query() query: PaginationDto & { status?: string; startDate?: string; endDate?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const result = await this.service.findAll({
      page, limit,
      search: query.search,
      status: query.status,
      startDate: query.startDate,
      endDate: query.endDate,
      sortBy: validateSortColumn(query.sortBy || 'entry_date', ALLOWED_SORT, 'entry_date'),
      sortOrder: query.sortOrder || 'desc',
    });
    return {
      success: true,
      data: result.items,
      meta: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) },
    };
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return { success: true, data: await this.service.findById(id) };
  }

  @Post()
  async create(@Body() dto: CreateOpeningStockDto, @Req() req: any) {
    return { success: true, data: await this.service.create(dto, req.user?.sub) };
  }

  @Patch(':id/cancel')
  async cancel(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.cancel(id);
    return { success: true, message: 'Açılış kaydı iptal edildi' };
  }
}
