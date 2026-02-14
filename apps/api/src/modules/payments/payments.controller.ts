import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  async findAll(@Query() query: PaginationDto & { customerId?: string; method?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const result = await this.paymentsService.findAll({
      page,
      limit,
      customerId: query.customerId,
      method: query.method,
      sortBy: query.sortBy || 'payment_date',
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

  @Post()
  async create(@Body() dto: CreatePaymentDto) {
    const data = await this.paymentsService.create(dto);
    return { success: true, data };
  }
}
