import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../database/database.service';

export interface Invitation {
  id: string;
  email: string;
  token: string;
  role: string;
  tenant_id: string | null;
  tenant_name: string | null;
  invited_by: string | null;
  expires_at: Date;
  accepted_at: Date | null;
  created_at: Date;
}

export interface InvitationWithDetails extends Invitation {
  inviter_name?: string;
  inviter_email?: string;
  existing_tenant_name?: string;
}

@Injectable()
export class InvitationsRepository {
  constructor(private readonly db: DatabaseService) {}

  async findByToken(token: string): Promise<Invitation | null> {
    const invitation = await this.db
      .knex<Invitation>('invitations')
      .where('token', token)
      .first();
    return invitation || null;
  }

  async findByEmail(email: string): Promise<Invitation | null> {
    const invitation = await this.db
      .knex<Invitation>('invitations')
      .where('email', email)
      .whereNull('accepted_at')
      .where('expires_at', '>', new Date())
      .first();
    return invitation || null;
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    status?: 'pending' | 'accepted' | 'expired';
    tenantId?: string;
  }): Promise<{ data: InvitationWithDetails[]; total: number }> {
    const { page = 1, limit = 20, status, tenantId } = params;
    const offset = (page - 1) * limit;

    let baseQuery = this.db.knex('invitations');

    if (tenantId) {
      baseQuery = baseQuery.where('invitations.tenant_id', tenantId);
    }

    if (status === 'pending') {
      baseQuery = baseQuery.whereNull('accepted_at').where('expires_at', '>', new Date());
    } else if (status === 'accepted') {
      baseQuery = baseQuery.whereNotNull('accepted_at');
    } else if (status === 'expired') {
      baseQuery = baseQuery.whereNull('accepted_at').where('expires_at', '<=', new Date());
    }

    const countResult = await baseQuery.clone().count('* as count').first();
    const total = parseInt(countResult?.count as string, 10) || 0;

    const data = await baseQuery
      .clone()
      .select(
        'invitations.*',
        'users.name as inviter_name',
        'users.email as inviter_email',
        'tenants.name as existing_tenant_name'
      )
      .leftJoin('users', 'invitations.invited_by', 'users.id')
      .leftJoin('tenants', 'invitations.tenant_id', 'tenants.id')
      .orderBy('invitations.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return { data, total };
  }

  async create(data: {
    email: string;
    token: string;
    role: string;
    tenant_id?: string;
    tenant_name?: string;
    invited_by: string;
    expires_at: Date;
  }): Promise<Invitation> {
    const [invitation] = await this.db
      .knex('invitations')
      .insert({
        email: data.email,
        token: data.token,
        role: data.role,
        tenant_id: data.tenant_id || null,
        tenant_name: data.tenant_name || null,
        invited_by: data.invited_by,
        expires_at: data.expires_at,
      })
      .returning('*');

    return invitation as Invitation;
  }

  async markAsAccepted(id: string): Promise<void> {
    await this.db
      .knex('invitations')
      .where('id', id)
      .update({ accepted_at: new Date() });
  }

  async delete(id: string): Promise<void> {
    await this.db.knex('invitations').where('id', id).delete();
  }

  async deleteExpired(): Promise<number> {
    const result = await this.db
      .knex('invitations')
      .whereNull('accepted_at')
      .where('expires_at', '<', new Date())
      .delete();
    return result;
  }
}
