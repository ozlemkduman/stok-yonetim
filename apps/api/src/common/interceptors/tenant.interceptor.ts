import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tenantContextStorage, TenantContext } from '../context/tenant.context';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return next.handle();
    }

    let tenantId = user.tenantId;

    // Allow super_admin to impersonate a tenant
    const impersonateTenantId = request.headers['x-impersonate-tenant'] as string;
    if (impersonateTenantId && user.role === 'super_admin') {
      tenantId = impersonateTenantId;
    }

    const tenantContext: TenantContext = {
      tenantId,
      userId: user.sub,
      role: user.role,
      permissions: user.permissions || [],
    };

    // Store context on request object as fallback
    request.tenantContext = tenantContext;

    // Set global context for current async chain
    return new Observable((subscriber) => {
      tenantContextStorage.run(tenantContext, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
