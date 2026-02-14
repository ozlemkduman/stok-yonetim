import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { PaginationParams, createPaginatedResponse } from '../../../common/dto/pagination.dto';

export interface User {
  id: string;
  tenant_id: string | null;
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

export interface UserWithTenant extends User {
  tenant_name?: string;
  tenant_slug?: string;
}

@Injectable()
export class AdminUsersRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAll(params: PaginationParams & { role?: string; status?: string; tenantId?: string; search?: string }) {
    const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'desc', role, status, tenantId, search } = params;
    const offset = (page - 1) * limit;

    // Build base query for filtering
    let baseQuery = this.db.knex('users');

    if (role) {
      baseQuery = baseQuery.where('users.role', role);
    }

    if (status) {
      baseQuery = baseQuery.where('users.status', status);
    }

    if (tenantId) {
      baseQuery = baseQuery.where('users.tenant_id', tenantId);
    }

    if (search) {
      baseQuery = baseQuery.where((builder) => {
        builder
          .whereILike('users.name', `%${search}%`)
          .orWhereILike('users.email', `%${search}%`);
      });
    }

    // Count query - separate from select
    const countQuery = baseQuery.clone().count('* as count').first();

    // Data query with joins
    const dataQuery = baseQuery
      .clone()
      .select(
        'users.id',
        'users.tenant_id',
        'users.email',
        'users.name',
        'users.phone',
        'users.avatar_url',
        'users.role',
        'users.permissions',
        'users.status',
        'users.email_verified_at',
        'users.last_login_at',
        'users.created_at',
        'users.updated_at',
        'tenants.name as tenant_name',
        'tenants.slug as tenant_slug',
      )
      .leftJoin('tenants', 'users.tenant_id', 'tenants.id')
      .orderBy(`users.${sortBy}`, sortOrder)
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

  async findById(id: string): Promise<UserWithTenant | null> {
    const user = await this.db.knex<UserWithTenant>('users')
      .select(
        'users.id',
        'users.tenant_id',
        'users.email',
        'users.name',
        'users.phone',
        'users.avatar_url',
        'users.role',
        'users.permissions',
        'users.status',
        'users.email_verified_at',
        'users.last_login_at',
        'users.created_at',
        'users.updated_at',
        'tenants.name as tenant_name',
        'tenants.slug as tenant_slug',
      )
      .leftJoin('tenants', 'users.tenant_id', 'tenants.id')
      .where('users.id', id)
      .first();

    if (!user) return null;

    return {
      ...user,
      permissions: typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions,
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.db.knex<User>('users')
      .where('email', email)
      .first() || null;
  }

  async create(data: Partial<User>): Promise<User> {
    const insertData: Record<string, any> = {
      email: data.email,
      password_hash: data.password_hash,
      name: data.name,
      role: data.role || 'user',
      status: data.status || 'active',
      permissions: JSON.stringify(data.permissions || []),
    };

    if (data.phone) insertData.phone = data.phone;
    if (data.tenant_id) insertData.tenant_id = data.tenant_id;
    if (data.email_verified_at) insertData.email_verified_at = data.email_verified_at;

    const [user] = await this.db.knex('users')
      .insert(insertData)
      .returning('*');

    return user as User;
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    const updateData: Record<string, any> = {
      updated_at: this.db.knex.fn.now(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.tenant_id !== undefined) updateData.tenant_id = data.tenant_id;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.permissions !== undefined) {
      updateData.permissions = JSON.stringify(data.permissions);
    }

    const [user] = await this.db.knex<User>('users')
      .where({ id })
      .update(updateData)
      .returning('*');

    return user || null;
  }

  async updateStatus(id: string, status: string): Promise<User | null> {
    const [user] = await this.db.knex<User>('users')
      .where({ id })
      .update({ status, updated_at: this.db.knex.fn.now() })
      .returning('*');

    return user || null;
  }

  async delete(id: string): Promise<boolean> {
    const count = await this.db.knex('users').where({ id }).del();
    return count > 0;
  }

  async countByRole(): Promise<{ role: string; count: number }[]> {
    const result = await this.db.knex('users')
      .select('role')
      .count('* as count')
      .groupBy('role');

    return result.map((r) => ({
      role: r.role,
      count: parseInt(r.count as string, 10),
    }));
  }
}
