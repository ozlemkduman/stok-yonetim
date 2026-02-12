import { Injectable, NotFoundException } from '@nestjs/common';
import { FieldTeamRepository, FieldRoute, FieldVisit } from './field-team.repository';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';

@Injectable()
export class FieldTeamService {
  constructor(private readonly repository: FieldTeamRepository) {}

  // Routes
  async findAllRoutes(params: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    assignedTo?: string;
  }): Promise<{ items: FieldRoute[]; total: number }> {
    return this.repository.findAllRoutes({
      page: params.page || 1,
      limit: params.limit || 20,
      status: params.status,
      startDate: params.startDate,
      endDate: params.endDate,
      assignedTo: params.assignedTo,
    });
  }

  async findRouteById(id: string): Promise<FieldRoute> {
    const route = await this.repository.findRouteById(id);
    if (!route) {
      throw new NotFoundException('Rota bulunamadi');
    }
    return route;
  }

  async createRoute(dto: CreateRouteDto): Promise<FieldRoute> {
    const knex = this.repository.getKnex();

    return knex.transaction(async (trx) => {
      const route = await this.repository.createRoute(
        {
          name: dto.name,
          route_date: new Date(dto.route_date),
          assigned_to: dto.assigned_to || null,
          status: 'planned',
          notes: dto.notes || null,
          estimated_duration_minutes: dto.estimated_duration_minutes || null,
        },
        trx
      );

      if (dto.visits && dto.visits.length > 0) {
        for (let i = 0; i < dto.visits.length; i++) {
          const visit = dto.visits[i];
          await this.repository.createVisit(
            {
              route_id: route.id,
              customer_id: visit.customer_id || null,
              contact_id: visit.contact_id || null,
              visit_order: i + 1,
              status: 'pending',
              visit_type: visit.visit_type as FieldVisit['visit_type'],
              address: visit.address || null,
              scheduled_time: visit.scheduled_time ? new Date(visit.scheduled_time) : null,
              notes: visit.notes || null,
            },
            trx
          );
        }
      }

      return route;
    });
  }

  async updateRoute(id: string, dto: Partial<CreateRouteDto>): Promise<FieldRoute> {
    await this.findRouteById(id);
    const updateData: Partial<FieldRoute> = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.route_date !== undefined) updateData.route_date = new Date(dto.route_date);
    if (dto.assigned_to !== undefined) updateData.assigned_to = dto.assigned_to || null;
    if (dto.notes !== undefined) updateData.notes = dto.notes || null;
    if (dto.estimated_duration_minutes !== undefined) {
      updateData.estimated_duration_minutes = dto.estimated_duration_minutes || null;
    }

    return this.repository.updateRoute(id, updateData);
  }

  async startRoute(id: string): Promise<FieldRoute> {
    await this.findRouteById(id);
    return this.repository.updateRoute(id, { status: 'in_progress' });
  }

  async completeRoute(id: string): Promise<FieldRoute> {
    await this.findRouteById(id);
    return this.repository.updateRoute(id, { status: 'completed' });
  }

  async cancelRoute(id: string): Promise<FieldRoute> {
    await this.findRouteById(id);
    return this.repository.updateRoute(id, { status: 'cancelled' });
  }

  async deleteRoute(id: string): Promise<void> {
    await this.findRouteById(id);
    await this.repository.deleteRoute(id);
  }

  // Visits
  async findVisitsByRouteId(routeId: string): Promise<FieldVisit[]> {
    await this.findRouteById(routeId);
    return this.repository.findVisitsByRouteId(routeId);
  }

  async findVisitById(id: string): Promise<FieldVisit> {
    const visit = await this.repository.findVisitById(id);
    if (!visit) {
      throw new NotFoundException('Ziyaret bulunamadi');
    }
    return visit;
  }

  async updateVisit(id: string, dto: UpdateVisitDto): Promise<FieldVisit> {
    await this.findVisitById(id);
    const data: Partial<FieldVisit> = {
      ...dto,
      check_in_time: dto.check_in_time ? new Date(dto.check_in_time) : undefined,
      check_out_time: dto.check_out_time ? new Date(dto.check_out_time) : undefined,
    };
    return this.repository.updateVisit(id, data);
  }

  async checkInVisit(id: string, latitude?: number, longitude?: number): Promise<FieldVisit> {
    await this.findVisitById(id);
    return this.repository.updateVisit(id, {
      status: 'in_progress',
      check_in_time: new Date(),
      latitude: latitude || null,
      longitude: longitude || null,
    });
  }

  async checkOutVisit(id: string, outcome?: string, latitude?: number, longitude?: number): Promise<FieldVisit> {
    await this.findVisitById(id);
    return this.repository.updateVisit(id, {
      status: 'completed',
      check_out_time: new Date(),
      outcome: outcome || null,
      latitude: latitude || null,
      longitude: longitude || null,
    });
  }

  async skipVisit(id: string, notes?: string): Promise<FieldVisit> {
    await this.findVisitById(id);
    return this.repository.updateVisit(id, {
      status: 'skipped',
      notes: notes || null,
    });
  }

  async deleteVisit(id: string): Promise<void> {
    await this.findVisitById(id);
    await this.repository.deleteVisit(id);
  }

  // Stats
  async getTodayStats() {
    return this.repository.getTodayStats();
  }

  // Route Detail
  async getRouteDetail(id: string): Promise<{
    route: FieldRoute;
    visits: FieldVisit[];
    stats: {
      totalVisits: number;
      completedVisits: number;
      pendingVisits: number;
      skippedVisits: number;
      inProgressVisits: number;
    };
    assignedUser: { id: string; name: string } | null;
  }> {
    const route = await this.findRouteById(id);
    const visits = await this.findVisitsByRouteId(id);
    const assignedUser = route.assigned_to
      ? await this.repository.getUserById(route.assigned_to)
      : null;

    const stats = {
      totalVisits: visits.length,
      completedVisits: visits.filter((v) => v.status === 'completed').length,
      pendingVisits: visits.filter((v) => v.status === 'pending').length,
      skippedVisits: visits.filter((v) => v.status === 'skipped').length,
      inProgressVisits: visits.filter((v) => v.status === 'in_progress').length,
    };

    return { route, visits, stats, assignedUser };
  }
}
