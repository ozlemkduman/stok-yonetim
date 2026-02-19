import { BaseProvider, OrderData } from './base.provider';

interface TrendyolShipmentPackage {
  id: number;
  shipmentPackageId: number;
  orderNumber: string;
  orderDate: number;
  status: string;
  shipmentPackageStatus: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerId: number;
  grossAmount: number;
  packageGrossAmount: number;
  totalDiscount: number;
  packageTotalDiscount: number;
  totalPrice: number;
  packageTotalPrice: number;
  currencyCode: string;
  cargoTrackingNumber: number;
  cargoProviderName: string;
  cargoTrackingLink: string;
  shipmentAddress: {
    firstName: string;
    lastName: string;
    fullName: string;
    fullAddress: string;
    city: string;
    district: string;
    phone: string;
  };
  invoiceAddress: {
    fullName: string;
    fullAddress: string;
    city: string;
    district: string;
    phone: string;
  };
  lines: Array<{
    id: number;
    lineId: number;
    quantity: number;
    merchantSku: string;
    sku: string;
    productName: string;
    productCode: number;
    barcode: string;
    amount: number;
    lineGrossAmount: number;
    discount: number;
    lineTotalDiscount: number;
    price: number;
    lineUnitPrice: number;
    vatBaseAmount: number;
    vatRate: number;
    currencyCode: string;
    commission: number;
    orderLineItemStatusName: string;
  }>;
  lastModifiedDate: number;
}

interface TrendyolOrdersResponse {
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  content: TrendyolShipmentPackage[];
}

const STATUS_MAP: Record<string, string> = {
  Created: 'pending',
  Picking: 'processing',
  Invoiced: 'processing',
  Shipped: 'shipped',
  Delivered: 'delivered',
  Cancelled: 'cancelled',
  UnDelivered: 'shipped',
  Returned: 'returned',
  UnSupplied: 'cancelled',
};

export class TrendyolProvider extends BaseProvider {
  private readonly baseUrl = 'https://apigw.trendyol.com/integration';

  private getAuthHeader(): string {
    const apiKey = this.credentials['apiKey'] as string;
    const apiSecret = this.credentials['apiSecret'] as string;
    return 'Basic ' + Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
  }

  private getSupplierId(): string {
    return (this.config['supplierId'] as string) || '';
  }

  async testConnection(): Promise<boolean> {
    const apiKey = this.credentials['apiKey'] as string;
    const apiSecret = this.credentials['apiSecret'] as string;
    const supplierId = this.getSupplierId();

    if (!apiKey || !apiSecret || !supplierId) {
      return false;
    }

    // Test with a small request to verify credentials
    const url = `${this.baseUrl}/order/sellers/${supplierId}/orders?size=1`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  }

  async fetchOrders(startDate?: Date, endDate?: Date): Promise<OrderData[]> {
    const supplierId = this.getSupplierId();
    if (!supplierId) {
      throw new Error('Supplier ID eksik');
    }

    const allOrders: OrderData[] = [];
    let currentPage = 0;
    let totalPages = 1;
    const pageSize = 200; // maximum allowed

    // Default: last 7 days
    const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    // Trendyol expects timestamps in milliseconds
    const startTs = start.getTime();
    const endTs = end.getTime();

    // Trendyol allows max 14-day windows
    const maxWindow = 14 * 24 * 60 * 60 * 1000;
    let windowStart = startTs;

    while (windowStart < endTs) {
      const windowEnd = Math.min(windowStart + maxWindow, endTs);
      currentPage = 0;
      totalPages = 1;

      while (currentPage < totalPages) {
        const params = new URLSearchParams({
          startDate: String(windowStart),
          endDate: String(windowEnd),
          page: String(currentPage),
          size: String(pageSize),
          orderByField: 'PackageLastModifiedDate',
          orderByDirection: 'DESC',
        });

        const url = `${this.baseUrl}/order/sellers/${supplierId}/orders?${params}`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': this.getAuthHeader(),
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          throw new Error(`Trendyol API hatasi: ${response.status} ${response.statusText} - ${errorText}`);
        }

        const data = await response.json() as TrendyolOrdersResponse;
        totalPages = data.totalPages;

        for (const pkg of data.content) {
          allOrders.push(this.mapToOrderData(pkg));
        }

        currentPage++;
      }

      windowStart = windowEnd;
    }

    return allOrders;
  }

  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    // Trendyol doesn't support generic status updates via API
    // Status changes happen through specific endpoints (pick, invoice, ship, etc.)
    return false;
  }

  private mapToOrderData(pkg: TrendyolShipmentPackage): OrderData {
    const items = pkg.lines.map((line) => ({
      productId: String(line.productCode),
      sku: line.merchantSku || line.sku || line.barcode,
      name: line.productName,
      quantity: line.quantity,
      unitPrice: line.price || line.lineUnitPrice || line.amount,
      total: line.lineGrossAmount || (line.price * line.quantity),
    }));

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const totalCommission = pkg.lines.reduce((sum, line) => {
      // commission is percentage in Trendyol API
      const lineTotal = line.lineGrossAmount || (line.price * line.quantity);
      return sum + (lineTotal * (line.commission || 0) / 100);
    }, 0);

    const customerName = pkg.shipmentAddress?.fullName
      || `${pkg.customerFirstName || ''} ${pkg.customerLastName || ''}`.trim();

    const address = pkg.shipmentAddress
      ? `${pkg.shipmentAddress.fullAddress}, ${pkg.shipmentAddress.district}/${pkg.shipmentAddress.city}`
      : '';

    const phone = pkg.shipmentAddress?.phone || pkg.invoiceAddress?.phone || '';

    return {
      externalOrderId: String(pkg.shipmentPackageId || pkg.id),
      externalOrderNumber: pkg.orderNumber,
      status: STATUS_MAP[pkg.status] || STATUS_MAP[pkg.shipmentPackageStatus] || 'pending',
      customerName,
      customerEmail: pkg.customerEmail || undefined,
      customerPhone: phone || undefined,
      shippingAddress: address || undefined,
      subtotal,
      shippingCost: 0, // Trendyol doesn't expose shipping cost to seller
      commission: Math.round(totalCommission * 100) / 100,
      total: pkg.packageTotalPrice || pkg.totalPrice || subtotal,
      currency: pkg.currencyCode || 'TRY',
      items,
      orderDate: new Date(pkg.orderDate),
      rawData: pkg as unknown as Record<string, unknown>,
    };
  }
}
