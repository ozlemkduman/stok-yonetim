import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data already has success property, return as is
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // If data has pagination info (check for page/total to distinguish from regular objects with items)
        if (data && typeof data === 'object' && 'items' in data && 'total' in data && 'page' in data) {
          return {
            success: true,
            data: data.items,
            meta: {
              page: data.page,
              limit: data.limit,
              total: data.total,
              totalPages: data.totalPages,
            },
          };
        }

        return {
          success: true,
          data,
        };
      }),
    );
  }
}
