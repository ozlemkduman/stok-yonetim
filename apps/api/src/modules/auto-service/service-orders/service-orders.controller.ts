import { Controller, Get, Post, Patch, Body, Param, Query, ParseUUIDPipe, Req } from '@nestjs/common';
import { ServiceOrdersService } from './service-orders.service';
import { CreateServiceOrderDto, UpdateServiceOrderDto, RecordInvoiceDto } from './dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { validateSortColumn } from '../../../common/utils/validate-sort';
import { RequireSector } from '../../../common/decorators/require-sector.decorator';

const ALLOWED_SORT = ['order_number', 'status', 'opened_at', 'total_amount', 'created_at'];

@Controller('auto-service/service-orders')
@RequireSector('auto_service')
export class ServiceOrdersController {
  constructor(private readonly service: ServiceOrdersService) {}

  @Get()
  async findAll(@Query() query: PaginationDto & { status?: string; vehicleId?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const result = await this.service.findAll({
      page, limit,
      search: query.search,
      status: query.status,
      vehicleId: query.vehicleId, // bir aracın servis geçmişi için
      sortBy: validateSortColumn(query.sortBy || 'opened_at', ALLOWED_SORT, 'opened_at'),
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
  async create(@Body() dto: CreateServiceOrderDto, @Req() req: any) {
    return { success: true, data: await this.service.create(dto, req.user?.sub) };
  }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateServiceOrderDto) {
    return { success: true, data: await this.service.update(id, dto) };
  }

  @Patch(':id/invoice')
  async recordInvoice(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RecordInvoiceDto) {
    return { success: true, data: await this.service.recordInvoice(id, dto) };
  }
}
