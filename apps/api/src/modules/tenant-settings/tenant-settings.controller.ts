import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { TenantSettingsService, UpdateTenantSettingsDto } from './tenant-settings.service';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermissions, PERMISSIONS } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

@Controller('settings')
@UseGuards(RolesGuard, PermissionsGuard)
export class TenantSettingsController {
  constructor(private readonly settingsService: TenantSettingsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.SETTINGS_VIEW)
  async getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  @Roles(UserRole.TENANT_ADMIN, UserRole.SUPER_ADMIN)
  @RequirePermissions(PERMISSIONS.SETTINGS_MANAGE)
  async updateSettings(@Body() dto: UpdateTenantSettingsDto) {
    return this.settingsService.updateSettings(dto);
  }

  @Get('usage')
  @RequirePermissions(PERMISSIONS.SETTINGS_VIEW)
  async getUsage() {
    return this.settingsService.getUsage();
  }

  @Get('check-feature')
  async checkFeature(@Query('feature') feature: string) {
    const allowed = await this.settingsService.checkFeature(feature);
    return { feature, allowed };
  }

  @Get('check-limit')
  async checkLimit(@Query('resource') resource: string) {
    return this.settingsService.checkLimit(resource);
  }
}
