import { Injectable, NotFoundException } from '@nestjs/common';
import { EmployeesRepository, Employee } from './employees.repository';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto';
import { createPaginatedResult } from '../../common/dto/pagination.dto';
import { ActivityLogService } from '../../common/services/activity-log.service';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly repository: EmployeesRepository,
    private readonly activityLog: ActivityLogService,
  ) {}

  async findAll(params: any) {
    const { items, total } = await this.repository.findAll(params);
    return createPaginatedResult(items, total, params.page, params.limit);
  }

  async findById(id: string): Promise<Employee> {
    const employee = await this.repository.findById(id);
    if (!employee) throw new NotFoundException('Çalışan bulunamadı');
    return employee;
  }

  async create(dto: CreateEmployeeDto, userId?: string): Promise<Employee> {
    const employee = await this.repository.createEmployee({
      ...dto,
      hire_date: dto.hire_date ? (new Date(dto.hire_date) as any) : null,
      is_active: dto.is_active !== false,
      created_by: userId || null,
    });
    await this.activityLog.log({
      action: 'employee_created',
      entityType: 'employee',
      entityId: employee.id,
      newValues: { name: employee.name, position: employee.position },
    });
    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto): Promise<Employee> {
    await this.findById(id);
    const updateData: Partial<Employee> = { ...dto } as any;
    if (dto.hire_date) updateData.hire_date = new Date(dto.hire_date) as any;
    const updated = await this.repository.updateEmployee(id, updateData);
    if (!updated) throw new NotFoundException('Çalışan bulunamadı');
    await this.activityLog.log({
      action: 'employee_updated',
      entityType: 'employee',
      entityId: id,
      newValues: dto as any,
    });
    return updated;
  }

  async delete(id: string): Promise<void> {
    const employee = await this.findById(id);
    await this.repository.deleteEmployee(id);
    await this.activityLog.log({
      action: 'employee_deleted',
      entityType: 'employee',
      entityId: id,
      oldValues: { name: employee.name },
    });
  }
}
