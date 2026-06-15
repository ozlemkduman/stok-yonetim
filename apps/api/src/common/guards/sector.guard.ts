import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_SECTOR_KEY } from '../decorators/require-sector.decorator';
import { TenantSettingsService } from '../../modules/tenant-settings/tenant-settings.service';

/**
 * Sektöre özel endpoint'leri korur. @RequireSector('auto_service') ile işaretlenen
 * route'lara yalnızca business_type'ı eşleşen tenant'lar (ve super admin) erişebilir.
 * FeatureGuard ile aynı deseni izler.
 */
@Injectable()
export class SectorGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantSettings: TenantSettingsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<string>(REQUIRE_SECTOR_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Super admin tüm sektörlere erişebilir
    if (user?.role === 'super_admin') return true;

    // Guard'lar TenantInterceptor'dan önce çalıştığı için tenant_id'yi
    // doğrudan request.user'dan (+impersonate header) okuyoruz.
    let tenantId = user?.tenantId;
    const impersonateTenantId = request.headers['x-impersonate-tenant'] as string;
    if (impersonateTenantId && user?.role === 'super_admin') {
      tenantId = impersonateTenantId;
    }

    if (!tenantId) {
      throw new ForbiddenException('Tenant bilgisi bulunamadı.');
    }

    const allowed = await this.tenantSettings.checkSector(required, tenantId);
    if (!allowed) {
      throw new ForbiddenException('Bu modüle erişim yetkiniz yok.');
    }
    return true;
  }
}
