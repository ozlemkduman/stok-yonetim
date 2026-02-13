import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { tenantContextStorage, TenantContext } from '../context/tenant.context';

export interface RequestWithUser extends Request {
  user?: {
    sub: string;
    email: string;
    tenantId: string | null;
    role: string;
    permissions: string[];
  };
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: RequestWithUser, res: Response, next: NextFunction) {
    if (req.user) {
      const context: TenantContext = {
        tenantId: req.user.tenantId,
        userId: req.user.sub,
        role: req.user.role,
        permissions: req.user.permissions || [],
      };

      tenantContextStorage.run(context, () => {
        next();
      });
    } else {
      next();
    }
  }
}
