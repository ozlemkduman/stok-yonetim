import { Injectable } from '@nestjs/common';
import { BaseTenantRepository } from '../../../common/repositories/base.repository';
import { DatabaseService } from '../../../database/database.service';

export interface Vehicle {
  id: string;
  tenant_id: string | null;
  customer_id: string | null;
  plate: string;
  brand: string | null;
  model: string | null;
  model_year: number | null;
  vin: string | null;
  engine_no: string | null;
  color: string | null;
  fuel_type: string | null;
  mileage: number | null;
  notes: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  customer_name?: string;
}

@Injectable()
export class VehiclesRepository extends BaseTenantRepository<Vehicle> {
  protected tableName = 'vehicles';

  constructor(db: DatabaseService) {
    super(db);
  }

  async findAll(params: { page: number; limit: number; search?: string; customerId?: string; isActive?: string; sortBy: string; sortOrder: 'asc' | 'desc' }) {
    const { page, limit, search, customerId, isActive, sortBy, sortOrder } = params;
    const offset = (page - 1) * limit;

    let query = this.query.clone()
      .leftJoin('customers', 'vehicles.customer_id', 'customers.id')
      .select('vehicles.*', 'customers.name as customer_name');
    let countQuery = this.query.clone();

    if (isActive === 'true' || isActive === 'false') {
      const flag = isActive === 'true';
      query = query.where('vehicles.is_active', flag);
      countQuery = countQuery.where('is_active', flag);
    }
    if (customerId) {
      query = query.where('vehicles.customer_id', customerId);
      countQuery = countQuery.where('customer_id', customerId);
    }
    if (search) {
      query = query.where((b) =>
        b.whereILike('vehicles.plate', `%${search}%`)
          .orWhereILike('vehicles.brand', `%${search}%`)
          .orWhereILike('vehicles.model', `%${search}%`)
          .orWhereILike('vehicles.vin', `%${search}%`),
      );
      countQuery = countQuery.where((b) =>
        b.whereILike('plate', `%${search}%`)
          .orWhereILike('brand', `%${search}%`)
          .orWhereILike('model', `%${search}%`),
      );
    }

    const [items, [{ count }]] = await Promise.all([
      query.orderBy(`vehicles.${sortBy}`, sortOrder).limit(limit).offset(offset),
      countQuery.count('id as count'),
    ]);

    return { items, total: parseInt(count as string, 10) };
  }

  async findByIdWithCustomer(id: string): Promise<Vehicle | null> {
    const result = await this.query
      .leftJoin('customers', 'vehicles.customer_id', 'customers.id')
      .select('vehicles.*', 'customers.name as customer_name')
      .where('vehicles.id', id)
      .first();
    return result || null;
  }

  async findByPlate(plate: string): Promise<Vehicle | null> {
    const result = await this.query.where('vehicles.plate', plate).first();
    return result || null;
  }

  async createVehicle(data: Partial<Vehicle>): Promise<Vehicle> {
    const insertData = this.getInsertData(data);
    const [vehicle] = await this.knex('vehicles').insert(insertData).returning('*');
    return vehicle;
  }

  async updateVehicle(id: string, data: Partial<Vehicle>): Promise<Vehicle | null> {
    const [vehicle] = await this.query
      .where('vehicles.id', id)
      .update({ ...data, updated_at: this.knex.fn.now() })
      .returning('*');
    return vehicle || null;
  }

  async deleteVehicle(id: string): Promise<void> {
    // Soft delete — servis geçmişi (iş emirleri) korunur
    await this.query.where('vehicles.id', id).update({ is_active: false, updated_at: this.knex.fn.now() });
  }
}
