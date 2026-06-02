import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_FEATURE_KEY } from '../decorators/require-feature.decorator';
import { TenantSettingsService } from '../../modules/tenant-settings/tenant-settings.service';

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantSettings: TenantSettingsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string>(REQUIRE_FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    // Super admin tüm özelliklere erişebilir
    const request = context.switchToHttp().getRequest();
    if (request.user?.role === 'super_admin') return true;

    const allowed = await this.tenantSettings.checkFeature(required);
    if (!allowed) {
      throw new ForbiddenException(
        'Bu özellik mevcut planınızda bulunmuyor. Planınızı yükseltin.',
      );
    }
    return true;
  }
}
