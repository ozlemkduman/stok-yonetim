import { BaseProvider, OrderData } from './base.provider';

export class TrendyolProvider extends BaseProvider {
  private readonly apiUrl = 'https://api.trendyol.com/sapigw';

  async testConnection(): Promise<boolean> {
    // Mock implementation - in real scenario would test API connection
    const apiKey = this.credentials['apiKey'] as string;
    const apiSecret = this.credentials['apiSecret'] as string;
    const supplierId = this.config['supplierId'] as string;

    if (!apiKey || !apiSecret || !supplierId) {
      return false;
    }

    // Simulate API test
    await this.delay(500);
    return true;
  }

  async fetchOrders(startDate?: Date, endDate?: Date): Promise<OrderData[]> {
    // Mock implementation - returns sample orders
    await this.delay(1000);

    const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    // Generate mock orders
    const orders: OrderData[] = [];
    const orderCount = Math.floor(Math.random() * 5) + 1;

    for (let i = 0; i < orderCount; i++) {
      const orderDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
      const itemCount = Math.floor(Math.random() * 3) + 1;
      const items = [];
      let subtotal = 0;

      for (let j = 0; j < itemCount; j++) {
        const quantity = Math.floor(Math.random() * 3) + 1;
        const unitPrice = Math.floor(Math.random() * 500) + 50;
        const total = quantity * unitPrice;
        subtotal += total;

        items.push({
          sku: `TRN-${Math.random().toString(36).substring(7).toUpperCase()}`,
          name: `Urun ${j + 1}`,
          quantity,
          unitPrice,
          total,
        });
      }

      const shippingCost = 29.99;
      const commission = subtotal * 0.15;
      const total = subtotal + shippingCost;

      orders.push({
        externalOrderId: `TY${Date.now()}${i}`,
        externalOrderNumber: `${Math.floor(Math.random() * 900000000) + 100000000}`,
        status: ['pending', 'processing', 'shipped'][Math.floor(Math.random() * 3)],
        customerName: `Musteri ${i + 1}`,
        customerEmail: `musteri${i + 1}@example.com`,
        customerPhone: `053${Math.floor(Math.random() * 100000000) + 10000000}`,
        shippingAddress: `Adres ${i + 1}, Istanbul, Turkey`,
        subtotal,
        shippingCost,
        commission,
        total,
        currency: 'TRY',
        items,
        orderDate,
        rawData: {
          platform: 'trendyol',
          source: 'mock',
        },
      });
    }

    return orders;
  }

  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    // Mock implementation
    await this.delay(500);
    console.log(`Trendyol order ${orderId} status updated to ${status}`);
    return true;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
