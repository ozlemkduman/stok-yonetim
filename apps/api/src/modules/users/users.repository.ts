import { Injectable } from '@nestjs/common';
import { BaseTenantRepository } from '../../common/repositories/base.repository';
import { PaginationParams, createPaginatedResponse } from '../../common/dto/pagination.dto';

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  password_hash: string;
  name: string;
  phone: string | null;
  avatar_url: string | null;
  role: string;
  permissions: string[];
  status: string;
  email_verified_at: Date | null;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class UsersRepository extends BaseTenantRepository<User> {
  protected tableName = 'users';

  async findAll(params: PaginationParams & { role?: string; status?: string; search?: string }) {
    const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc', role, status, search } = params;
    const offset = (page - 1) * limit;

    let query = this.query;

    if (role) {
      query = query.where('role', role);
    }

    if (status) {
      query = query.where('status', status);
    }

    if (search) {
      query = query.where((builder) => {
        builder
          .whereILike('name', `%${search}%`)
          .orWhereILike('email', `%${search}%`);
      });
    }

    const countQuery = query.clone().count('* as count').first();
    const dataQuery = query
      .clone()
      .select('id', 'tenant_id', 'email', 'name', 'phone', 'avatar_url', 'role', 'permissions', 'status', 'last_login_at', 'created_at')
      .orderBy(sortBy, sortOrder)
      .limit(limit)
      .offset(offset);

    const [countResult, items] = await Promise.all([countQuery, dataQuery]);
    const total = parseInt(countResult?.count as string, 10) || 0;

    const parsedItems = items.map((item) => ({
      ...item,
      permissions: typeof item.permissions === 'string' ? JSON.parse(item.permissions) : item.permissions,
    }));

    return createPaginatedResponse(parsedItems, total, page, limit);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.query.where('email', email).first();

    if (user && user.permissions) {
      user.permissions = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions;
    }

    return user || null;
  }

  async create(data: Partial<User>): Promise<User> {
    const insertData = this.getInsertData({
      ...data,
      permissions: JSON.stringify(data.permissions || []),
    } as any);

    const [user] = await this.knex('users').insert(insertData).returning('*');

    if (user.permissions) {
      user.permissions = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions;
    }

    return user;
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    const updateData: any = { ...data, updated_at: this.knex.fn.now() };

    if (data.permissions) {
      updateData.permissions = JSON.stringify(data.permissions);
    }

    const [user] = await this.query
      .where('id', id)
      .update(updateData)
      .returning('*');

    if (user && user.permissions) {
      user.permissions = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions;
    }

    return user || null;
  }

  async updateStatus(id: string, status: string): Promise<User | null> {
    return this.update(id, { status } as any);
  }

  async countByRole(): Promise<{ role: string; count: number }[]> {
    const results = await this.query
      .select('role')
      .count('* as count')
      .groupBy('role');

    return results.map((r) => ({
      role: r.role,
      count: parseInt(r.count as string, 10),
    }));
  }
}
