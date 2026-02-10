import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto, UpdateQuoteDto, ConvertToSaleDto } from './dto';

@Controller('quotes')
export class QuotesController {
  constructor(private readonly service: QuotesService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('customerId') customerId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.service.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      customerId,
      status,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    });
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  async create(@Body() dto: CreateQuoteDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateQuoteDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/send')
  async send(@Param('id') id: string) {
    return this.service.send(id);
  }

  @Post(':id/accept')
  async accept(@Param('id') id: string) {
    return this.service.accept(id);
  }

  @Post(':id/reject')
  async reject(@Param('id') id: string) {
    return this.service.reject(id);
  }

  @Post(':id/convert')
  async convertToSale(@Param('id') id: string, @Body() dto: ConvertToSaleDto) {
    return this.service.convertToSale(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.service.delete(id);
    return { message: 'Teklif silindi' };
  }
}
