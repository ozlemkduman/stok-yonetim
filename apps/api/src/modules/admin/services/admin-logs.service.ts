import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';
import { PaginationParams, createPaginatedResponse } from '../../../common/dto/pagination.dto';

export interface ActivityLog {
  id: string;
  tenant_id: string | null;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  ip_address: string | null;
  metadata: Record<string, any>;
  created_at: Date;
}

export interface ActivityLogWithDetails extends ActivityLog {
  user_name?: string;
  user_email?: string;
  tenant_name?: string;
}

@Injectable()
export class AdminLogsService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(
    params: PaginationParams & {
      tenantId?: string;
      userId?: string;
      action?: string;
      entityType?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const {
      page = 1,
      limit = 50,
      sortBy = 'created_at',
      sortOrder = 'desc',
      tenantId,
      userId,
      action,
      entityType,
      startDate,
      endDate,
    } = params;

    const offset = (page - 1) * limit;

    let query = this.db.knex<ActivityLogWithDetails>('tenant_activity_logs')
      .select(
        'tenant_activity_logs.*',
        'users.name as user_name',
        'users.email as user_email',
        'tenants.name as tenant_name',
      )
      .leftJoin('users', 'tenant_activity_logs.user_id', 'users.id')
      .leftJoin('tenants', 'tenant_activity_logs.tenant_id', 'tenants.id');

    if (tenantId) {
      query = query.where('tenant_activity_logs.tenant_id', tenantId);
    }

    if (userId) {
      query = query.where('tenant_activity_logs.user_id', userId);
    }

    if (action) {
      query = query.where('tenant_activity_logs.action', action);
    }

    if (entityType) {
      query = query.where('tenant_activity_logs.entity_type', entityType);
    }

    if (startDate) {
      query = query.where('tenant_activity_logs.created_at', '>=', startDate);
    }

    if (endDate) {
      query = query.where('tenant_activity_logs.created_at', '<=', endDate);
    }

    const countQuery = query.clone().count('* as count').first();
    const dataQuery = query
      .clone()
      .orderBy(`tenant_activity_logs.${sortBy}`, sortOrder)
      .limit(limit)
      .offset(offset);

    const [countResult, items] = await Promise.all([countQuery, dataQuery]);
    const total = parseInt(countResult?.count as string, 10) || 0;

    return createPaginatedResponse(items, total, page, limit);
  }

  async getActionTypes(): Promise<string[]> {
    const results = await this.db.knex('tenant_activity_logs')
      .distinct('action')
      .orderBy('action');

    return results.map((r) => r.action);
  }

  async getEntityTypes(): Promise<string[]> {
    const results = await this.db.knex('tenant_activity_logs')
      .distinct('entity_type')
      .whereNotNull('entity_type')
      .orderBy('entity_type');

    return results.map((r) => r.entity_type);
  }

  async createLog(data: Partial<ActivityLog>): Promise<ActivityLog> {
    const insertData = {
      ...data,
      old_values: data.old_values ? JSON.stringify(data.old_values) : null,
      new_values: data.new_values ? JSON.stringify(data.new_values) : null,
      metadata: JSON.stringify(data.metadata || {}),
    };
    const [log] = await this.db.knex('tenant_activity_logs')
      .insert(insertData)
      .returning('*');

    return log as ActivityLog;
  }
}
