import { Controller, Get, Post, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { CreateReturnDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('returns')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Get()
  async findAll(@Query() query: PaginationDto & { customerId?: string }) {
    return this.returnsService.findAll({
      page: query.page || 1,
      limit: query.limit || 20,
      customerId: query.customerId,
      sortBy: query.sortBy || 'return_date',
      sortOrder: query.sortOrder || 'desc',
    });
  }

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.returnsService.findById(id);
  }

  @Post()
  async create(@Body() dto: CreateReturnDto) {
    return this.returnsService.create(dto);
  }
}
