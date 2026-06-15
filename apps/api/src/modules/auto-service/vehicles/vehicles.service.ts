import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { VehiclesRepository, Vehicle } from './vehicles.repository';
import { CreateVehicleDto, UpdateVehicleDto } from './dto';
import { createPaginatedResult } from '../../../common/dto/pagination.dto';
import { ActivityLogService } from '../../../common/services/activity-log.service';

function normalizePlate(plate: string): string {
  return plate.replace(/\s+/g, '').toUpperCase();
}

@Injectable()
export class VehiclesService {
  constructor(
    private readonly repository: VehiclesRepository,
    private readonly activityLog: ActivityLogService,
  ) {}

  async findAll(params: any) {
    const { items, total } = await this.repository.findAll(params);
    return createPaginatedResult(items, total, params.page, params.limit);
  }

  async findById(id: string): Promise<Vehicle> {
    const vehicle = await this.repository.findByIdWithCustomer(id);
    if (!vehicle) throw new NotFoundException('Araç bulunamadı');
    return vehicle;
  }

  async create(dto: CreateVehicleDto, userId?: string): Promise<Vehicle> {
    const plate = normalizePlate(dto.plate);
    const existing = await this.repository.findByPlate(plate);
    if (existing) {
      throw new ConflictException('Bu plakayla kayıtlı bir araç zaten var');
    }
    const vehicle = await this.repository.createVehicle({
      ...dto,
      plate,
      is_active: dto.is_active !== false,
      created_by: userId || null,
    });
    await this.activityLog.log({
      action: 'vehicle_created',
      entityType: 'vehicle',
      entityId: vehicle.id,
      newValues: { plate: vehicle.plate, brand: vehicle.brand, model: vehicle.model },
    });
    return vehicle;
  }

  async update(id: string, dto: UpdateVehicleDto): Promise<Vehicle> {
    await this.findById(id);
    const updateData: Partial<Vehicle> = { ...dto } as any;
    if (dto.plate) {
      const plate = normalizePlate(dto.plate);
      const existing = await this.repository.findByPlate(plate);
      if (existing && existing.id !== id) {
        throw new ConflictException('Bu plakayla kayıtlı başka bir araç var');
      }
      updateData.plate = plate;
    }
    const updated = await this.repository.updateVehicle(id, updateData);
    if (!updated) throw new NotFoundException('Araç bulunamadı');
    await this.activityLog.log({
      action: 'vehicle_updated',
      entityType: 'vehicle',
      entityId: id,
      newValues: dto as any,
    });
    return updated;
  }

  async delete(id: string): Promise<void> {
    const vehicle = await this.findById(id);
    await this.repository.deleteVehicle(id);
    await this.activityLog.log({
      action: 'vehicle_deleted',
      entityType: 'vehicle',
      entityId: id,
      oldValues: { plate: vehicle.plate },
    });
  }
}
