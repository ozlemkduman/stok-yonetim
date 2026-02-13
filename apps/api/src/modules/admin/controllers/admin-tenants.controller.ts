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
    return this.tenantsService.findAll(params);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.tenantsService.findById(id);
  }

  @Get(':id/stats')
  async getStats(@Param('id') id: string) {
    return this.tenantsService.getStats(id);
  }

  @Post()
  async create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.tenantsService.delete(id);
  }

  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  async suspend(@Param('id') id: string) {
    return this.tenantsService.suspend(id);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  async activate(@Param('id') id: string) {
    return this.tenantsService.activate(id);
  }
}
