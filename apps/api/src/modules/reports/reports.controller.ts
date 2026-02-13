import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales-summary')
  async getSalesSummary(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.reportsService.getSalesSummary(startDate, endDate);
  }

  @Get('debt-overview')
  async getDebtOverview() {
    return this.reportsService.getDebtOverview();
  }

  @Get('vat')
  async getVatReport(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.reportsService.getVatReport(startDate, endDate);
  }

  @Get('profit-loss')
  async getProfitLoss(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.reportsService.getProfitLoss(startDate, endDate);
  }

  @Get('top-products')
  async getTopProducts(@Query('startDate') startDate: string, @Query('endDate') endDate: string, @Query('limit') limit?: number) {
    return this.reportsService.getTopProducts(startDate, endDate, limit || 10);
  }

  @Get('top-customers')
  async getTopCustomers(@Query('startDate') startDate: string, @Query('endDate') endDate: string, @Query('limit') limit?: number) {
    return this.reportsService.getTopCustomers(startDate, endDate, limit || 10);
  }

  @Get('upcoming-payments')
  async getUpcomingPayments(@Query('days') days?: number) {
    return this.reportsService.getUpcomingPayments(days || 30);
  }

  @Get('overdue-payments')
  async getOverduePayments() {
    return this.reportsService.getOverduePayments();
  }

  @Get('stock-report')
  async getStockReport() {
    return this.reportsService.getStockReport();
  }

  @Get('returns-report')
  async getReturnsReport(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.reportsService.getReturnsReport(startDate, endDate);
  }

  @Get('expenses-by-category')
  async getExpensesByCategory(@Query('startDate') startDate: string, @Query('endDate') endDate: string) {
    return this.reportsService.getExpensesByCategory(startDate, endDate);
  }
}
