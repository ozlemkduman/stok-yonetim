import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  async findAll(@Query() query: PaginationDto & { customerId?: string; method?: string }) {
    return this.paymentsService.findAll({
      page: query.page || 1,
      limit: query.limit || 20,
      customerId: query.customerId,
      method: query.method,
      sortBy: query.sortBy || 'payment_date',
      sortOrder: query.sortOrder || 'desc',
    });
  }

  @Post()
  async create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(dto);
  }
}
