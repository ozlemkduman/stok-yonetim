import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales-summary')
  async getSalesSummary(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    const data = await this.reportsService.getSalesSummary(startDate, endDate);
    return { success: true, data };
  }

  @Get('debt-overview')
  async getDebtOverview() {
    const data = await this.reportsService.getDebtOverview();
    return { success: true, data };
  }

  @Get('vat')
  async getVatReport(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    const data = await this.reportsService.getVatReport(startDate, endDate);
    return { success: true, data };
  }

  @Get('profit-loss')
  async getProfitLoss(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    const data = await this.reportsService.getProfitLoss(startDate, endDate);
    return { success: true, data };
  }

  @Get('top-products')
  async getTopProducts(@Query('startDate') startDate: string, @Query('endDate') endDate: string, @Query('limit') limit?: number) {
    const data = await this.reportsService.getTopProducts(startDate, endDate, limit || 10);
    return { success: true, data };
  }

  @Get('top-customers')
  async getTopCustomers(@Query('startDate') startDate: string, @Query('endDate') endDate: string, @Query('limit') limit?: number) {
    const data = await this.reportsService.getTopCustomers(startDate, endDate, limit || 10);
    return { success: true, data };
  }

  @Get('upcoming-payments')
  async getUpcomingPayments(@Query('days') days?: number) {
    const data = await this.reportsService.getUpcomingPayments(days || 30);
    return { success: true, data };
  }

  @Get('overdue-payments')
  async getOverduePayments() {
    const data = await this.reportsService.getOverduePayments();
    return { success: true, data };
  }

  @Get('stock-report')
  async getStockReport() {
    const data = await this.reportsService.getStockReport();
    return { success: true, data };
  }

  @Get('returns-report')
  async getReturnsReport(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    const data = await this.reportsService.getReturnsReport(startDate, endDate);
    return { success: true, data };
  }

  @Get('customer-sales')
  async getCustomerSales(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    const data = await this.reportsService.getCustomerSales(startDate, endDate);
    return { success: true, data };
  }

  @Get('customer-product-purchases')
  async getCustomerProductPurchases(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    const data = await this.reportsService.getCustomerProductPurchases(startDate, endDate);
    return { success: true, data };
  }

  @Get('expenses-by-category')
  async getExpensesByCategory(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    const data = await this.reportsService.getExpensesByCategory(startDate, endDate);
    return { success: true, data };
  }
}
