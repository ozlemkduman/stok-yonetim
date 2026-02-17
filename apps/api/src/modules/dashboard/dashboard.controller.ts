import { Controller, Get, Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary(@Req() req: any) {
    const data = await this.dashboardService.getSummary(req.user?.tenantId);
    return { success: true, data };
  }

  @Get('recent-sales')
  async getRecentSales(@Req() req: any) {
    const data = await this.dashboardService.getRecentSales(5, req.user?.tenantId);
    return { success: true, data };
  }

  @Get('low-stock')
  async getLowStockProducts(@Req() req: any) {
    const data = await this.dashboardService.getLowStockProducts(5, req.user?.tenantId);
    return { success: true, data };
  }

  @Get('top-debtors')
  async getTopDebtors(@Req() req: any) {
    const data = await this.dashboardService.getTopCustomersWithDebt(5, req.user?.tenantId);
    return { success: true, data };
  }
}
