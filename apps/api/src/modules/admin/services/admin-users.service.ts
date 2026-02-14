import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { AdminUsersRepository, UserWithTenant } from '../repositories/admin-users.repository';
import { PaginationParams } from '../../../common/dto/pagination.dto';
import * as bcrypt from 'bcrypt';

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: string;
  tenantId?: string;
  permissions?: string[];
}

export interface UpdateUserDto {
  name?: string;
  phone?: string;
  role?: string;
  tenantId?: string;
  permissions?: string[];
  status?: string;
}

@Injectable()
export class AdminUsersService {
  constructor(private readonly usersRepository: AdminUsersRepository) {}

  async findAll(params: PaginationParams & { role?: string; status?: string; tenantId?: string; search?: string }) {
    return this.usersRepository.findAll(params);
  }

  async create(dto: CreateUserDto): Promise<UserWithTenant> {
    // Check if email already exists
    const existing = await this.usersRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Bu e-posta adresi zaten kullaniliyor');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.usersRepository.create({
      email: dto.email,
      password_hash: passwordHash,
      name: dto.name,
      phone: dto.phone,
      role: dto.role,
      tenant_id: dto.tenantId,
      permissions: dto.permissions || ['*'],
      status: 'active',
      email_verified_at: new Date(),
    });

    return this.findById(user.id);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserWithTenant> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Kullanici bulunamadi');
    }

    // Prevent changing super_admin role
    if (user.role === 'super_admin' && dto.role && dto.role !== 'super_admin') {
      throw new BadRequestException('Super admin rolu degistirilemez');
    }

    await this.usersRepository.update(id, {
      name: dto.name,
      phone: dto.phone,
      role: dto.role,
      tenant_id: dto.tenantId,
      permissions: dto.permissions,
      status: dto.status,
    });

    return this.findById(id);
  }

  async findById(id: string): Promise<UserWithTenant> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }
    return user;
  }

  async suspend(id: string): Promise<UserWithTenant> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    if (user.role === 'super_admin') {
      throw new BadRequestException('Super admin kullanıcılar askıya alınamaz');
    }

    if (user.status === 'suspended') {
      throw new BadRequestException('Kullanıcı zaten askıya alınmış');
    }

    await this.usersRepository.updateStatus(id, 'suspended');
    return this.usersRepository.findById(id) as Promise<UserWithTenant>;
  }

  async activate(id: string): Promise<UserWithTenant> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    if (user.status === 'active') {
      throw new BadRequestException('Kullanıcı zaten aktif');
    }

    await this.usersRepository.updateStatus(id, 'active');
    return this.usersRepository.findById(id) as Promise<UserWithTenant>;
  }

  async delete(id: string): Promise<void> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    if (user.role === 'super_admin') {
      throw new BadRequestException('Super admin kullanıcılar silinemez');
    }

    const deleted = await this.usersRepository.delete(id);
    if (!deleted) {
      throw new BadRequestException('Kullanıcı silinemedi');
    }
  }

  async countByRole(): Promise<{ role: string; count: number }[]> {
    return this.usersRepository.countByRole();
  }
}
