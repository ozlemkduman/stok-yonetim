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
    const params = {
      page: query.page || 1,
      limit: query.limit || 20,
      search: query.search,
      sortBy: query.sortBy || 'created_at',
      sortOrder: query.sortOrder || 'desc',
      isActive: query.isActive === 'true' ? true : query.isActive === 'false' ? false : undefined,
    };

    return this.customersService.findAll(params);
  }

  @Get('with-debt')
  async getCustomersWithDebt() {
    return this.customersService.getCustomersWithDebt();
  }

  @Get('with-credit')
  async getCustomersWithCredit() {
    return this.customersService.getCustomersWithCredit();
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.findById(id);
  }

  @Get(':id/detail')
  async getCustomerDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.getCustomerDetail(id);
  }

  @Get(':id/sales')
  async getCustomerSales(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.getCustomerSales(id);
  }

  @Get(':id/returns')
  async getCustomerReturns(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.getCustomerReturns(id);
  }

  @Get(':id/payments')
  async getCustomerPayments(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.getCustomerPayments(id);
  }

  @Get(':id/stats')
  async getCustomerStats(@Param('id', ParseUUIDPipe) id: string) {
    return this.customersService.getCustomerStats(id);
  }

  @Post()
  async create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    await this.customersService.delete(id);
    return { message: 'Musteri basariyla silindi' };
  }
}
