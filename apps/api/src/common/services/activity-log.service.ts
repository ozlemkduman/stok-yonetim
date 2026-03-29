import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { getCurrentTenantId, getCurrentUserId } from '../context/tenant.context';

export interface LogActivityParams {
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
}

@Injectable()
export class ActivityLogService {
  private readonly logger = new Logger(ActivityLogService.name);

  constructor(private readonly db: DatabaseService) {}

  async log(params: LogActivityParams): Promise<void> {
    try {
      await this.db.knex('tenant_activity_logs').insert({
        tenant_id: getCurrentTenantId(),
        user_id: getCurrentUserId(),
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId || null,
        old_values: params.oldValues ? JSON.stringify(params.oldValues) : null,
        new_values: params.newValues ? JSON.stringify(params.newValues) : null,
        metadata: JSON.stringify(params.metadata || {}),
      });
    } catch (error) {
      this.logger.error('Failed to write activity log', error);
    }
  }
}
