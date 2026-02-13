import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { TenantsRepository, TenantWithPlan } from '../repositories/tenants.repository';
import { PlansRepository } from '../repositories/plans.repository';
import { PaginationParams } from '../../../common/dto/pagination.dto';

export interface CreateTenantDto {
  name: string;
  slug?: string;
  domain?: string;
  planId?: string;
  billingEmail?: string;
  status?: string;
}

export interface UpdateTenantDto {
  name?: string;
  domain?: string;
  planId?: string;
  billingEmail?: string;
  status?: string;
  settings?: Record<string, any>;
}

@Injectable()
export class AdminTenantsService {
  constructor(
    private readonly tenantsRepository: TenantsRepository,
    private readonly plansRepository: PlansRepository,
  ) {}

  async findAll(params: PaginationParams & { status?: string; search?: string }) {
    return this.tenantsRepository.findAll(params);
  }

  async findById(id: string): Promise<TenantWithPlan> {
    const tenant = await this.tenantsRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException('Kiracı bulunamadı');
    }
    return tenant;
  }

  async create(dto: CreateTenantDto) {
    // Generate slug if not provided
    const slug = dto.slug || this.generateSlug(dto.name);

    // Check if slug exists
    const existing = await this.tenantsRepository.findAll({ search: slug, limit: 1, page: 1 });
    if (existing.items.some((t) => t.slug === slug)) {
      throw new ConflictException('Bu slug zaten kullanımda');
    }

    // Validate plan if provided
    if (dto.planId) {
      const plan = await this.plansRepository.findById(dto.planId);
      if (!plan) {
        throw new BadRequestException('Geçersiz plan');
      }
    }

    const tenant = await this.tenantsRepository.create({
      name: dto.name,
      slug,
      domain: dto.domain,
      plan_id: dto.planId,
      billing_email: dto.billingEmail,
      status: dto.status || 'active',
      settings: {},
    });

    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    const tenant = await this.tenantsRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException('Kiracı bulunamadı');
    }

    // Validate plan if changing
    if (dto.planId && dto.planId !== tenant.plan_id) {
      const plan = await this.plansRepository.findById(dto.planId);
      if (!plan) {
        throw new BadRequestException('Geçersiz plan');
      }
    }

    const updated = await this.tenantsRepository.update(id, {
      name: dto.name,
      domain: dto.domain,
      plan_id: dto.planId,
      billing_email: dto.billingEmail,
      status: dto.status,
      settings: dto.settings,
    } as any);

    return updated;
  }

  async delete(id: string): Promise<void> {
    const tenant = await this.tenantsRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException('Kiracı bulunamadı');
    }

    const deleted = await this.tenantsRepository.delete(id);
    if (!deleted) {
      throw new BadRequestException('Kiracı silinemedi');
    }
  }

  async suspend(id: string): Promise<TenantWithPlan> {
    const tenant = await this.tenantsRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException('Kiracı bulunamadı');
    }

    if (tenant.status === 'suspended') {
      throw new BadRequestException('Kiracı zaten askıya alınmış');
    }

    await this.tenantsRepository.updateStatus(id, 'suspended');
    return this.tenantsRepository.findById(id) as Promise<TenantWithPlan>;
  }

  async activate(id: string): Promise<TenantWithPlan> {
    const tenant = await this.tenantsRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException('Kiracı bulunamadı');
    }

    if (tenant.status === 'active') {
      throw new BadRequestException('Kiracı zaten aktif');
    }

    await this.tenantsRepository.updateStatus(id, 'active');
    return this.tenantsRepository.findById(id) as Promise<TenantWithPlan>;
  }

  async getStats(id: string) {
    const tenant = await this.tenantsRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException('Kiracı bulunamadı');
    }

    return this.tenantsRepository.getTenantStats(id);
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
