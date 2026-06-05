import { Controller, Get, Post, Patch, Body, Param, Query, ParseUUIDPipe, Req } from '@nestjs/common';
import { StockCountService } from './stock-count.service';
import { CreateStockCountDto, UpdateStockCountItemDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { validateSortColumn } from '../../common/utils/validate-sort';

const ALLOWED_SORT = ['started_at', 'count_number', 'status', 'created_at'];

@Controller('stock-count')
export class StockCountController {
  constructor(private readonly service: StockCountService) {}

  @Get()
  async findAll(@Query() query: PaginationDto & { status?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const result = await this.service.findAll({
      page, limit,
      search: query.search,
      status: query.status,
      sortBy: validateSortColumn(query.sortBy || 'started_at', ALLOWED_SORT, 'started_at'),
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
  async create(@Body() dto: CreateStockCountDto, @Req() req: any) {
    return { success: true, data: await this.service.create(dto, req.user?.sub) };
  }

  @Patch(':id/items/:itemId')
  async updateItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateStockCountItemDto,
    @Req() req: any,
  ) {
    return { success: true, data: await this.service.updateItem(id, itemId, dto, req.user?.sub) };
  }

  @Patch(':id/complete')
  async complete(@Param('id', ParseUUIDPipe) id: string, @Req() req: any) {
    return { success: true, data: await this.service.complete(id, req.user?.sub) };
  }

  @Patch(':id/cancel')
  async cancel(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.cancel(id);
    return { success: true, message: 'Sayım iptal edildi' };
  }
}
