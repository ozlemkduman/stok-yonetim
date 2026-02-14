import { Controller, Get, Post, Body, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { CreateReturnDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';

@Controller('returns')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Get()
  async findAll(@Query() query: PaginationDto & { customerId?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const result = await this.returnsService.findAll({
      page,
      limit,
      customerId: query.customerId,
      sortBy: query.sortBy || 'return_date',
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

  @Get(':id')
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    const data = await this.returnsService.findById(id);
    return { success: true, data };
  }

  @Post()
  async create(@Body() dto: CreateReturnDto) {
    const data = await this.returnsService.create(dto);
    return { success: true, data };
  }
}
