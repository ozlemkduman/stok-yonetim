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
    return this.service.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      documentType,
      status,
      referenceType,
      customerId,
      startDate,
      endDate,
      sortBy,
      sortOrder,
    });
  }

  @Get('summary')
  async getSummary() {
    return this.service.getSummary();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  async create(@Body() dto: CreateEDocumentDto) {
    return this.service.create(dto);
  }

  @Post(':id/send')
  async send(@Param('id') id: string) {
    return this.service.send(id);
  }

  @Post(':id/check-status')
  async checkStatus(@Param('id') id: string) {
    return this.service.checkStatus(id);
  }

  @Post(':id/cancel')
  async cancel(@Param('id') id: string) {
    return this.service.cancel(id);
  }
}
