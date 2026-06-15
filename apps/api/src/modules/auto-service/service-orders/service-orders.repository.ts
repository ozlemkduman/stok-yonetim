import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { BaseTenantRepository } from '../../../common/repositories/base.repository';
import { DatabaseService } from '../../../database/database.service';

export interface ServiceOrderItem {
  id: string;
  tenant_id: string | null;
  service_order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  line_total: number;
  product_name?: string;
  product_unit?: string;
  product_type?: string;
}

export interface ServiceOrder {
  id: string;
  tenant_id: string | null;
  order_number: string;
  vehicle_id: string;
  customer_id: string | null;
  assigned_employee_id: string | null;
  status: string;
  mileage_in: number | null;
  complaint: string | null;
  diagnosis: string | null;
  labor_cost: number;
  parts_cost: number;
  discount: number;
  total_amount: number;
  opened_at: Date;
  completed_at: Date | null;
  delivered_at: Date | null;
  notes: string | null;
  // Faz 3 — fatura + stok
  invoice_number: string | null;
  invoice_date: Date | null;
  invoice_amount: number | null;
  invoice_file_url: string | null;
  warehouse_id: string | null;
  stock_deducted: boolean;
  posted_payment_method: string | null;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  vehicle_plate?: string;
  customer_name?: string;
  employee_name?: string;
  items?: ServiceOrderItem[];
}

@Injectable()
export class ServiceOrdersRepository extends BaseTenantRepository<ServiceOrder> {
  protected tableName = 'service_orders';

  constructor(db: DatabaseService) {
    super(db);
  }

  private baseSelect() {
    return this.query.clone()
      .leftJoin('vehicles', 'service_orders.vehicle_id', 'vehicles.id')
      .leftJoin('customers', 'service_orders.customer_id', 'customers.id')
      .leftJoin('employees', 'service_orders.assigned_employee_id', 'employees.id')
      .select(
        'service_orders.*',
        'vehicles.plate as vehicle_plate',
        'customers.name as customer_name',
        'employees.name as employee_name',
      );
  }

  async findAll(params: { page: number; limit: number; search?: string; vehicleId?: string; status?: string; sortBy: string; sortOrder: 'asc' | 'desc' }) {
    const { page, limit, search, vehicleId, status, sortBy, sortOrder } = params;
    const offset = (page - 1) * limit;

    let query = this.baseSelect();
    let countQuery = this.query.clone();

    if (vehicleId) {
      query = query.where('service_orders.vehicle_id', vehicleId);
      countQuery = countQuery.where('vehicle_id', vehicleId);
    }
    if (status) {
      query = query.where('service_orders.status', status);
      countQuery = countQuery.where('status', status);
    }
    if (search) {
      query = query.where((b) =>
        b.whereILike('service_orders.order_number', `%${search}%`)
          .orWhereILike('vehicles.plate', `%${search}%`),
      );
      countQuery = countQuery.whereILike('order_number', `%${search}%`);
    }

    const [items, [{ count }]] = await Promise.all([
      query.orderBy(`service_orders.${sortBy}`, sortOrder).limit(limit).offset(offset),
      countQuery.count('id as count'),
    ]);

    return { items, total: parseInt(count as string, 10) };
  }

  async findByIdDetailed(id: string): Promise<ServiceOrder | null> {
    const order = await this.baseSelect().where('service_orders.id', id).first();
    if (!order) return null;
    order.items = await this.getItems(id);
    return order;
  }

  async getItems(serviceOrderId: string): Promise<ServiceOrderItem[]> {
    return this.knex('service_order_items')
      .leftJoin('products', 'service_order_items.product_id', 'products.id')
      .select(
        'service_order_items.*',
        'products.name as product_name',
        'products.unit as product_unit',
        'products.type as product_type',
      )
      .where('service_order_items.service_order_id', serviceOrderId)
      .orderBy('service_order_items.created_at', 'asc');
  }

  async generateOrderNumber(): Promise<string> {
    const today = new Date();
    const prefix = `IE${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}`;
    const [result] = await this.query.whereILike('order_number', `${prefix}%`).count('id as count');
    const count = parseInt(result.count as string, 10) + 1;
    return `${prefix}${String(count).padStart(4, '0')}`;
  }

  async createOrder(data: Partial<ServiceOrder>, trx?: Knex.Transaction): Promise<ServiceOrder> {
    const insertData = this.getInsertData(data);
    const runner = trx ? trx('service_orders') : this.knex('service_orders');
    const [order] = await runner.insert(insertData).returning('*');
    return order;
  }

  async updateOrder(id: string, data: Partial<ServiceOrder>, trx?: Knex.Transaction): Promise<ServiceOrder | null> {
    const runner = trx ? trx('service_orders') : this.knex('service_orders');
    const [order] = await this.applyTenantFilter(runner, 'service_orders')
      .where('service_orders.id', id)
      .update({ ...data, updated_at: this.knex.fn.now() })
      .returning('*');
    return order || null;
  }

  /** Bir iş emrinin tüm kalemlerini siler (replace pattern). */
  async deleteItems(serviceOrderId: string, trx: Knex.Transaction): Promise<void> {
    await trx('service_order_items').where('service_order_id', serviceOrderId).del();
  }

  async insertItems(items: Partial<ServiceOrderItem>[], trx: Knex.Transaction): Promise<void> {
    if (items.length === 0) return;
    await trx('service_order_items').insert(items);
  }
}
