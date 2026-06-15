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
  /** Sektör (business_type). 'general' (varsayılan) | 'auto_service' */
  businessType?: string;
  /**
   * Üyelik süresi (gün). status='trial' → trial_ends_at, diğer durumda
   * subscription_ends_at = now + durationDays olarak set edilir.
   * Boş bırakılırsa süresiz.
   */
  durationDays?: number;
}

export interface UpdateTenantDto {
  name?: string;
  domain?: string;
  planId?: string;
  billingEmail?: string;
  status?: string;
  settings?: Record<string, any>;
  durationDays?: number;
  /** Sektör (business_type). 'general' | 'auto_service' */
  businessType?: string;
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
      throw new NotFoundException('Organizasyon bulunamadi');
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

    // durationDays varsa status'a göre uygun "ends_at" alanını hesapla
    const effectiveStatus = dto.status || 'active';
    let trialEndsAt: Date | undefined;
    let subscriptionEndsAt: Date | undefined;
    if (dto.durationDays && dto.durationDays > 0) {
      const end = new Date();
      end.setDate(end.getDate() + dto.durationDays);
      if (effectiveStatus === 'trial') {
        trialEndsAt = end;
      } else {
        subscriptionEndsAt = end;
      }
    }

    const tenant = await this.tenantsRepository.create({
      name: dto.name,
      slug,
      domain: dto.domain,
      plan_id: dto.planId,
      billing_email: dto.billingEmail,
      status: effectiveStatus,
      business_type: dto.businessType || 'general',
      settings: {},
      trial_ends_at: trialEndsAt,
      subscription_ends_at: subscriptionEndsAt,
    });

    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto) {
    const tenant = await this.tenantsRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException('Organizasyon bulunamadi');
    }

    // Validate plan if changing
    if (dto.planId && dto.planId !== tenant.plan_id) {
      const plan = await this.plansRepository.findById(dto.planId);
      if (!plan) {
        throw new BadRequestException('Geçersiz plan');
      }
    }

    // durationDays verilirse mevcut tarihten itibaren süreyi yeniden hesapla
    const updateData: any = {
      name: dto.name,
      domain: dto.domain,
      plan_id: dto.planId,
      billing_email: dto.billingEmail,
      status: dto.status,
      settings: dto.settings,
      business_type: dto.businessType,
    };
    if (dto.durationDays && dto.durationDays > 0) {
      const end = new Date();
      end.setDate(end.getDate() + dto.durationDays);
      const effectiveStatus = dto.status || tenant.status;
      if (effectiveStatus === 'trial') {
        updateData.trial_ends_at = end;
      } else {
        updateData.subscription_ends_at = end;
      }
    }

    const updated = await this.tenantsRepository.update(id, updateData);

    return updated;
  }

  async delete(id: string): Promise<void> {
    const tenant = await this.tenantsRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException('Organizasyon bulunamadi');
    }

    // Clear owner_id first to avoid circular dependency
    if (tenant.owner_id) {
      await this.tenantsRepository.update(id, { owner_id: null } as any);
    }

    const deleted = await this.tenantsRepository.delete(id);
    if (!deleted) {
      throw new BadRequestException('Organizasyon silinemedi');
    }
  }

  async suspend(id: string): Promise<TenantWithPlan> {
    const tenant = await this.tenantsRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException('Organizasyon bulunamadi');
    }

    if (tenant.status === 'suspended') {
      throw new BadRequestException('Organizasyon zaten askiya alinmis');
    }

    await this.tenantsRepository.updateStatus(id, 'suspended');
    return this.tenantsRepository.findById(id) as Promise<TenantWithPlan>;
  }

  async activate(id: string): Promise<TenantWithPlan> {
    const tenant = await this.tenantsRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException('Organizasyon bulunamadi');
    }

    if (tenant.status === 'active') {
      throw new BadRequestException('Organizasyon zaten aktif');
    }

    await this.tenantsRepository.updateStatus(id, 'active');
    return this.tenantsRepository.findById(id) as Promise<TenantWithPlan>;
  }

  async getStats(id: string) {
    const tenant = await this.tenantsRepository.findById(id);
    if (!tenant) {
      throw new NotFoundException('Organizasyon bulunamadi');
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
