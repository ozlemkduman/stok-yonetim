import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, Req } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dto';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { validateSortColumn } from '../../../common/utils/validate-sort';
import { RequireSector } from '../../../common/decorators/require-sector.decorator';

const ALLOWED_SORT = ['plate', 'brand', 'model', 'model_year', 'created_at'];

@Controller('auto-service/vehicles')
@RequireSector('auto_service')
export class VehiclesController {
  constructor(private readonly service: VehiclesService) {}

  @Get()
  async findAll(@Query() query: PaginationDto & { isActive?: string; customerId?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const result = await this.service.findAll({
      page, limit,
      search: query.search,
      isActive: query.isActive,
      customerId: query.customerId,
      sortBy: validateSortColumn(query.sortBy || 'created_at', ALLOWED_SORT, 'created_at'),
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
  async create(@Body() dto: CreateVehicleDto, @Req() req: any) {
    return { success: true, data: await this.service.create(dto, req.user?.sub) };
  }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateVehicleDto) {
    return { success: true, data: await this.service.update(id, dto) };
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.delete(id);
    return { success: true, message: 'Araç pasif edildi' };
  }
}
