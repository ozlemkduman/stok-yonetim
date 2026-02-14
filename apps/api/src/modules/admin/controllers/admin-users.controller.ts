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
import { AdminUsersService, CreateUserDto, UpdateUserDto } from '../services/admin-users.service';
import { Roles, UserRole } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { PaginationParams } from '../../../common/dto/pagination.dto';

@Controller('admin/users')
@UseGuards(RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AdminUsersController {
  constructor(private readonly usersService: AdminUsersService) {}

  @Get()
  async findAll(
    @Query() params: PaginationParams & { role?: string; status?: string; tenantId?: string; search?: string },
  ) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const result = await this.usersService.findAll(params);
    return {
      success: true,
      data: result.items,
      meta: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  @Get('stats/by-role')
  async countByRole() {
    const data = await this.usersService.countByRole();
    return { success: true, data };
  }

  @Post()
  async create(@Body() dto: CreateUserDto) {
    const data = await this.usersService.create(dto);
    return { success: true, data };
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const data = await this.usersService.findById(id);
    return { success: true, data };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const data = await this.usersService.update(id, dto);
    return { success: true, data };
  }

  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  async suspend(@Param('id') id: string) {
    const data = await this.usersService.suspend(id);
    return { success: true, data };
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  async activate(@Param('id') id: string) {
    const data = await this.usersService.activate(id);
    return { success: true, data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.usersService.delete(id);
  }
}
