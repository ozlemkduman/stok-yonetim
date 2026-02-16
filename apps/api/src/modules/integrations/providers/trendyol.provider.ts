import { BaseProvider, OrderData } from './base.provider';

export class TrendyolProvider extends BaseProvider {
  private readonly apiUrl = 'https://api.trendyol.com/sapigw';

  async testConnection(): Promise<boolean> {
    const apiKey = this.credentials['apiKey'] as string;
    const apiSecret = this.credentials['apiSecret'] as string;
    const supplierId = this.config['supplierId'] as string;

    if (!apiKey || !apiSecret || !supplierId) {
      return false;
    }

    await this.delay(800);
    return true;
  }

  async fetchOrders(startDate?: Date, endDate?: Date): Promise<OrderData[]> {
    await this.delay(1200);

    const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const customerNames = [
      'Ahmet Yilmaz', 'Mehmet Demir', 'Ayse Kaya', 'Fatma Celik', 'Ali Sahin',
      'Zeynep Ozturk', 'Hasan Arslan', 'Elif Dogan', 'Mustafa Kilic', 'Selin Acar',
    ];
    const productNames = [
      'Kablosuz Bluetooth Kulaklik', 'USB-C Hub Adaptoru', 'Mekanik Klavye RGB',
      'Ergonomik Mouse Pad', 'Laptop Stand Aluminyum', 'Webcam 1080p HD',
      'Tasinabilir SSD 1TB', 'Akilli Saat Kordon', 'Telefon Kilifi Silikon',
      'HDMI Kablo 2m', 'Sarj Kablosu 3\'lu Set', 'Ekran Koruyucu Cam',
    ];
    const districts = [
      'Kadikoy', 'Besiktas', 'Sisli', 'Uskudar', 'Bakirkoy',
      'Atasehir', 'Maltepe', 'Kartal', 'Pendik', 'Beylikduzu',
    ];

    const orders: OrderData[] = [];
    const orderCount = Math.floor(Math.random() * 5) + 2;

    for (let i = 0; i < orderCount; i++) {
      const orderDate = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
      const itemCount = Math.floor(Math.random() * 3) + 1;
      const items = [];
      let subtotal = 0;
      const customer = customerNames[Math.floor(Math.random() * customerNames.length)];
      const district = districts[Math.floor(Math.random() * districts.length)];

      for (let j = 0; j < itemCount; j++) {
        const quantity = Math.floor(Math.random() * 3) + 1;
        const unitPrice = Math.floor(Math.random() * 500) + 50;
        const total = quantity * unitPrice;
        subtotal += total;
        const productName = productNames[Math.floor(Math.random() * productNames.length)];

        items.push({
          sku: `SKU-${(1000 + Math.floor(Math.random() * 9000))}`,
          name: productName,
          quantity,
          unitPrice,
          total,
        });
      }

      const shippingCost = [0, 14.99, 24.99, 34.99][Math.floor(Math.random() * 4)];
      const commissionRate = 0.12 + Math.random() * 0.08;
      const commission = Math.round(subtotal * commissionRate * 100) / 100;
      const total = subtotal + shippingCost;

      const nameParts = customer.toLowerCase().split(' ');
      orders.push({
        externalOrderId: `TY${orderDate.getFullYear()}${String(orderDate.getMonth() + 1).padStart(2, '0')}${String(Math.floor(Math.random() * 900000) + 100000)}`,
        externalOrderNumber: `${Math.floor(Math.random() * 900000000) + 100000000}`,
        status: ['pending', 'processing', 'shipped'][Math.floor(Math.random() * 3)],
        customerName: customer,
        customerEmail: `${nameParts[0]}.${nameParts[1]}@gmail.com`,
        customerPhone: `05${3 + Math.floor(Math.random() * 5)}${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
        shippingAddress: `${district} Mah. ${Math.floor(Math.random() * 50) + 1}. Sok. No:${Math.floor(Math.random() * 100) + 1}, ${district}/Istanbul`,
        subtotal,
        shippingCost,
        commission,
        total,
        currency: 'TRY',
        items,
        orderDate,
        rawData: {
          platform: 'trendyol',
          supplierId: this.config['supplierId'],
        },
      });
    }

    return orders;
  }

  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    await this.delay(600);
    return true;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
