import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, Req } from '@nestjs/common';
import { ChequesService } from './cheques.service';
import { CreateChequeDto, UpdateChequeStatusDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { validateSortColumn } from '../../common/utils/validate-sort';

const ALLOWED_SORT = ['due_date', 'amount', 'created_at', 'status', 'issue_date'];

@Controller('cheques')
export class ChequesController {
  constructor(private readonly service: ChequesService) {}

  @Get()
  async findAll(@Query() query: PaginationDto & { type?: string; direction?: string; status?: string; startDate?: string; endDate?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const result = await this.service.findAll({
      page, limit,
      search: query.search,
      type: query.type,
      direction: query.direction,
      status: query.status,
      startDate: query.startDate,
      endDate: query.endDate,
      sortBy: validateSortColumn(query.sortBy || 'due_date', ALLOWED_SORT, 'due_date'),
      sortOrder: query.sortOrder || 'asc',
    });
    return {
      success: true,
      data: result.items,
      meta: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) },
    };
  }

  @Get('stats')
  async getStats() {
    return { success: true, data: await this.service.getStats() };
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return { success: true, data: await this.service.findById(id) };
  }

  @Post()
  async create(@Body() dto: CreateChequeDto, @Req() req: any) {
    return { success: true, data: await this.service.create(dto, req.user?.sub) };
  }

  @Patch(':id/status')
  async updateStatus(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateChequeStatusDto) {
    return { success: true, data: await this.service.updateStatus(id, dto) };
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.delete(id);
    return { success: true, message: 'Silindi' };
  }
}
