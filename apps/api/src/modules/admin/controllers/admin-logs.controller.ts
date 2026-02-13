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
    return this.logsService.findAll({
      ...params,
      startDate: params.startDate ? new Date(params.startDate) : undefined,
      endDate: params.endDate ? new Date(params.endDate) : undefined,
    });
  }

  @Get('action-types')
  async getActionTypes() {
    return this.logsService.getActionTypes();
  }

  @Get('entity-types')
  async getEntityTypes() {
    return this.logsService.getEntityTypes();
  }
}
