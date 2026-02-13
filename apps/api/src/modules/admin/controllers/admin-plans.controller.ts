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
    return this.plansService.findAll(includeInactive);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.plansService.findById(id);
  }

  @Post()
  async create(@Body() dto: CreatePlanDto) {
    return this.plansService.create(dto);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.plansService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.plansService.delete(id);
  }
}
