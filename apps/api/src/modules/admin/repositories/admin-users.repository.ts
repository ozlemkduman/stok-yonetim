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

    let query = this.db.knex<UserWithTenant>('users')
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
      .leftJoin('tenants', 'users.tenant_id', 'tenants.id');

    if (role) {
      query = query.where('users.role', role);
    }

    if (status) {
      query = query.where('users.status', status);
    }

    if (tenantId) {
      query = query.where('users.tenant_id', tenantId);
    }

    if (search) {
      query = query.where((builder) => {
        builder
          .whereILike('users.name', `%${search}%`)
          .orWhereILike('users.email', `%${search}%`);
      });
    }

    const countQuery = query.clone().count('* as count').first();
    const dataQuery = query
      .clone()
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
