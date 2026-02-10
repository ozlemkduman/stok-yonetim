import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data (in reverse order of dependencies)
  await knex('account_transactions').del();
  await knex('payments').del();
  await knex('return_items').del();
  await knex('returns').del();
  await knex('sale_items').del();
  await knex('sales').del();
  await knex('expenses').del();
  await knex('products').del();
  await knex('customers').del();

  // Insert customers
  const customers = await knex('customers')
    .insert([
      {
        name: 'Ahmet Yilmaz',
        phone: '0532 111 2233',
        email: 'ahmet@email.com',
        address: 'Kadikoy, Istanbul',
        tax_number: '1234567890',
        tax_office: 'Kadikoy',
        balance: 0,
        notes: 'Duzeli musteri',
      },
      {
        name: 'Mehmet Demir',
        phone: '0533 222 3344',
        email: 'mehmet@email.com',
        address: 'Besiktas, Istanbul',
        balance: -1500.0,
        notes: 'Veresiye limiti 5000 TL',
      },
      {
        name: 'Ayse Kaya',
        phone: '0534 333 4455',
        email: 'ayse@email.com',
        address: 'Uskudar, Istanbul',
        tax_number: '9876543210',
        tax_office: 'Uskudar',
        balance: 250.0,
      },
      {
        name: 'Fatma Ozturk',
        phone: '0535 444 5566',
        address: 'Bakirkoy, Istanbul',
        balance: -3200.0,
      },
      {
        name: 'Ali Celik',
        phone: '0536 555 6677',
        email: 'ali@email.com',
        address: 'Sisli, Istanbul',
        balance: 0,
      },
    ])
    .returning('id');

  // Insert products
  const products = await knex('products')
    .insert([
      {
        name: 'Samsung Galaxy A54',
        barcode: '8806094959697',
        category: 'Telefon',
        unit: 'adet',
        purchase_price: 12000.0,
        sale_price: 15000.0,
        vat_rate: 20,
        stock_quantity: 25,
        min_stock_level: 5,
      },
      {
        name: 'iPhone 15 Pro',
        barcode: '194253401234',
        category: 'Telefon',
        unit: 'adet',
        purchase_price: 45000.0,
        sale_price: 55000.0,
        vat_rate: 20,
        stock_quantity: 10,
        min_stock_level: 3,
      },
      {
        name: 'Apple AirPods Pro 2',
        barcode: '194253299017',
        category: 'Aksesuar',
        unit: 'adet',
        purchase_price: 5000.0,
        sale_price: 6500.0,
        vat_rate: 20,
        stock_quantity: 50,
        min_stock_level: 10,
      },
      {
        name: 'Samsung 65" QLED TV',
        barcode: '8806092688001',
        category: 'Televizyon',
        unit: 'adet',
        purchase_price: 25000.0,
        sale_price: 32000.0,
        vat_rate: 20,
        stock_quantity: 8,
        min_stock_level: 2,
      },
      {
        name: 'Xiaomi Redmi Note 13',
        barcode: '6941812739471',
        category: 'Telefon',
        unit: 'adet',
        purchase_price: 8000.0,
        sale_price: 10500.0,
        vat_rate: 20,
        stock_quantity: 40,
        min_stock_level: 10,
      },
      {
        name: 'JBL Flip 6 Hoparlor',
        barcode: '6925281993459',
        category: 'Aksesuar',
        unit: 'adet',
        purchase_price: 2500.0,
        sale_price: 3200.0,
        vat_rate: 20,
        stock_quantity: 30,
        min_stock_level: 5,
      },
      {
        name: 'Anker PowerBank 20000mAh',
        barcode: '194644097301',
        category: 'Aksesuar',
        unit: 'adet',
        purchase_price: 800.0,
        sale_price: 1200.0,
        vat_rate: 20,
        stock_quantity: 100,
        min_stock_level: 20,
      },
      {
        name: 'USB-C Sarj Kablosu 1m',
        barcode: '8681234567890',
        category: 'Aksesuar',
        unit: 'adet',
        purchase_price: 50.0,
        sale_price: 100.0,
        vat_rate: 20,
        stock_quantity: 200,
        min_stock_level: 50,
      },
      {
        name: 'Telefon Kilifi Universal',
        barcode: '8681234567891',
        category: 'Aksesuar',
        unit: 'adet',
        purchase_price: 30.0,
        sale_price: 75.0,
        vat_rate: 20,
        stock_quantity: 150,
        min_stock_level: 30,
      },
      {
        name: 'Ekran Koruyucu Cam',
        barcode: '8681234567892',
        category: 'Aksesuar',
        unit: 'adet',
        purchase_price: 20.0,
        sale_price: 50.0,
        vat_rate: 20,
        stock_quantity: 3,
        min_stock_level: 50,
      },
    ])
    .returning('id');

  // Insert expenses
  await knex('expenses').insert([
    {
      category: 'kira',
      description: 'Dukkan kirasi - Ocak 2024',
      amount: 15000.0,
      expense_date: '2024-01-01',
      is_recurring: true,
      recurrence_period: 'aylik',
    },
    {
      category: 'fatura',
      description: 'Elektrik faturasi - Ocak 2024',
      amount: 2500.0,
      expense_date: '2024-01-15',
      is_recurring: false,
    },
    {
      category: 'maas',
      description: 'Calisan maasi - Ocak 2024',
      amount: 25000.0,
      expense_date: '2024-01-30',
      is_recurring: true,
      recurrence_period: 'aylik',
    },
    {
      category: 'vergi',
      description: 'KDV odemesi - 4. ceyrek 2023',
      amount: 8500.0,
      expense_date: '2024-01-25',
      is_recurring: false,
    },
    {
      category: 'diger',
      description: 'Ofis malzemeleri',
      amount: 750.0,
      expense_date: '2024-01-10',
      is_recurring: false,
    },
  ]);

  console.log('Seed data inserted successfully!');
  console.log(`- ${customers.length} customers`);
  console.log(`- ${products.length} products`);
  console.log('- 5 expenses');
}
