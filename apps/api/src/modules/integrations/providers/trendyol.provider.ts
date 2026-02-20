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

  private isDemo(): boolean {
    const apiKey = this.credentials['apiKey'] as string;
    return !apiKey || apiKey === 'demo' || apiKey === 'test';
  }

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

    // Demo mode - always succeed
    if (this.isDemo()) {
      await this.delay(500);
      return true;
    }

    // Real API test
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

    // Demo mode - return realistic mock data
    if (this.isDemo()) {
      return this.generateDemoOrders(startDate, endDate);
    }

    // Real API call
    return this.fetchRealOrders(startDate, endDate);
  }

  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    if (this.isDemo()) {
      await this.delay(300);
      return true;
    }
    return false;
  }

  // ─── Real Trendyol API ───

  private async fetchRealOrders(startDate?: Date, endDate?: Date): Promise<OrderData[]> {
    const supplierId = this.getSupplierId();
    const allOrders: OrderData[] = [];
    let currentPage = 0;
    let totalPages = 1;
    const pageSize = 200;

    const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

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
      shippingCost: 0,
      commission: Math.round(totalCommission * 100) / 100,
      total: pkg.packageTotalPrice || pkg.totalPrice || subtotal,
      currency: pkg.currencyCode || 'TRY',
      items,
      orderDate: new Date(pkg.orderDate),
      rawData: pkg as unknown as Record<string, unknown>,
    };
  }

  // ─── Demo Mode ───

  private async generateDemoOrders(startDate?: Date, endDate?: Date): Promise<OrderData[]> {
    await this.delay(800);

    const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const customers = [
      { name: 'Ahmet Yilmaz', email: 'ahmet.yilmaz@gmail.com', phone: '05321234567', district: 'Kadikoy' },
      { name: 'Mehmet Demir', email: 'mehmet.demir@gmail.com', phone: '05359876543', district: 'Besiktas' },
      { name: 'Ayse Kaya', email: 'ayse.kaya@hotmail.com', phone: '05441112233', district: 'Sisli' },
      { name: 'Fatma Celik', email: 'fatma.celik@gmail.com', phone: '05523334455', district: 'Uskudar' },
      { name: 'Ali Sahin', email: 'ali.sahin@outlook.com', phone: '05065556677', district: 'Atasehir' },
      { name: 'Zeynep Ozturk', email: 'zeynep.ozturk@gmail.com', phone: '05377788990', district: 'Bakirkoy' },
      { name: 'Hasan Arslan', email: 'hasan.arslan@gmail.com', phone: '05429990011', district: 'Maltepe' },
      { name: 'Elif Dogan', email: 'elif.dogan@yahoo.com', phone: '05562223344', district: 'Kartal' },
    ];

    const products = [
      { name: 'Kablosuz Bluetooth Kulaklik', sku: 'SKU-1001', price: 349.90 },
      { name: 'USB-C Hub 7in1 Adaptoru', sku: 'SKU-1002', price: 459.90 },
      { name: 'Mekanik Klavye RGB Aydinlatmali', sku: 'SKU-1003', price: 899.90 },
      { name: 'Ergonomik Mouse Pad XL', sku: 'SKU-1004', price: 129.90 },
      { name: 'Aluminyum Laptop Standı', sku: 'SKU-1005', price: 549.90 },
      { name: 'Full HD 1080p Webcam', sku: 'SKU-1006', price: 699.90 },
      { name: 'Tasinabilir SSD 1TB USB-C', sku: 'SKU-1007', price: 1299.90 },
      { name: 'Akilli Saat Silikon Kordon', sku: 'SKU-1008', price: 89.90 },
      { name: 'Telefon Kilifi Seffaf Silikon', sku: 'SKU-1009', price: 49.90 },
      { name: 'HDMI 2.1 Kablo 2 Metre', sku: 'SKU-1010', price: 119.90 },
      { name: '3lu Hizli Sarj Kablo Seti', sku: 'SKU-1011', price: 159.90 },
      { name: 'Temperli Cam Ekran Koruyucu', sku: 'SKU-1012', price: 39.90 },
    ];

    const statuses = ['pending', 'processing', 'shipped', 'delivered', 'processing'];
    const orders: OrderData[] = [];
    const orderCount = 3 + Math.floor(Math.random() * 5); // 3-7 orders

    for (let i = 0; i < orderCount; i++) {
      const orderDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const itemCount = 1 + Math.floor(Math.random() * 3);
      const items: OrderData['items'] = [];
      let subtotal = 0;

      const usedProducts = new Set<number>();
      for (let j = 0; j < itemCount; j++) {
        let productIndex: number;
        do {
          productIndex = Math.floor(Math.random() * products.length);
        } while (usedProducts.has(productIndex) && usedProducts.size < products.length);
        usedProducts.add(productIndex);

        const product = products[productIndex];
        const quantity = 1 + Math.floor(Math.random() * 2);
        const total = product.price * quantity;
        subtotal += total;

        items.push({
          sku: product.sku,
          name: product.name,
          quantity,
          unitPrice: product.price,
          total,
        });
      }

      const commissionRate = 0.12 + Math.random() * 0.08; // 12-20%
      const commission = Math.round(subtotal * commissionRate * 100) / 100;
      const shippingCost = [0, 14.99, 29.99][Math.floor(Math.random() * 3)];

      const orderNum = `${200000000 + Math.floor(Math.random() * 800000000)}`;
      const packageId = `TY${orderDate.getFullYear()}${String(orderDate.getMonth() + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 900000) + 100000)}`;

      orders.push({
        externalOrderId: packageId,
        externalOrderNumber: orderNum,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        shippingAddress: `Ornek Mah. ${1 + Math.floor(Math.random() * 50)}. Sok. No:${1 + Math.floor(Math.random() * 100)}, ${customer.district}/Istanbul`,
        subtotal,
        shippingCost,
        commission,
        total: subtotal + shippingCost,
        currency: 'TRY',
        items,
        orderDate,
        rawData: {
          platform: 'trendyol',
          supplierId: this.getSupplierId(),
          demo: true,
        },
      });
    }

    return orders.sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
