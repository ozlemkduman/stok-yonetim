import { Controller, Get } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { getCurrentTenantId } from '../../common/context/tenant.context';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  async getSummary() {
    const tenantId = getCurrentTenantId();
    const data = await this.dashboardService.getSummary(tenantId);
    return { success: true, data };
  }

  @Get('recent-sales')
  async getRecentSales() {
    const tenantId = getCurrentTenantId();
    const data = await this.dashboardService.getRecentSales(5, tenantId);
    return { success: true, data };
  }

  @Get('low-stock')
  async getLowStockProducts() {
    const tenantId = getCurrentTenantId();
    const data = await this.dashboardService.getLowStockProducts(5, tenantId);
    return { success: true, data };
  }

  @Get('top-debtors')
  async getTopDebtors() {
    const tenantId = getCurrentTenantId();
    const data = await this.dashboardService.getTopCustomersWithDebt(5, tenantId);
    return { success: true, data };
  }
}
