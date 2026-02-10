import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { FieldTeamService } from './field-team.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';

@Controller('field-team')
export class FieldTeamController {
  constructor(private readonly service: FieldTeamService) {}

  // Routes
  @Get('routes')
  async findAllRoutes(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('assignedTo') assignedTo?: string,
  ) {
    const result = await this.service.findAllRoutes({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      status,
      startDate,
      endDate,
      assignedTo,
    });
    return {
      success: true,
      data: result.items,
      meta: {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        total: result.total,
        totalPages: Math.ceil(result.total / (limit ? parseInt(limit, 10) : 20)),
      },
    };
  }

  @Get('routes/stats/today')
  async getTodayStats() {
    const stats = await this.service.getTodayStats();
    return { success: true, data: stats };
  }

  @Get('routes/:id')
  async findRouteById(@Param('id') id: string) {
    const route = await this.service.findRouteById(id);
    return { success: true, data: route };
  }

  @Get('routes/:id/visits')
  async findVisitsByRouteId(@Param('id') id: string) {
    const visits = await this.service.findVisitsByRouteId(id);
    return { success: true, data: visits };
  }

  @Post('routes')
  async createRoute(@Body() dto: CreateRouteDto) {
    const route = await this.service.createRoute(dto);
    return { success: true, data: route };
  }

  @Patch('routes/:id')
  async updateRoute(@Param('id') id: string, @Body() dto: Partial<CreateRouteDto>) {
    const route = await this.service.updateRoute(id, dto);
    return { success: true, data: route };
  }

  @Post('routes/:id/start')
  async startRoute(@Param('id') id: string) {
    const route = await this.service.startRoute(id);
    return { success: true, data: route };
  }

  @Post('routes/:id/complete')
  async completeRoute(@Param('id') id: string) {
    const route = await this.service.completeRoute(id);
    return { success: true, data: route };
  }

  @Post('routes/:id/cancel')
  async cancelRoute(@Param('id') id: string) {
    const route = await this.service.cancelRoute(id);
    return { success: true, data: route };
  }

  @Delete('routes/:id')
  async deleteRoute(@Param('id') id: string) {
    await this.service.deleteRoute(id);
    return { success: true, message: 'Rota silindi' };
  }

  // Visits
  @Get('visits/:id')
  async findVisitById(@Param('id') id: string) {
    const visit = await this.service.findVisitById(id);
    return { success: true, data: visit };
  }

  @Patch('visits/:id')
  async updateVisit(@Param('id') id: string, @Body() dto: UpdateVisitDto) {
    const visit = await this.service.updateVisit(id, dto);
    return { success: true, data: visit };
  }

  @Post('visits/:id/check-in')
  async checkInVisit(
    @Param('id') id: string,
    @Body('latitude') latitude?: number,
    @Body('longitude') longitude?: number,
  ) {
    const visit = await this.service.checkInVisit(id, latitude, longitude);
    return { success: true, data: visit };
  }

  @Post('visits/:id/check-out')
  async checkOutVisit(
    @Param('id') id: string,
    @Body('outcome') outcome?: string,
    @Body('latitude') latitude?: number,
    @Body('longitude') longitude?: number,
  ) {
    const visit = await this.service.checkOutVisit(id, outcome, latitude, longitude);
    return { success: true, data: visit };
  }

  @Post('visits/:id/skip')
  async skipVisit(@Param('id') id: string, @Body('notes') notes?: string) {
    const visit = await this.service.skipVisit(id, notes);
    return { success: true, data: visit };
  }

  @Delete('visits/:id')
  async deleteVisit(@Param('id') id: string) {
    await this.service.deleteVisit(id);
    return { success: true, message: 'Ziyaret silindi' };
  }
}
