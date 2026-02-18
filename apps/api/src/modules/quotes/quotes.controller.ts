import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
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
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    const result = await this.service.findAll({
      page: pageNum,
      limit: limitNum,
      search,
      customerId,
      status,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    });

    return {
      success: true,
      data: result.items,
      meta: {
        page: pageNum,
        limit: limitNum,
        total: result.total,
        totalPages: Math.ceil(result.total / limitNum),
      },
    };
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const quote = await this.service.findById(id);
    return { success: true, data: quote };
  }

  @Post()
  async create(@Body() dto: CreateQuoteDto, @Req() req: any) {
    const quote = await this.service.create(dto, req.user?.sub);
    return { success: true, data: quote };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateQuoteDto) {
    const quote = await this.service.update(id, dto);
    return { success: true, data: quote };
  }

  @Post(':id/send')
  async send(@Param('id') id: string) {
    const quote = await this.service.send(id);
    return { success: true, data: quote };
  }

  @Post(':id/accept')
  async accept(@Param('id') id: string) {
    const quote = await this.service.accept(id);
    return { success: true, data: quote };
  }

  @Post(':id/reject')
  async reject(@Param('id') id: string) {
    const quote = await this.service.reject(id);
    return { success: true, data: quote };
  }

  @Post(':id/convert')
  async convertToSale(@Param('id') id: string, @Body() dto: ConvertToSaleDto) {
    const sale = await this.service.convertToSale(id, dto);
    return { success: true, data: sale };
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.service.delete(id);
    return { success: true, message: 'Teklif silindi' };
  }
}
