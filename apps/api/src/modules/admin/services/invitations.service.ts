import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { InvitationsRepository, Invitation } from '../repositories/invitations.repository';
import { TenantsRepository } from '../repositories/tenants.repository';
import { AdminUsersRepository } from '../repositories/admin-users.repository';

export interface CreateInvitationDto {
  email: string;
  role: string;
  tenantId?: string;      // Existing tenant
  tenantName?: string;    // New tenant name (for tenant_admin invitations)
}

@Injectable()
export class InvitationsService {
  constructor(
    private readonly invitationsRepository: InvitationsRepository,
    private readonly tenantsRepository: TenantsRepository,
    private readonly usersRepository: AdminUsersRepository,
  ) {}

  async createInvitation(dto: CreateInvitationDto, invitedBy: string): Promise<Invitation> {
    // Check if user already exists
    const existingUser = await this.usersRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException('Bu e-posta adresi zaten kayitli');
    }

    // Check if there's already a pending invitation
    const existingInvitation = await this.invitationsRepository.findByEmail(dto.email);
    if (existingInvitation) {
      throw new BadRequestException('Bu e-posta adresine zaten bir davet gonderilmis');
    }

    // If creating new tenant, validate tenant name
    if (dto.role === 'tenant_admin' && !dto.tenantId && !dto.tenantName) {
      throw new BadRequestException('Yeni organizasyon icin organizasyon adi gerekli');
    }

    // If assigning to existing tenant, validate tenant exists
    if (dto.tenantId) {
      const tenant = await this.tenantsRepository.findById(dto.tenantId);
      if (!tenant) {
        throw new NotFoundException('Organizasyon bulunamadi');
      }
    }

    // Generate secure token
    const token = randomBytes(32).toString('hex');

    // Invitation expires in 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await this.invitationsRepository.create({
      email: dto.email,
      token,
      role: dto.role,
      tenant_id: dto.tenantId,
      tenant_name: dto.tenantName,
      invited_by: invitedBy,
      expires_at: expiresAt,
    });

    // TODO: Send invitation email
    // await this.emailService.sendInvitation(dto.email, token, dto.tenantName);

    return invitation;
  }

  async getInvitations(params: {
    page?: number;
    limit?: number;
    status?: 'pending' | 'accepted' | 'expired';
    tenantId?: string;
  }) {
    const result = await this.invitationsRepository.findAll(params);

    return {
      data: result.data,
      meta: {
        page: params.page || 1,
        limit: params.limit || 20,
        total: result.total,
        totalPages: Math.ceil(result.total / (params.limit || 20)),
      },
    };
  }

  async validateInvitation(token: string): Promise<Invitation> {
    const invitation = await this.invitationsRepository.findByToken(token);

    if (!invitation) {
      throw new NotFoundException('Davet bulunamadi');
    }

    if (invitation.accepted_at) {
      throw new BadRequestException('Bu davet zaten kullanilmis');
    }

    if (new Date(invitation.expires_at) < new Date()) {
      throw new BadRequestException('Bu davetin suresi dolmus');
    }

    return invitation;
  }

  async resendInvitation(id: string, invitedBy: string): Promise<Invitation> {
    const invitation = await this.invitationsRepository.findByToken(id);

    if (!invitation) {
      throw new NotFoundException('Davet bulunamadi');
    }

    if (invitation.accepted_at) {
      throw new BadRequestException('Bu davet zaten kullanilmis');
    }

    // Delete old invitation and create new one
    await this.invitationsRepository.delete(invitation.id);

    return this.createInvitation({
      email: invitation.email,
      role: invitation.role,
      tenantId: invitation.tenant_id || undefined,
      tenantName: invitation.tenant_name || undefined,
    }, invitedBy);
  }

  async cancelInvitation(id: string): Promise<void> {
    await this.invitationsRepository.delete(id);
  }

  async markAsAccepted(id: string): Promise<void> {
    await this.invitationsRepository.markAsAccepted(id);
  }

  getInvitationLink(token: string): string {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return `${baseUrl}/register?token=${token}`;
  }
}
