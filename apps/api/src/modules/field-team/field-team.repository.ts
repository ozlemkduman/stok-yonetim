import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { Knex } from 'knex';

export interface FieldRoute {
  id: string;
  name: string;
  route_date: Date;
  assigned_to: string | null;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  notes: string | null;
  estimated_duration_minutes: number | null;
  actual_duration_minutes: number | null;
  created_at: Date;
  updated_at: Date;
  visit_count?: number;
  completed_count?: number;
}

export interface FieldVisit {
  id: string;
  route_id: string;
  customer_id: string | null;
  contact_id: string | null;
  visit_order: number;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'rescheduled';
  visit_type: 'sales' | 'support' | 'collection' | 'delivery' | 'meeting' | 'other';
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  scheduled_time: Date | null;
  check_in_time: Date | null;
  check_out_time: Date | null;
  notes: string | null;
  outcome: string | null;
  photos: string[];
  created_at: Date;
  updated_at: Date;
  customer_name?: string;
  contact_name?: string;
}

@Injectable()
export class FieldTeamRepository {
  constructor(private readonly db: DatabaseService) {}

  // Routes
  async findAllRoutes(params: {
    page: number;
    limit: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    assignedTo?: string;
  }): Promise<{ items: FieldRoute[]; total: number }> {
    const { page, limit, status, startDate, endDate, assignedTo } = params;
    const offset = (page - 1) * limit;

    let query = this.db.knex('field_team_routes').select('field_team_routes.*');
    let countQuery = this.db.knex('field_team_routes');

    if (status) {
      query = query.where('status', status);
      countQuery = countQuery.where('status', status);
    }
    if (startDate) {
      query = query.where('route_date', '>=', startDate);
      countQuery = countQuery.where('route_date', '>=', startDate);
    }
    if (endDate) {
      query = query.where('route_date', '<=', endDate);
      countQuery = countQuery.where('route_date', '<=', endDate);
    }
    if (assignedTo) {
      query = query.where('assigned_to', assignedTo);
      countQuery = countQuery.where('assigned_to', assignedTo);
    }

    const [items, [{ count }]] = await Promise.all([
      query.orderBy('route_date', 'desc').limit(limit).offset(offset),
      countQuery.count('id as count'),
    ]);

    // Get visit counts for each route
    const routeIds = items.map((r: FieldRoute) => r.id);
    if (routeIds.length > 0) {
      const visitCounts = await this.db.knex('field_team_visits')
        .whereIn('route_id', routeIds)
        .select('route_id')
        .count('id as visit_count')
        .groupBy('route_id');

      const completedCounts = await this.db.knex('field_team_visits')
        .whereIn('route_id', routeIds)
        .where('status', 'completed')
        .select('route_id')
        .count('id as completed_count')
        .groupBy('route_id');

      const visitMap = new Map(visitCounts.map((v: { route_id: string; visit_count: string }) => [v.route_id, parseInt(v.visit_count, 10)]));
      const completedMap = new Map(completedCounts.map((v: { route_id: string; completed_count: string }) => [v.route_id, parseInt(v.completed_count, 10)]));

      items.forEach((item: FieldRoute) => {
        item.visit_count = visitMap.get(item.id) || 0;
        item.completed_count = completedMap.get(item.id) || 0;
      });
    }

    return { items, total: parseInt(count as string, 10) };
  }

  async findRouteById(id: string): Promise<FieldRoute | null> {
    const route = await this.db.knex('field_team_routes').where('id', id).first();
    if (!route) return null;

    const [{ count: visit_count }] = await this.db.knex('field_team_visits')
      .where('route_id', id)
      .count('id as count');
    const [{ count: completed_count }] = await this.db.knex('field_team_visits')
      .where('route_id', id)
      .where('status', 'completed')
      .count('id as count');

    return {
      ...route,
      visit_count: parseInt(visit_count as string, 10),
      completed_count: parseInt(completed_count as string, 10),
    };
  }

