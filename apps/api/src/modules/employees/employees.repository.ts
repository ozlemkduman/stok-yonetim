import { Injectable } from '@nestjs/common';
import { BaseTenantRepository } from '../../common/repositories/base.repository';
import { DatabaseService } from '../../database/database.service';

export interface Employee {
  id: string;
  tenant_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  position: string | null;
  hire_date: Date | null;
  salary: number | null;
  commission_rate: number;
  user_id: string | null;
  notes: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  user_name?: string;
}

@Injectable()
export class EmployeesRepository extends BaseTenantRepository<Employee> {
  protected tableName = 'employees';

  constructor(db: DatabaseService) {
    super(db);
  }

  async findAll(params: { page: number; limit: number; search?: string; isActive?: string; sortBy: string; sortOrder: 'asc' | 'desc' }) {
    const { page, limit, search, isActive, sortBy, sortOrder } = params;
    const offset = (page - 1) * limit;

    let query = this.query.clone()
      .leftJoin('users', 'employees.user_id', 'users.id')
      .select('employees.*', 'users.name as user_name');
    let countQuery = this.query.clone();

    if (isActive === 'true' || isActive === 'false') {
      const flag = isActive === 'true';
      query = query.where('employees.is_active', flag);
      countQuery = countQuery.where('is_active', flag);
    }
    if (search) {
      query = query.where((b) =>
        b.whereILike('employees.name', `%${search}%`)
          .orWhereILike('employees.email', `%${search}%`)
          .orWhereILike('employees.phone', `%${search}%`)
          .orWhereILike('employees.position', `%${search}%`),
      );
      countQuery = countQuery.where((b) =>
        b.whereILike('name', `%${search}%`).orWhereILike('email', `%${search}%`),
      );
    }

    const [items, [{ count }]] = await Promise.all([
      query.orderBy(`employees.${sortBy}`, sortOrder).limit(limit).offset(offset),
      countQuery.count('id as count'),
    ]);

    return { items, total: parseInt(count as string, 10) };
  }

  async findById(id: string): Promise<Employee | null> {
    const result = await this.query
      .leftJoin('users', 'employees.user_id', 'users.id')
      .select('employees.*', 'users.name as user_name')
      .where('employees.id', id)
      .first();
    return result || null;
  }

  async createEmployee(data: Partial<Employee>): Promise<Employee> {
    const insertData = this.getInsertData(data);
    const [employee] = await this.knex('employees').insert(insertData).returning('*');
    return employee;
  }

  async updateEmployee(id: string, data: Partial<Employee>): Promise<Employee | null> {
    const [employee] = await this.query
      .where(`employees.id`, id)
      .update({ ...data, updated_at: this.knex.fn.now() })
      .returning('*');
    return employee || null;
  }

  async deleteEmployee(id: string): Promise<void> {
    // Soft delete
    await this.query.where(`employees.id`, id).update({ is_active: false, updated_at: this.knex.fn.now() });
  }
}
