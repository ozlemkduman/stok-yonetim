import { Injectable, NotFoundException } from '@nestjs/common';
import { SuppliersRepository, Supplier } from './suppliers.repository';
import { CreateSupplierDto, UpdateSupplierDto } from './dto';
import { createPaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class SuppliersService {
  constructor(private readonly suppliersRepository: SuppliersRepository) {}

  async findAll(params: any) {
    const { items, total } = await this.suppliersRepository.findAll(params);
    return createPaginatedResult(items, total, params.page, params.limit);
  }

  async findById(id: string): Promise<Supplier> {
    const supplier = await this.suppliersRepository.findSupplierById(id);
    if (!supplier) throw new NotFoundException(`Tedarikçi bulunamadı: ${id}`);
    return supplier;
  }

  async create(dto: CreateSupplierDto, userId?: string): Promise<Supplier> {
    return this.suppliersRepository.createSupplier(dto, userId);
  }

  async update(id: string, dto: UpdateSupplierDto): Promise<Supplier> {
    await this.findById(id);
    const updated = await this.suppliersRepository.updateSupplier(id, dto);
    if (!updated) throw new NotFoundException(`Tedarikçi bulunamadı: ${id}`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.suppliersRepository.deleteSupplier(id);
  }
}
