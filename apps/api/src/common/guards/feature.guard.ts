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

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Super admin tüm özelliklere erişebilir
    if (user?.role === 'super_admin') return true;

    // NestJS pipeline'ında Guard'lar Interceptor'lardan önce çalışır,
    // bu yüzden TenantInterceptor henüz AsyncLocalStorage'a tenant_id koymamış olur.
    // tenant_id'yi doğrudan request.user'dan (+impersonate header) okuyoruz.
    let tenantId = user?.tenantId;
    const impersonateTenantId = request.headers['x-impersonate-tenant'] as string;
    if (impersonateTenantId && user?.role === 'super_admin') {
      tenantId = impersonateTenantId;
    }

    if (!tenantId) {
      throw new ForbiddenException('Tenant bilgisi bulunamadı.');
    }

    const allowed = await this.tenantSettings.checkFeature(required, tenantId);
    if (!allowed) {
      throw new ForbiddenException(
        'Bu özellik mevcut planınızda bulunmuyor. Planınızı yükseltin.',
      );
    }
    return true;
  }
}
