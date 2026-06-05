import { Controller, Get, Query, Req } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { getCurrentTenantId } from '../../common/context/tenant.context';
import { RequireFeature } from '../../common/decorators/require-feature.decorator';

// Diğer modüller gibi TenantInterceptor'ın AsyncLocalStorage context'ini kullanır
// (impersonate-safe). req.user.tenantId'ye fallback.
function resolveTenantId(req: any): string | undefined {
  return getCurrentTenantId() ?? req.user?.tenantId;
}

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales-summary')
  async getSalesSummary(@Query('startDate') startDate: string, @Query('endDate') endDate: string, @Req() req: any) {
    const data = await this.reportsService.getSalesSummary(startDate, endDate, resolveTenantId(req));
    return { success: true, data };
  }

  @Get('debt-overview')
  async getDebtOverview(@Req() req: any) {
    const data = await this.reportsService.getDebtOverview(resolveTenantId(req));
    return { success: true, data };
  }

  @Get('vat')
  @RequireFeature('advancedReports')
  async getVatReport(@Query('startDate') startDate: string, @Query('endDate') endDate: string, @Req() req: any) {
    const data = await this.reportsService.getVatReport(startDate, endDate, resolveTenantId(req));
    return { success: true, data };
  }

  @Get('profit-loss')
  @RequireFeature('advancedReports')
  async getProfitLoss(@Query('startDate') startDate: string, @Query('endDate') endDate: string, @Req() req: any) {
    const data = await this.reportsService.getProfitLoss(startDate, endDate, resolveTenantId(req));
    return { success: true, data };
  }

  @Get('top-products')
  async getTopProducts(@Query('startDate') startDate: string, @Query('endDate') endDate: string, @Query('limit') limit: number, @Req() req: any) {
    const data = await this.reportsService.getTopProducts(startDate, endDate, limit || 10, resolveTenantId(req));
    return { success: true, data };
  }

  @Get('top-customers')
  async getTopCustomers(@Query('startDate') startDate: string, @Query('endDate') endDate: string, @Query('limit') limit: number, @Req() req: any) {
    const data = await this.reportsService.getTopCustomers(startDate, endDate, limit || 10, resolveTenantId(req));
    return { success: true, data };
  }

  @Get('upcoming-payments')
  async getUpcomingPayments(@Query('days') days: number, @Req() req: any) {
    const data = await this.reportsService.getUpcomingPayments(days || 30, resolveTenantId(req));
    return { success: true, data };
  }

  @Get('overdue-payments')
  async getOverduePayments(@Req() req: any) {
    const data = await this.reportsService.getOverduePayments(resolveTenantId(req));
    return { success: true, data };
  }

  @Get('stock-report')
  async getStockReport(@Req() req: any) {
    const data = await this.reportsService.getStockReport(resolveTenantId(req));
    return { success: true, data };
  }

  @Get('returns-report')
  async getReturnsReport(@Query('startDate') startDate: string, @Query('endDate') endDate: string, @Req() req: any) {
    const data = await this.reportsService.getReturnsReport(startDate, endDate, resolveTenantId(req));
    return { success: true, data };
  }

  @Get('customer-sales')
  async getCustomerSales(@Query('startDate') startDate: string, @Query('endDate') endDate: string, @Req() req: any) {
    const data = await this.reportsService.getCustomerSales(startDate, endDate, resolveTenantId(req));
    return { success: true, data };
  }

  @Get('customer-product-purchases')
  @RequireFeature('advancedReports')
  async getCustomerProductPurchases(@Query('startDate') startDate: string, @Query('endDate') endDate: string, @Req() req: any) {
    const data = await this.reportsService.getCustomerProductPurchases(startDate, endDate, resolveTenantId(req));
    return { success: true, data };
  }

  @Get('employee-performance')
  @RequireFeature('advancedReports')
  async getEmployeePerformance(@Query('startDate') startDate: string, @Query('endDate') endDate: string, @Req() req: any) {
    const data = await this.reportsService.getEmployeePerformance(
      startDate, endDate, resolveTenantId(req), req.user?.sub, req.user?.role,
    );
    return { success: true, data };
  }

  @Get('renewals')
  @RequireFeature('advancedReports')
  async getRenewals(@Req() req: any) {
    const data = await this.reportsService.getRenewals(resolveTenantId(req));
    return { success: true, data };
  }

  @Get('expenses-by-category')
  @RequireFeature('advancedReports')
  async getExpensesByCategory(@Query('startDate') startDate: string, @Query('endDate') endDate: string, @Req() req: any) {
    const data = await this.reportsService.getExpensesByCategory(startDate, endDate, resolveTenantId(req));
    return { success: true, data };
  }

  @Get('end-of-day')
  async getEndOfDay(@Query('date') date: string, @Req() req: any) {
    const effectiveDate = date || new Date().toISOString().split('T')[0];
    const data = await this.reportsService.getEndOfDayReport(effectiveDate, resolveTenantId(req));
    return { success: true, data };
  }

  @Get('aging')
  @RequireFeature('advancedReports')
  async getAging(@Req() req: any) {
    const data = await this.reportsService.getAgingReport(resolveTenantId(req));
    return { success: true, data };
  }

  @Get('product-profitability')
  @RequireFeature('advancedReports')
  async getProductProfitability(@Query('startDate') startDate: string, @Query('endDate') endDate: string, @Req() req: any) {
    const data = await this.reportsService.getProductProfitability(startDate, endDate, resolveTenantId(req));
    return { success: true, data };
  }
}
