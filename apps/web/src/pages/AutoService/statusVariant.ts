import type { BadgeProps } from '@stok/ui';
import type { ServiceOrderStatus } from '../../api/autoService.api';

type BadgeVariant = NonNullable<BadgeProps['variant']>;

/** İş emri durumunu Badge rengine eşler. */
export function orderStatusVariant(status: ServiceOrderStatus): BadgeVariant {
  switch (status) {
    case 'open': return 'info';
    case 'in_progress': return 'warning';
    case 'completed': return 'primary';
    case 'delivered': return 'success';
    case 'cancelled': return 'danger';
    default: return 'default';
  }
}
