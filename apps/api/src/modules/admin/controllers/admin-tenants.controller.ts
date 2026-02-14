import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminTenantsService, CreateTenantDto, UpdateTenantDto } from '../services/admin-tenants.service';
import { Roles, UserRole } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { PaginationParams } from '../../../common/dto/pagination.dto';

@Controller('admin/tenants')
@UseGuards(RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AdminTenantsController {
  constructor(private readonly tenantsService: AdminTenantsService) {}

  @Get()
  async findAll(
    @Query() params: PaginationParams & { status?: string; search?: string },
  ) {
    const result = await this.tenantsService.findAll(params);
    return {
      success: true,
      data: result.items,
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const tenant = await this.tenantsService.findById(id);
    return {
      success: true,
      data: tenant,
    };
  }

  @Get(':id/stats')
  async getStats(@Param('id') id: string) {
    const stats = await this.tenantsService.getStats(id);
    return {
      success: true,
      data: stats,
    };
  }

  @Post()
  async create(@Body() dto: CreateTenantDto) {
    const tenant = await this.tenantsService.create(dto);
    return {
      success: true,
      data: tenant,
    };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    const tenant = await this.tenantsService.update(id, dto);
    return {
      success: true,
      data: tenant,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.tenantsService.delete(id);
  }

  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  async suspend(@Param('id') id: string) {
    const tenant = await this.tenantsService.suspend(id);
    return {
      success: true,
      data: tenant,
    };
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  async activate(@Param('id') id: string) {
    const tenant = await this.tenantsService.activate(id);
    return {
      success: true,
      data: tenant,
    };
  }
}
