import { Controller, Get, Post, Body, Param, Query, ParseUUIDPipe, Req } from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { CreateReturnDto } from './dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { validateSortColumn } from '../../common/utils/validate-sort';

const ALLOWED_SORT_COLUMNS = ['return_date', 'total_amount', 'return_number', 'status', 'created_at'];

@Controller('returns')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Get()
  async findAll(@Query() query: PaginationDto & { customerId?: string; status?: string; startDate?: string; endDate?: string }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const result = await this.returnsService.findAll({
      page,
      limit,
      customerId: query.customerId,
      status: query.status,
      startDate: query.startDate,
      endDate: query.endDate,
      sortBy: validateSortColumn(query.sortBy || 'return_date', ALLOWED_SORT_COLUMNS, 'return_date'),
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
  async create(@Body() dto: CreateReturnDto, @Req() req: any) {
    const data = await this.returnsService.create(dto, req.user?.sub);
    return { success: true, data };
  }
}
