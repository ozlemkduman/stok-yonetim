import { Controller, Get, Post, Patch, Body, Param, Query, ParseUUIDPipe, Req } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { validateSortColumn } from '../../common/utils/validate-sort';

const ALLOWED_SORT = ['purchase_date', 'grand_total', 'purchase_number', 'status', 'created_at'];

@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Get()
  async findAll(@Query() query: PaginationDto & { supplierId?: string; status?: string; startDate?: string; endDate?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const result = await this.purchasesService.findAll({
      page, limit,
      search: query.search,
      supplierId: query.supplierId,
      status: query.status,
      startDate: query.startDate,
      endDate: query.endDate,
      sortBy: validateSortColumn(query.sortBy || 'purchase_date', ALLOWED_SORT, 'purchase_date'),
      sortOrder: query.sortOrder || 'desc',
    });
    return {
      success: true,
      data: result.items,
      meta: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) },
    };
  }

  @Get('stats')
  async getStats(@Query() query: { supplierId?: string; status?: string; startDate?: string; endDate?: string; search?: string }) {
    return { success: true, data: await this.purchasesService.getStats(query) };
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return { success: true, data: await this.purchasesService.findById(id) };
  }

  @Post()
  async create(@Body() dto: CreatePurchaseDto, @Req() req: any) {
    return { success: true, data: await this.purchasesService.create(dto, req.user?.sub) };
  }

  @Patch(':id/cancel')
  async cancel(@Param('id', ParseUUIDPipe) id: string) {
    await this.purchasesService.cancel(id);
    return { success: true, message: 'Alış iptal edildi' };
  }
}
