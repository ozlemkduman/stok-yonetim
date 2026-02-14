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
    const data = await this.dashboardService.getStats();
    return { success: true, data };
  }

  @Get('revenue')
  async getRevenue(@Query('months') months?: number) {
    const data = await this.dashboardService.getRevenueByMonth(months || 12);
    return { success: true, data };
  }

  @Get('growth')
  async getTenantGrowth(@Query('months') months?: number) {
    const data = await this.dashboardService.getTenantGrowth(months || 12);
    return { success: true, data };
  }

  @Get('plan-distribution')
  async getPlanDistribution() {
    const data = await this.dashboardService.getPlanDistribution();
    return { success: true, data };
  }

  @Get('recent-activity')
  async getRecentActivity(@Query('limit') limit?: number) {
    const data = await this.dashboardService.getRecentActivity(limit || 20);
    return { success: true, data };
  }
}
