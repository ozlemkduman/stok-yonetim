import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { BaseTenantRepository } from '../../common/repositories/base.repository';

export interface CrmContact {
  id: string;
  customer_id: string | null;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  status: 'lead' | 'prospect' | 'customer' | 'inactive';
  source: 'website' | 'referral' | 'social' | 'cold_call' | 'event' | 'other' | null;
  notes: string | null;
  custom_fields: Record<string, unknown>;
  assigned_to: string | null;
  last_contact_date: Date | null;
  next_follow_up: Date | null;
  created_at: Date;
  updated_at: Date;
  customer_name?: string;
}

export interface CrmActivity {
  id: string;
  contact_id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task';
  subject: string;
  description: string | null;
  status: 'planned' | 'completed' | 'cancelled';
  scheduled_at: Date | null;
  completed_at: Date | null;
  duration_minutes: number | null;
  outcome: Record<string, unknown>;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  contact_name?: string;
}

@Injectable()
export class CrmRepository extends BaseTenantRepository<CrmContact> {
  protected tableName = 'crm_contacts';

  constructor(db: DatabaseService) {
    super(db);
  }

  // Contacts
  async findAllContacts(params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    source?: string;
  }): Promise<{ items: CrmContact[]; total: number }> {
    const { page, limit, search, status, source } = params;
    const offset = (page - 1) * limit;

    let query = this.query.clone()
      .leftJoin('customers', 'crm_contacts.customer_id', 'customers.id')
      .select('crm_contacts.*', 'customers.name as customer_name');
    let countQuery = this.query.clone();

    if (status) {
      query = query.where('crm_contacts.status', status);
      countQuery = countQuery.where('status', status);
    }
    if (source) {
      query = query.where('crm_contacts.source', source);
      countQuery = countQuery.where('source', source);
    }
    if (search) {
      query = query.where((b) =>
        b.whereILike('crm_contacts.name', `%${search}%`)
          .orWhereILike('crm_contacts.email', `%${search}%`)
          .orWhereILike('crm_contacts.phone', `%${search}%`)
      );
      countQuery = countQuery.where((b) =>
        b.whereILike('name', `%${search}%`)
          .orWhereILike('email', `%${search}%`)
          .orWhereILike('phone', `%${search}%`)
      );
    }

    const [items, [{ count }]] = await Promise.all([
      query.orderBy('crm_contacts.created_at', 'desc').limit(limit).offset(offset),
      countQuery.count('id as count'),
    ]);
    return { items, total: parseInt(count as string, 10) };
  }

  async findContactById(id: string): Promise<CrmContact | null> {
    return this.query.clone()
      .leftJoin('customers', 'crm_contacts.customer_id', 'customers.id')
      .select('crm_contacts.*', 'customers.name as customer_name')
      .where('crm_contacts.id', id)
      .first() || null;
  }

  async createCrmContact(data: Partial<CrmContact>): Promise<CrmContact> {
    const insertData = this.getInsertData(data);
    const [contact] = await this.knex(this.tableName).insert(insertData).returning('*');
    return contact;
  }

  async updateCrmContact(id: string, data: Partial<CrmContact>): Promise<CrmContact> {
    const [contact] = await this.query
      .where(`${this.tableName}.id`, id)
      .update({ ...data, updated_at: this.knex.fn.now() })
      .returning('*');
    return contact;
  }

  async deleteCrmContact(id: string): Promise<void> {
    await this.query.where(`${this.tableName}.id`, id).delete();
  }

  // Activities
  async findActivitiesByContactId(contactId: string): Promise<CrmActivity[]> {
    const query = this.knex('crm_activities')
      .where('contact_id', contactId)
      .orderBy('created_at', 'desc');

    return this.applyTenantFilter(query, 'crm_activities');
  }

  async findAllActivities(params: {
    page: number;
    limit: number;
    contactId?: string;
    type?: string;
    status?: string;
  }): Promise<{ items: CrmActivity[]; total: number }> {
    const { page, limit, contactId, type, status } = params;
    const offset = (page - 1) * limit;

    let query = this.knex('crm_activities')
      .leftJoin('crm_contacts', 'crm_activities.contact_id', 'crm_contacts.id')
      .select('crm_activities.*', 'crm_contacts.name as contact_name');

    query = this.applyTenantFilter(query, 'crm_activities');

    let countQuery = this.knex('crm_activities');
    countQuery = this.applyTenantFilter(countQuery, 'crm_activities');

    if (contactId) {
      query = query.where('crm_activities.contact_id', contactId);
      countQuery = countQuery.where('contact_id', contactId);
    }
    if (type) {
      query = query.where('crm_activities.type', type);
      countQuery = countQuery.where('type', type);
    }
    if (status) {
      query = query.where('crm_activities.status', status);
      countQuery = countQuery.where('status', status);
    }

    const [items, [{ count }]] = await Promise.all([
      query.orderBy('crm_activities.created_at', 'desc').limit(limit).offset(offset),
      countQuery.count('id as count'),
    ]);
    return { items, total: parseInt(count as string, 10) };
  }

  async createCrmActivity(data: Partial<CrmActivity>): Promise<CrmActivity> {
    const insertData = this.getInsertData(data as any);
    const [activity] = await this.knex('crm_activities').insert(insertData).returning('*');
    // Update contact's last_contact_date
    if (data.contact_id) {
      await this.query
        .where(`${this.tableName}.id`, data.contact_id)
        .update({ last_contact_date: this.knex.fn.now(), updated_at: this.knex.fn.now() });
    }
    return activity;
  }

  async updateCrmActivity(id: string, data: Partial<CrmActivity>): Promise<CrmActivity> {
    const query = this.knex('crm_activities').where('id', id);
    const [activity] = await this.applyTenantFilter(query, 'crm_activities')
      .update({ ...data, updated_at: this.knex.fn.now() })
      .returning('*');
    return activity;
  }

  async deleteCrmActivity(id: string): Promise<void> {
    const query = this.knex('crm_activities').where('id', id);
    await this.applyTenantFilter(query, 'crm_activities').delete();
  }

  // Dashboard stats
  async getContactStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
  }> {
    const [{ count: total }] = await this.query.clone().count('id as count');
    const statusCounts = await this.query.clone()
      .select('status')
      .count('id as count')
      .groupBy('status');
    const sourceCounts = await this.query.clone()
      .select('source')
      .count('id as count')
      .whereNotNull('source')
      .groupBy('source');

    const byStatus: Record<string, number> = {};
    statusCounts.forEach((row: { status: string; count: string }) => {
      byStatus[row.status] = parseInt(row.count, 10);
    });

    const bySource: Record<string, number> = {};
    sourceCounts.forEach((row: { source: string; count: string }) => {
      bySource[row.source] = parseInt(row.count, 10);
    });

    return { total: parseInt(total as string, 10), byStatus, bySource };
  }

  // Get activity stats for a specific contact
  async getContactActivityStats(contactId: string): Promise<{
    totalActivities: number;
    completedActivities: number;
    plannedActivities: number;
    byType: Record<string, number>;
  }> {
    const baseQuery = this.knex('crm_activities').where('contact_id', contactId);
    const [{ count: total }] = await this.applyTenantFilter(baseQuery.clone(), 'crm_activities').count('id as count');

    const statusCounts = await this.applyTenantFilter(
      this.knex('crm_activities').where('contact_id', contactId),
      'crm_activities'
    )
      .select('status')
      .count('id as count')
      .groupBy('status');

    const typeCounts = await this.applyTenantFilter(
      this.knex('crm_activities').where('contact_id', contactId),
      'crm_activities'
    )
      .select('type')
      .count('id as count')
      .groupBy('type');

    const byStatus: Record<string, number> = {};
    statusCounts.forEach((row: { status: string; count: string }) => {
      byStatus[row.status] = parseInt(row.count, 10);
    });

    const byType: Record<string, number> = {};
    typeCounts.forEach((row: { type: string; count: string }) => {
      byType[row.type] = parseInt(row.count, 10);
    });

    return {
      totalActivities: parseInt(total as string, 10),
      completedActivities: byStatus['completed'] || 0,
      plannedActivities: byStatus['planned'] || 0,
      byType,
    };
  }

  // Convert contact to customer
  async convertToCustomer(contactId: string, contact: CrmContact): Promise<string> {
    const insertData = this.getInsertData({
      name: contact.name,
      phone: contact.phone || contact.mobile,
      email: contact.email,
      notes: contact.notes,
      is_active: true,
      balance: 0,
    } as any);
    const [customer] = await this.knex('customers').insert(insertData).returning('id');

    return customer.id;
  }
}
