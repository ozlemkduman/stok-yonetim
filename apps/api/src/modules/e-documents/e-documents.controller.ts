import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { EDocumentsService } from './e-documents.service';
import { CreateEDocumentDto } from './dto';

@Controller('e-documents')
export class EDocumentsController {
  constructor(private readonly service: EDocumentsService) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('documentType') documentType?: string,
    @Query('status') status?: string,
    @Query('referenceType') referenceType?: string,
    @Query('customerId') customerId?: string,
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
      documentType,
      status,
      referenceType,
      customerId,
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

  @Get('summary')
  async getSummary() {
    const data = await this.service.getSummary();
    return { success: true, data };
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const data = await this.service.findById(id);
    return { success: true, data };
  }

  @Post()
  async create(@Body() dto: CreateEDocumentDto) {
    const data = await this.service.create(dto);
    return { success: true, data };
  }

  @Post(':id/send')
  async send(@Param('id') id: string) {
    const data = await this.service.send(id);
    return { success: true, data };
  }

  @Post(':id/check-status')
  async checkStatus(@Param('id') id: string) {
    const data = await this.service.checkStatus(id);
    return { success: true, data };
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string) {
    const data = await this.service.cancel(id);
    return { success: true, data };
  }
}
