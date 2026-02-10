import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { CreateIntegrationDto } from './dto/create-integration.dto';
import { UpdateIntegrationDto } from './dto/update-integration.dto';
import { SyncOrdersDto } from './dto/sync-orders.dto';

@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly service: IntegrationsService) {}

  @Get()
  async findAll(
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    const items = await this.service.findAll(type, status);
    return { success: true, data: items };
  }

  @Get('e-commerce-orders')
  async findECommerceOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('integrationId') integrationId?: string,
    @Query('status') status?: string,
    @Query('syncStatus') syncStatus?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const result = await this.service.findECommerceOrders({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      integrationId,
      status,
      syncStatus,
      startDate,
      endDate,
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

  @Get('e-commerce-orders/:id')
  async findECommerceOrderById(@Param('id') id: string) {
    const order = await this.service.findECommerceOrderById(id);
    return { success: true, data: order };
  }

  @Get('bank-statements')
  async findBankStatements(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('integrationId') integrationId?: string,
    @Query('accountId') accountId?: string,
    @Query('matchStatus') matchStatus?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const result = await this.service.findBankStatements({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      integrationId,
      accountId,
      matchStatus,
      startDate,
      endDate,
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

  @Post('bank-statements/:id/match')
  async matchBankStatement(
    @Param('id') id: string,
    @Body('movementId') movementId: string,
  ) {
    await this.service.matchBankStatement(id, movementId);
    return { success: true, message: 'Hareket eslesti' };
  }

  @Post('bank-statements/:id/ignore')
  async ignoreBankStatement(@Param('id') id: string) {
    await this.service.ignoreBankStatement(id);
    return { success: true, message: 'Hareket yok sayildi' };
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const integration = await this.service.findById(id);
    return { success: true, data: integration };
  }

  @Get(':id/logs')
  async getLogs(@Param('id') id: string) {
    const logs = await this.service.getLogs(id);
    return { success: true, data: logs };
  }

  @Post()
  async create(@Body() dto: CreateIntegrationDto) {
    const integration = await this.service.create(dto);
    return { success: true, data: integration };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateIntegrationDto) {
    const integration = await this.service.update(id, dto);
    return { success: true, data: integration };
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.service.delete(id);
    return { success: true, message: 'Entegrasyon silindi' };
  }

  @Post(':id/test')
  async testConnection(@Param('id') id: string) {
    const result = await this.service.testConnection(id);
    return { success: result.success, message: result.message };
  }

  @Post(':id/sync-orders')
  async syncOrders(@Param('id') id: string, @Body() dto: SyncOrdersDto) {
    const result = await this.service.syncOrders(id, dto.startDate, dto.endDate);
    return {
      success: result.success,
      message: result.message,
      data: {
        syncedCount: result.syncedCount,
        errorCount: result.errorCount,
        errors: result.errors,
      },
    };
  }
}
