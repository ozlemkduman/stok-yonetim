import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository, User } from './users.repository';
import { PaginationParams } from '../../common/dto/pagination.dto';
import { getCurrentTenantId, getCurrentUserRole } from '../../common/context/tenant.context';

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: string;
  permissions?: string[];
}

export interface UpdateUserDto {
  email?: string;
  name?: string;
  phone?: string;
  role?: string;
  permissions?: string[];
  status?: string;
}

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async findAll(params: PaginationParams & { role?: string; status?: string; search?: string }) {
    return this.usersRepository.findAll(params);
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }
    return user;
  }

  async create(dto: CreateUserDto): Promise<User> {
    const tenantId = getCurrentTenantId();
    if (!tenantId) {
      throw new BadRequestException('Tenant bilgisi bulunamadı');
    }

    // Check if email exists
    const existingUser = await this.usersRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Bu e-posta adresi zaten kullanımda');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Validate role
    const currentRole = getCurrentUserRole();
    if (dto.role === 'super_admin' && currentRole !== 'super_admin') {
      throw new BadRequestException('Super admin rolü atanamaz');
    }

    const user = await this.usersRepository.create({
      email: dto.email,
      password_hash: passwordHash,
      name: dto.name,
      phone: dto.phone || null,
      role: dto.role || 'user',
      permissions: dto.permissions || ['*'],
      status: 'active',
    });

    return user;
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // Check if email is being changed and already exists
    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.usersRepository.findByEmail(dto.email);
      if (existingUser) {
        throw new ConflictException('Bu e-posta adresi zaten kullanımda');
      }
    }

    // Validate role change
    const currentRole = getCurrentUserRole();
    if (dto.role === 'super_admin' && currentRole !== 'super_admin') {
      throw new BadRequestException('Super admin rolü atanamaz');
    }

    const updated = await this.usersRepository.update(id, {
      email: dto.email,
      name: dto.name,
      phone: dto.phone,
      role: dto.role,
      permissions: dto.permissions,
      status: dto.status,
    } as any);

    return updated as User;
  }

  async delete(id: string): Promise<void> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    if (user.role === 'tenant_admin') {
      throw new BadRequestException('Tenant admin kullanıcılar silinemez');
    }

    const deleted = await this.usersRepository.delete(id);
    if (!deleted) {
      throw new BadRequestException('Kullanıcı silinemedi');
    }
  }

  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    // Verify current password (need to get full user with password_hash)
    const fullUser = await this.usersRepository.findById(id);
    if (!fullUser) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    const isValid = await bcrypt.compare(currentPassword, fullUser.password_hash);
    if (!isValid) {
      throw new BadRequestException('Mevcut şifre hatalı');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    await this.usersRepository.update(id, { password_hash: newPasswordHash } as any);
  }

  async countByRole(): Promise<{ role: string; count: number }[]> {
    return this.usersRepository.countByRole();
  }
}
