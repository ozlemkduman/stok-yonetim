import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { IntegrationsRepository, Integration, ECommerceOrder, BankStatement } from './integrations.repository';
import { CreateIntegrationDto } from './dto/create-integration.dto';
import { UpdateIntegrationDto } from './dto/update-integration.dto';
import { BaseProvider, SyncResult } from './providers/base.provider';
import { TrendyolProvider } from './providers/trendyol.provider';

@Injectable()
export class IntegrationsService {
  constructor(private readonly repository: IntegrationsRepository) {}

  async findAll(type?: string, status?: string): Promise<Integration[]> {
    return this.repository.findAll({ type, status });
  }

  async findById(id: string): Promise<Integration> {
    const integration = await this.repository.findById(id);
    if (!integration) {
      throw new NotFoundException('Entegrasyon bulunamadi');
    }
    return integration;
  }

  async create(dto: CreateIntegrationDto): Promise<Integration> {
    return this.repository.create({
      name: dto.name,
      type: dto.type,
      provider: dto.provider,
      status: 'inactive',
      config: dto.config || {},
      credentials: dto.credentials || {},
    });
  }

  async update(id: string, dto: UpdateIntegrationDto): Promise<Integration> {
    await this.findById(id);
    return this.repository.update(id, dto);
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.repository.delete(id);
  }

  async testConnection(id: string): Promise<{ success: boolean; message: string }> {
    const integration = await this.findById(id);
    const provider = this.getProvider(integration);

    if (!provider) {
      return { success: false, message: 'Bu saglayici icin test desteklenmiyor' };
    }

    try {
      await this.repository.createLog({
        integration_id: id,
        action: 'sync',
        status: 'started',
        message: 'Baglanti testi baslatildi',
      });

      const success = await provider.testConnection();

      await this.repository.createLog({
        integration_id: id,
        action: 'sync',
        status: success ? 'success' : 'failed',
        message: success ? 'Baglanti basarili' : 'Baglanti basarisiz',
      });

      if (success) {
        await this.repository.update(id, { status: 'active', last_error: null });
      } else {
        await this.repository.update(id, { status: 'error', last_error: 'Baglanti testi basarisiz' });
      }

      return {
        success,
        message: success ? 'Baglanti basarili' : 'Baglanti basarisiz - kimlik bilgilerini kontrol edin',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      await this.repository.createLog({
        integration_id: id,
        action: 'error',
        status: 'failed',
        message: errorMessage,
      });
      await this.repository.update(id, { status: 'error', last_error: errorMessage });
      return { success: false, message: errorMessage };
    }
  }

  async syncOrders(id: string, startDate?: string, endDate?: string): Promise<SyncResult> {
    const integration = await this.findById(id);

    if (integration.type !== 'e_commerce') {
      throw new BadRequestException('Bu entegrasyon e-ticaret tipi degil');
    }

    if (integration.status !== 'active') {
      throw new BadRequestException('Entegrasyon aktif degil');
    }

    const provider = this.getProvider(integration);
    if (!provider || !provider.fetchOrders) {
      throw new BadRequestException('Bu saglayici siparis senkronizasyonu desteklemiyor');
    }

    await this.repository.createLog({
      integration_id: id,
      action: 'sync',
      status: 'started',
      message: 'Siparis senkronizasyonu baslatildi',
    });

    try {
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;
      const orders = await provider.fetchOrders(start, end);

      let syncedCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const order of orders) {
        try {
          await this.repository.upsertECommerceOrder({
            integration_id: id,
            external_order_id: order.externalOrderId,
            external_order_number: order.externalOrderNumber || null,
            status: order.status as ECommerceOrder['status'],
            sync_status: 'pending',
            customer_name: order.customerName || null,
            customer_email: order.customerEmail || null,
            customer_phone: order.customerPhone || null,
            shipping_address: order.shippingAddress || null,
            subtotal: order.subtotal,
            shipping_cost: order.shippingCost,
            commission: order.commission,
            total: order.total,
            currency: order.currency,
            items: order.items,
            raw_data: order.rawData,
            order_date: order.orderDate,
          });
          syncedCount++;
        } catch (error) {
          errorCount++;
          errors.push(`Siparis ${order.externalOrderId}: ${error instanceof Error ? error.message : 'Hata'}`);
        }
      }

      await this.repository.update(id, { last_sync_at: new Date() as unknown as Date, last_error: null });
      await this.repository.createLog({
        integration_id: id,
        action: 'sync',
        status: 'success',
        message: `${syncedCount} siparis senkronize edildi, ${errorCount} hata`,
        details: { syncedCount, errorCount, errors },
      });

      return {
        success: true,
        message: `${syncedCount} siparis senkronize edildi`,
        syncedCount,
        errorCount,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      await this.repository.update(id, { last_error: errorMessage });
      await this.repository.createLog({
        integration_id: id,
        action: 'error',
        status: 'failed',
        message: errorMessage,
      });

      return {
        success: false,
        message: errorMessage,
        syncedCount: 0,
        errorCount: 1,
        errors: [errorMessage],
      };
    }
  }

  async getLogs(id: string): Promise<unknown[]> {
    await this.findById(id);
    return this.repository.findLogsByIntegrationId(id);
  }

  // E-commerce orders
  async findECommerceOrders(params: {
    page?: number;
    limit?: number;
    integrationId?: string;
    status?: string;
    syncStatus?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ items: ECommerceOrder[]; total: number }> {
    return this.repository.findECommerceOrders({
      page: params.page || 1,
      limit: params.limit || 20,
      integrationId: params.integrationId,
      status: params.status,
      syncStatus: params.syncStatus,
      startDate: params.startDate,
      endDate: params.endDate,
    });
  }

  async findECommerceOrderById(id: string): Promise<ECommerceOrder> {
    const order = await this.repository.findECommerceOrderById(id);
    if (!order) {
      throw new NotFoundException('Siparis bulunamadi');
    }
    return order;
  }

  // Bank statements
  async findBankStatements(params: {
    page?: number;
    limit?: number;
    integrationId?: string;
    accountId?: string;
    matchStatus?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ items: BankStatement[]; total: number }> {
    return this.repository.findBankStatements({
      page: params.page || 1,
      limit: params.limit || 20,
      integrationId: params.integrationId,
      accountId: params.accountId,
      matchStatus: params.matchStatus,
      startDate: params.startDate,
      endDate: params.endDate,
    });
  }

  async matchBankStatement(id: string, movementId: string): Promise<void> {
    await this.repository.matchBankStatement(id, movementId);
  }

  async ignoreBankStatement(id: string): Promise<void> {
    await this.repository.ignoreBankStatement(id);
  }

  private getProvider(integration: Integration): BaseProvider | null {
    switch (integration.provider) {
      case 'trendyol':
        return new TrendyolProvider(integration.config, integration.credentials);
      // Add more providers here
      default:
        return null;
    }
  }
}
