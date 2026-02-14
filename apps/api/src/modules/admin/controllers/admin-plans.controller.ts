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
import { AdminPlansService, CreatePlanDto, UpdatePlanDto } from '../services/admin-plans.service';
import { Roles, UserRole } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';

@Controller('admin/plans')
@UseGuards(RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AdminPlansController {
  constructor(private readonly plansService: AdminPlansService) {}

  @Get()
  async findAll(@Query('includeInactive') includeInactive?: boolean) {
    const data = await this.plansService.findAll(includeInactive);
    return { success: true, data };
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const data = await this.plansService.findById(id);
    return { success: true, data };
  }

  @Post()
  async create(@Body() dto: CreatePlanDto) {
    const data = await this.plansService.create(dto);
    return { success: true, data };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    const data = await this.plansService.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.plansService.delete(id);
  }
}
