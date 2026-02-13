import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PlansRepository, Plan, PlanWithTenantCount } from '../repositories/plans.repository';

export interface CreatePlanDto {
  name: string;
  code: string;
  price: number;
  billingPeriod?: string;
  features?: Record<string, boolean>;
  limits?: Record<string, number>;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdatePlanDto {
  name?: string;
  price?: number;
  billingPeriod?: string;
  features?: Record<string, boolean>;
  limits?: Record<string, number>;
  isActive?: boolean;
  sortOrder?: number;
}

@Injectable()
export class AdminPlansService {
  constructor(private readonly plansRepository: PlansRepository) {}

  async findAll(includeInactive = false): Promise<PlanWithTenantCount[]> {
    return this.plansRepository.findAll(includeInactive);
  }

  async findById(id: string): Promise<Plan> {
    const plan = await this.plansRepository.findById(id);
    if (!plan) {
      throw new NotFoundException('Plan bulunamadı');
    }
    return plan;
  }

  async create(dto: CreatePlanDto): Promise<Plan> {
    // Check if code exists
    const existing = await this.plansRepository.findByCode(dto.code);
    if (existing) {
      throw new ConflictException('Bu plan kodu zaten kullanımda');
    }

    const plan = await this.plansRepository.create({
      name: dto.name,
      code: dto.code,
      price: dto.price,
      billing_period: dto.billingPeriod || 'monthly',
      features: dto.features || {},
      limits: dto.limits || {},
      is_active: dto.isActive ?? true,
      sort_order: dto.sortOrder || 0,
    } as any);

    return plan;
  }

  async update(id: string, dto: UpdatePlanDto): Promise<Plan> {
    const plan = await this.plansRepository.findById(id);
    if (!plan) {
      throw new NotFoundException('Plan bulunamadı');
    }

    const updated = await this.plansRepository.update(id, {
      name: dto.name,
      price: dto.price,
      billing_period: dto.billingPeriod,
      features: dto.features,
      limits: dto.limits,
      is_active: dto.isActive,
      sort_order: dto.sortOrder,
    } as any);

    return updated as Plan;
  }

  async delete(id: string): Promise<void> {
    const plan = await this.plansRepository.findById(id);
    if (!plan) {
      throw new NotFoundException('Plan bulunamadı');
    }

    const deleted = await this.plansRepository.delete(id);
    if (!deleted) {
      throw new BadRequestException('Plan silinemedi. Bu plan kullanımda olabilir.');
    }
  }
}
