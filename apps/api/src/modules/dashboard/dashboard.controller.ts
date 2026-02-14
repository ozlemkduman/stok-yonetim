import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary() {
    const data = await this.dashboardService.getSummary();
    return { success: true, data };
  }

  @Get('recent-sales')
  async getRecentSales() {
    const data = await this.dashboardService.getRecentSales();
    return { success: true, data };
  }

  @Get('low-stock')
  async getLowStockProducts() {
    const data = await this.dashboardService.getLowStockProducts();
    return { success: true, data };
  }

  @Get('top-debtors')
  async getTopDebtors() {
    const data = await this.dashboardService.getTopCustomersWithDebt();
    return { success: true, data };
  }
}
