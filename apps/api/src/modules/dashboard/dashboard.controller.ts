import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('recent-sales')
  async getRecentSales() {
    return this.dashboardService.getRecentSales();
  }

  @Get('low-stock')
  async getLowStockProducts() {
    return this.dashboardService.getLowStockProducts();
  }

  @Get('top-debtors')
  async getTopDebtors() {
    return this.dashboardService.getTopCustomersWithDebt();
  }
}
