import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, Req } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { validateSortColumn } from '../../common/utils/validate-sort';

const ALLOWED_SORT = ['name', 'position', 'hire_date', 'created_at'];

@Controller('employees')
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}

  @Get()
  async findAll(@Query() query: PaginationDto & { isActive?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const result = await this.service.findAll({
      page, limit,
      search: query.search,
      isActive: query.isActive,
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
    return { success: true, data: await this.service.findById(id) };
  }

  @Post()
  async create(@Body() dto: CreateEmployeeDto, @Req() req: any) {
    return { success: true, data: await this.service.create(dto, req.user?.sub) };
  }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEmployeeDto) {
    return { success: true, data: await this.service.update(id, dto) };
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.delete(id);
    return { success: true, message: 'Çalışan pasif edildi' };
  }
}
