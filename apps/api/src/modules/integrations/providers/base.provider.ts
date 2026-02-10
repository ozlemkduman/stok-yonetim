export interface SyncResult {
  success: boolean;
  message: string;
  syncedCount: number;
  errorCount: number;
  errors?: string[];
}

export interface OrderData {
  externalOrderId: string;
  externalOrderNumber?: string;
  status: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  shippingAddress?: string;
  subtotal: number;
  shippingCost: number;
  commission: number;
  total: number;
  currency: string;
  items: Array<{
    productId?: string;
    sku?: string;
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  orderDate: Date;
  rawData: Record<string, unknown>;
}

export abstract class BaseProvider {
  protected config: Record<string, unknown>;
  protected credentials: Record<string, unknown>;

  constructor(config: Record<string, unknown>, credentials: Record<string, unknown>) {
    this.config = config;
    this.credentials = credentials;
  }

  abstract testConnection(): Promise<boolean>;
  abstract fetchOrders(startDate?: Date, endDate?: Date): Promise<OrderData[]>;
  abstract updateOrderStatus?(orderId: string, status: string): Promise<boolean>;
}
