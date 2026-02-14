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
import { UsersService, CreateUserDto, UpdateUserDto } from './users.service';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermissions, PERMISSIONS } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PaginationParams } from '../../common/dto/pagination.dto';
import { CurrentUser, CurrentUserData } from '../../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(RolesGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.USERS_VIEW)
  async findAll(
    @Query() params: PaginationParams & { role?: string; status?: string; search?: string },
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
  @RequirePermissions(PERMISSIONS.USERS_VIEW)
  async countByRole() {
    const data = await this.usersService.countByRole();
    return { success: true, data };
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.USERS_VIEW)
  async findById(@Param('id') id: string) {
    const data = await this.usersService.findById(id);
    return { success: true, data };
  }

  @Post()
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(PERMISSIONS.USERS_MANAGE)
  async create(@Body() dto: CreateUserDto) {
    const data = await this.usersService.create(dto);
    return { success: true, data };
  }

  @Patch(':id')
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(PERMISSIONS.USERS_MANAGE)
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const data = await this.usersService.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(PERMISSIONS.USERS_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.usersService.delete(id);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: CurrentUserData,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    await this.usersService.changePassword(user.sub, body.currentPassword, body.newPassword);
    return { success: true, message: 'Şifre başarıyla değiştirildi' };
  }
}
