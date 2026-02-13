import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AdminUsersRepository, UserWithTenant } from '../repositories/admin-users.repository';
import { PaginationParams } from '../../../common/dto/pagination.dto';

@Injectable()
export class AdminUsersService {
  constructor(private readonly usersRepository: AdminUsersRepository) {}

  async findAll(params: PaginationParams & { role?: string; status?: string; tenantId?: string; search?: string }) {
    return this.usersRepository.findAll(params);
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
