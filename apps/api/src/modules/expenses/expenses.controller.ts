import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe, Req } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { validateSortColumn } from '../../common/utils/validate-sort';

const ALLOWED_SORT_COLUMNS = ['expense_date', 'amount', 'category', 'description', 'created_at'];

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  async findAll(@Query() query: PaginationDto & { category?: string; startDate?: string; endDate?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const result = await this.expensesService.findAll({
      page,
      limit,
      category: query.category,
      startDate: query.startDate,
      endDate: query.endDate,
      sortBy: validateSortColumn(query.sortBy || 'expense_date', ALLOWED_SORT_COLUMNS, 'expense_date'),
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

  @Get('by-category')
  async getByCategory(@Query() query: { startDate?: string; endDate?: string }) {
    const data = await this.expensesService.getTotalByCategory(query.startDate, query.endDate);
    return { success: true, data };
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.expensesService.findById(id);
    return { success: true, data };
  }

  @Post()
  async create(@Body() dto: CreateExpenseDto, @Req() req: any) {
    const data = await this.expensesService.create(dto, req.user?.sub);
    return { success: true, data };
  }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateExpenseDto) {
    const data = await this.expensesService.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.expensesService.delete(id);
    return { success: true, message: 'Gider basariyla silindi' };
  }
}
