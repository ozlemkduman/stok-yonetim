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
    return this.usersService.findAll(params);
  }

  @Get('stats/by-role')
  @RequirePermissions(PERMISSIONS.USERS_VIEW)
  async countByRole() {
    return this.usersService.countByRole();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.USERS_VIEW)
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(PERMISSIONS.USERS_MANAGE)
  async create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(PERMISSIONS.USERS_MANAGE)
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
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
    return { message: 'Şifre başarıyla değiştirildi' };
  }
}
