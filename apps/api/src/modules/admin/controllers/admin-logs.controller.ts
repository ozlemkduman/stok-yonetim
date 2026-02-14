import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminLogsService } from '../services/admin-logs.service';
import { Roles, UserRole } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { PaginationParams } from '../../../common/dto/pagination.dto';

@Controller('admin/logs')
@UseGuards(RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AdminLogsController {
  constructor(private readonly logsService: AdminLogsService) {}

  @Get()
  async findAll(
    @Query()
    params: PaginationParams & {
      tenantId?: string;
      userId?: string;
      action?: string;
      entityType?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const result = await this.logsService.findAll({
      ...params,
      startDate: params.startDate ? new Date(params.startDate) : undefined,
      endDate: params.endDate ? new Date(params.endDate) : undefined,
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

  @Get('action-types')
  async getActionTypes() {
    const data = await this.logsService.getActionTypes();
    return { success: true, data };
  }

  @Get('entity-types')
  async getEntityTypes() {
    const data = await this.logsService.getEntityTypes();
    return { success: true, data };
  }
}
