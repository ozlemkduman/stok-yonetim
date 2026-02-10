import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  async findAll(@Query() query: PaginationDto & { category?: string; startDate?: string; endDate?: string }) {
    return this.expensesService.findAll({
      page: query.page || 1,
      limit: query.limit || 20,
      category: query.category,
      startDate: query.startDate,
      endDate: query.endDate,
      sortBy: query.sortBy || 'expense_date',
      sortOrder: query.sortOrder || 'desc',
    });
  }

  @Get('by-category')
  async getByCategory(@Query() query: { startDate?: string; endDate?: string }) {
    return this.expensesService.getTotalByCategory(query.startDate, query.endDate);
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.expensesService.findById(id);
  }

  @Post()
  async create(@Body() dto: CreateExpenseDto) {
    return this.expensesService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateExpenseDto) {
    return this.expensesService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.expensesService.delete(id);
    return { message: 'Gider basariyla silindi' };
  }
}
