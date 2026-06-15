import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ServiceOrdersRepository, ServiceOrder } from './service-orders.repository';
import { VehiclesRepository } from '../vehicles/vehicles.repository';
import { CreateServiceOrderDto, UpdateServiceOrderDto } from './dto';
import { createPaginatedResult } from '../../../common/dto/pagination.dto';
import { ActivityLogService } from '../../../common/services/activity-log.service';

function computeTotal(labor: number, parts: number, discount: number): number {
  return Math.max(0, (Number(labor) || 0) + (Number(parts) || 0) - (Number(discount) || 0));
}

@Injectable()
export class ServiceOrdersService {
  constructor(
    private readonly repository: ServiceOrdersRepository,
    private readonly vehiclesRepository: VehiclesRepository,
    private readonly activityLog: ActivityLogService,
  ) {}

  async findAll(params: any) {
    const { items, total } = await this.repository.findAll(params);
    return createPaginatedResult(items, total, params.page, params.limit);
  }

  async findById(id: string): Promise<ServiceOrder> {
    const order = await this.repository.findByIdDetailed(id);
    if (!order) throw new NotFoundException('İş emri bulunamadı');
    return order;
  }

  async create(dto: CreateServiceOrderDto, userId?: string): Promise<ServiceOrder> {
    // Araç bu tenant'a ait mi? (tenant filtresi repository.query içinde)
    const vehicle = await this.vehiclesRepository.findById(dto.vehicle_id);
    if (!vehicle) throw new BadRequestException('Geçersiz araç');

    const laborCost = dto.labor_cost ?? 0;
    const partsCost = dto.parts_cost ?? 0;
    const discount = dto.discount ?? 0;
    const orderNumber = await this.repository.generateOrderNumber();

    const order = await this.repository.createOrder({
      order_number: orderNumber,
      vehicle_id: dto.vehicle_id,
      // Müşteri verilmediyse aracın sahibinden devral
      customer_id: dto.customer_id ?? vehicle.customer_id ?? null,
      assigned_employee_id: dto.assigned_employee_id ?? null,
      status: dto.status ?? 'open',
      mileage_in: dto.mileage_in ?? null,
      complaint: dto.complaint ?? null,
      diagnosis: dto.diagnosis ?? null,
      labor_cost: laborCost,
      parts_cost: partsCost,
      discount,
      total_amount: computeTotal(laborCost, partsCost, discount),
      created_by: userId || null,
    });
    await this.activityLog.log({
      action: 'service_order_created',
      entityType: 'service_order',
      entityId: order.id,
      newValues: { order_number: order.order_number, vehicle_id: order.vehicle_id, total_amount: order.total_amount },
    });
    return this.findById(order.id);
  }

  async update(id: string, dto: UpdateServiceOrderDto): Promise<ServiceOrder> {
    const current = await this.findById(id);

    const updateData: Partial<ServiceOrder> = { ...dto } as any;

    // Maliyet alanlarından biri değiştiyse toplamı yeniden hesapla
    if (dto.labor_cost !== undefined || dto.parts_cost !== undefined || dto.discount !== undefined) {
      const labor = dto.labor_cost ?? current.labor_cost;
      const parts = dto.parts_cost ?? current.parts_cost;
      const discount = dto.discount ?? current.discount;
      updateData.total_amount = computeTotal(labor, parts, discount);
    }

    // Durum geçişlerinde zaman damgaları
    if (dto.status && dto.status !== current.status) {
      if (dto.status === 'completed' && !current.completed_at) {
        updateData.completed_at = new Date() as any;
      }
      if (dto.status === 'delivered' && !current.delivered_at) {
        updateData.delivered_at = new Date() as any;
      }
    }

    const updated = await this.repository.updateOrder(id, updateData);
    if (!updated) throw new NotFoundException('İş emri bulunamadı');
    await this.activityLog.log({
      action: 'service_order_updated',
      entityType: 'service_order',
      entityId: id,
      newValues: dto as any,
    });
    return this.findById(id);
  }
}
