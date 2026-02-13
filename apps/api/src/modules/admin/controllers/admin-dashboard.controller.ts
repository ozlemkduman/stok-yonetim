import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminDashboardService } from '../services/admin-dashboard.service';
import { Roles, UserRole } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';

@Controller('admin/dashboard')
@UseGuards(RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get('stats')
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get('revenue')
  async getRevenue(@Query('months') months?: number) {
    return this.dashboardService.getRevenueByMonth(months || 12);
  }

  @Get('growth')
  async getTenantGrowth(@Query('months') months?: number) {
    return this.dashboardService.getTenantGrowth(months || 12);
  }

  @Get('plan-distribution')
  async getPlanDistribution() {
    return this.dashboardService.getPlanDistribution();
  }

  @Get('recent-activity')
  async getRecentActivity(@Query('limit') limit?: number) {
    return this.dashboardService.getRecentActivity(limit || 20);
  }
}
