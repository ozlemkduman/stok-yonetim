import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

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
export class CrmRepository {
  constructor(private readonly db: DatabaseService) {}

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

    let query = this.db.knex('crm_contacts')
      .leftJoin('customers', 'crm_contacts.customer_id', 'customers.id')
      .select('crm_contacts.*', 'customers.name as customer_name');
    let countQuery = this.db.knex('crm_contacts');

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
    return this.db.knex('crm_contacts')
      .leftJoin('customers', 'crm_contacts.customer_id', 'customers.id')
      .select('crm_contacts.*', 'customers.name as customer_name')
      .where('crm_contacts.id', id)
      .first() || null;
  }

  async createContact(data: Partial<CrmContact>): Promise<CrmContact> {
    const [contact] = await this.db.knex('crm_contacts').insert(data).returning('*');
    return contact;
  }

  async updateContact(id: string, data: Partial<CrmContact>): Promise<CrmContact> {
    const [contact] = await this.db.knex('crm_contacts')
      .where('id', id)
      .update({ ...data, updated_at: this.db.knex.fn.now() })
      .returning('*');
    return contact;
  }

  async deleteContact(id: string): Promise<void> {
    await this.db.knex('crm_contacts').where('id', id).delete();
  }

  // Activities
  async findActivitiesByContactId(contactId: string): Promise<CrmActivity[]> {
    return this.db.knex('crm_activities')
      .where('contact_id', contactId)
      .orderBy('created_at', 'desc');
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

    let query = this.db.knex('crm_activities')
      .leftJoin('crm_contacts', 'crm_activities.contact_id', 'crm_contacts.id')
      .select('crm_activities.*', 'crm_contacts.name as contact_name');
    let countQuery = this.db.knex('crm_activities');

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

  async createActivity(data: Partial<CrmActivity>): Promise<CrmActivity> {
    const [activity] = await this.db.knex('crm_activities').insert(data).returning('*');
    // Update contact's last_contact_date
    if (data.contact_id) {
      await this.db.knex('crm_contacts')
        .where('id', data.contact_id)
        .update({ last_contact_date: this.db.knex.fn.now(), updated_at: this.db.knex.fn.now() });
    }
    return activity;
  }

  async updateActivity(id: string, data: Partial<CrmActivity>): Promise<CrmActivity> {
    const [activity] = await this.db.knex('crm_activities')
      .where('id', id)
      .update({ ...data, updated_at: this.db.knex.fn.now() })
      .returning('*');
    return activity;
  }

  async deleteActivity(id: string): Promise<void> {
    await this.db.knex('crm_activities').where('id', id).delete();
  }

  // Dashboard stats
  async getContactStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
  }> {
    const [{ count: total }] = await this.db.knex('crm_contacts').count('id as count');
    const statusCounts = await this.db.knex('crm_contacts')
      .select('status')
      .count('id as count')
      .groupBy('status');
    const sourceCounts = await this.db.knex('crm_contacts')
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
    const [{ count: total }] = await this.db.knex('crm_activities')
      .where('contact_id', contactId)
      .count('id as count');

    const statusCounts = await this.db.knex('crm_activities')
      .select('status')
      .count('id as count')
      .where('contact_id', contactId)
      .groupBy('status');

    const typeCounts = await this.db.knex('crm_activities')
      .select('type')
      .count('id as count')
      .where('contact_id', contactId)
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
    const [customer] = await this.db.knex('customers').insert({
      name: contact.name,
      phone: contact.phone || contact.mobile,
      email: contact.email,
      notes: contact.notes,
      is_active: true,
      balance: 0,
    }).returning('id');

    return customer.id;
  }
}
