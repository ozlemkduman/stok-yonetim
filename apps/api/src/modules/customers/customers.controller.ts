import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  async findAll(@Query() query: PaginationDto & { isActive?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const params = {
      page,
      limit,
      search: query.search,
      sortBy: query.sortBy || 'created_at',
      sortOrder: query.sortOrder || 'desc',
      isActive: query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined,
    };

    const result = await this.customersService.findAll(params);
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

  @Get('with-debt')
  async getCustomersWithDebt() {
    const data = await this.customersService.getCustomersWithDebt();
    return { success: true, data };
  }

  @Get('with-credit')
  async getCustomersWithCredit() {
    const data = await this.customersService.getCustomersWithCredit();
    return { success: true, data };
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.customersService.findById(id);
    return { success: true, data };
  }

  @Get(':id/detail')
  async getCustomerDetail(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.customersService.getCustomerDetail(id);
    return { success: true, data };
  }

  @Get(':id/sales')
  async getCustomerSales(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.customersService.getCustomerSales(id);
    return { success: true, data };
  }

  @Get(':id/returns')
  async getCustomerReturns(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.customersService.getCustomerReturns(id);
    return { success: true, data };
  }

  @Get(':id/payments')
  async getCustomerPayments(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.customersService.getCustomerPayments(id);
    return { success: true, data };
  }

  @Get(':id/stats')
  async getCustomerStats(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.customersService.getCustomerStats(id);
    return { success: true, data };
  }

  @Post()
  async create(@Body() dto: CreateCustomerDto) {
    const data = await this.customersService.create(dto);
    return { success: true, data };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    const data = await this.customersService.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.customersService.delete(id);
    return { success: true, message: 'Musteri basariyla silindi' };
  }
}
