import { Controller, Get, Query, Req } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales-summary')
  async getSalesSummary(@Query('startDate') startDate: string, @Query('endDate') endDate: string, @Req() req: any) {
    const data = await this.reportsService.getSalesSummary(startDate, endDate, req.user?.tenantId);
    return { success: true, data };
  }

  @Get('debt-overview')
  async getDebtOverview(@Req() req: any) {
    const data = await this.reportsService.getDebtOverview(req.user?.tenantId);
    return { success: true, data };
  }

  @Get('vat')
  async getVatReport(@Query('startDate') startDate: string, @Query('endDate') endDate: string, @Req() req: any) {
    const data = await this.reportsService.getVatReport(startDate, endDate, req.user?.tenantId);
    return { success: true, data };
  }

  @Get('profit-loss')
  async getProfitLoss(@Query('startDate') startDate: string, @Query('endDate') endDate: string, @Req() req: any) {
    const data = await this.reportsService.getProfitLoss(startDate, endDate, req.user?.tenantId);
    return { success: true, data };
  }

  @Get('top-products')
  async getTopProducts(@Query('startDate') startDate: string, @Query('endDate') endDate: string, @Query('limit') limit: number, @Req() req: any) {
    const data = await this.reportsService.getTopProducts(startDate, endDate, limit || 10, req.user?.tenantId);
    return { success: true, data };
  }

  @Get('top-customers')
  async getTopCustomers(@Query('startDate') startDate: string, @Query('endDate') endDate: string, @Query('limit') limit: number, @Req() req: any) {
    const data = await this.reportsService.getTopCustomers(startDate, endDate, limit || 10, req.user?.tenantId);
    return { success: true, data };
  }

  @Get('upcoming-payments')
  async getUpcomingPayments(@Query('days') days: number, @Req() req: any) {
    const data = await this.reportsService.getUpcomingPayments(days || 30, req.user?.tenantId);
    return { success: true, data };
  }

  @Get('overdue-payments')
  async getOverduePayments(@Req() req: any) {
    const data = await this.reportsService.getOverduePayments(req.user?.tenantId);
    return { success: true, data };
  }

  @Get('stock-report')
  async getStockReport(@Req() req: any) {
    const data = await this.reportsService.getStockReport(req.user?.tenantId);
    return { success: true, data };
  }

  @Get('returns-report')
  async getReturnsReport(@Query('startDate') startDate: string, @Query('endDate') endDate: string, @Req() req: any) {
    const data = await this.reportsService.getReturnsReport(startDate, endDate, req.user?.tenantId);
    return { success: true, data };
  }

  @Get('customer-sales')
  async getCustomerSales(@Query('startDate') startDate: string, @Query('endDate') endDate: string, @Req() req: any) {
    const data = await this.reportsService.getCustomerSales(startDate, endDate, req.user?.tenantId);
    return { success: true, data };
  }

  @Get('customer-product-purchases')
  async getCustomerProductPurchases(@Query('startDate') startDate: string, @Query('endDate') endDate: string, @Req() req: any) {
    const data = await this.reportsService.getCustomerProductPurchases(startDate, endDate, req.user?.tenantId);
    return { success: true, data };
  }

  @Get('employee-performance')
  async getEmployeePerformance(@Query('startDate') startDate: string, @Query('endDate') endDate: string, @Req() req: any) {
    const data = await this.reportsService.getEmployeePerformance(
      startDate, endDate, req.user?.tenantId, req.user?.sub, req.user?.role,
    );
    return { success: true, data };
  }

  @Get('renewals')
  async getRenewals(@Req() req: any) {
    const data = await this.reportsService.getRenewals(req.user?.tenantId);
    return { success: true, data };
  }

  @Get('expenses-by-category')
  async getExpensesByCategory(@Query('startDate') startDate: string, @Query('endDate') endDate: string, @Req() req: any) {
    const data = await this.reportsService.getExpensesByCategory(startDate, endDate, req.user?.tenantId);
    return { success: true, data };
  }
}