  async createRoute(data: Partial<FieldRoute>, trx?: Knex.Transaction): Promise<FieldRoute> {
    const conn = trx || this.db.knex;
    const [route] = await conn('field_team_routes').insert(data).returning('*');
    return route;
  }

  async updateRoute(id: string, data: Partial<FieldRoute>): Promise<FieldRoute> {
    const [route] = await this.db.knex('field_team_routes')
      .where('id', id)
      .update({ ...data, updated_at: this.db.knex.fn.now() })
      .returning('*');
    return route;
  }

  async deleteRoute(id: string): Promise<void> {
    await this.db.knex('field_team_routes').where('id', id).delete();
  }

  // Visits
  async findVisitsByRouteId(routeId: string): Promise<FieldVisit[]> {
    return this.db.knex('field_team_visits')
      .leftJoin('customers', 'field_team_visits.customer_id', 'customers.id')
      .leftJoin('crm_contacts', 'field_team_visits.contact_id', 'crm_contacts.id')
      .select(
        'field_team_visits.*',
        'customers.name as customer_name',
        'crm_contacts.name as contact_name'
      )
      .where('field_team_visits.route_id', routeId)
      .orderBy('field_team_visits.visit_order', 'asc');
  }

  async findVisitById(id: string): Promise<FieldVisit | null> {
    return this.db.knex('field_team_visits')
      .leftJoin('customers', 'field_team_visits.customer_id', 'customers.id')
      .leftJoin('crm_contacts', 'field_team_visits.contact_id', 'crm_contacts.id')
      .select(
        'field_team_visits.*',
        'customers.name as customer_name',
        'crm_contacts.name as contact_name'
      )
      .where('field_team_visits.id', id)
      .first() || null;
  }

  async createVisit(data: Partial<FieldVisit>, trx?: Knex.Transaction): Promise<FieldVisit> {
    const conn = trx || this.db.knex;
    const [visit] = await conn('field_team_visits').insert(data).returning('*');
    return visit;
  }

  async updateVisit(id: string, data: Partial<FieldVisit>): Promise<FieldVisit> {
    const [visit] = await this.db.knex('field_team_visits')
      .where('id', id)
      .update({ ...data, updated_at: this.db.knex.fn.now() })
      .returning('*');
    return visit;
  }

  async deleteVisit(id: string): Promise<void> {
    await this.db.knex('field_team_visits').where('id', id).delete();
  }

  // Stats
  async getTodayStats(): Promise<{
    totalRoutes: number;
    completedRoutes: number;
    totalVisits: number;
    completedVisits: number;
  }> {
    const today = new Date().toISOString().split('T')[0];

    const [routeStats] = await this.db.knex('field_team_routes')
      .where('route_date', today)
      .select(
        this.db.knex.raw('COUNT(*) as total_routes'),
        this.db.knex.raw("COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_routes")
      );

    const todayRouteIds = await this.db.knex('field_team_routes')
      .where('route_date', today)
      .pluck('id');

    let totalVisits = 0;
    let completedVisits = 0;

    if (todayRouteIds.length > 0) {
      const [visitStats] = await this.db.knex('field_team_visits')
        .whereIn('route_id', todayRouteIds)
        .select(
          this.db.knex.raw('COUNT(*) as total_visits'),
          this.db.knex.raw("COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_visits")
        ) as unknown as Array<{ total_visits: string; completed_visits: string }>;
      totalVisits = parseInt(visitStats.total_visits, 10);
      completedVisits = parseInt(visitStats.completed_visits, 10);
    }

    const stats = routeStats as unknown as { total_routes: string; completed_routes: string };
    return {
      totalRoutes: parseInt(stats.total_routes, 10),
      completedRoutes: parseInt(stats.completed_routes, 10),
      totalVisits,
      completedVisits,
    };
  }

  getKnex() {
    return this.db.knex;
  }

  async getUserById(id: string): Promise<{ id: string; name: string } | null> {
    const user = await this.db.knex('users')
      .where('id', id)
      .select('id', 'name')
      .first();
    return user || null;
  }
}
