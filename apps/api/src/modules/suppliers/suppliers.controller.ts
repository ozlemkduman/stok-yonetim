import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, Req } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto, UpdateSupplierDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { validateSortColumn } from '../../common/utils/validate-sort';

const ALLOWED_SORT = ['name', 'balance', 'created_at'];

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  async findAll(@Query() query: PaginationDto & { isActive?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const isActive = query.isActive === 'false' ? false : true;
    const result = await this.suppliersService.findAll({
      page,
      limit,
      search: query.search,
      isActive,
      sortBy: validateSortColumn(query.sortBy || 'name', ALLOWED_SORT, 'name'),
      sortOrder: query.sortOrder || 'asc',
    });
    return {
      success: true,
      data: result.items,
      meta: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) },
    };
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return { success: true, data: await this.suppliersService.findById(id) };
  }

  @Post()
  async create(@Body() dto: CreateSupplierDto, @Req() req: any) {
    return { success: true, data: await this.suppliersService.create(dto, req.user?.sub) };
  }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSupplierDto) {
    return { success: true, data: await this.suppliersService.update(id, dto) };
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.suppliersService.delete(id);
    return { success: true, message: 'Tedarikçi pasifleştirildi' };
  }
}
