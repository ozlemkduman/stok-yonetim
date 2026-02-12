import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data (in reverse order of dependencies)
  await knex('field_team_visits').del().catch(() => {});
  await knex('field_team_routes').del().catch(() => {});
  await knex('crm_activities').del().catch(() => {});
  await knex('crm_contacts').del().catch(() => {});
  await knex('e_commerce_orders').del().catch(() => {});
  await knex('integration_logs').del().catch(() => {});
  await knex('integrations').del().catch(() => {});
  await knex('e_document_logs').del().catch(() => {});
  await knex('e_documents').del().catch(() => {});
  await knex('quote_items').del().catch(() => {});
  await knex('quotes').del().catch(() => {});
  await knex('stock_transfer_items').del().catch(() => {});
  await knex('stock_transfers').del().catch(() => {});
  await knex('stock_movements').del().catch(() => {});
  await knex('warehouse_stocks').del().catch(() => {});
  await knex('account_transfers').del().catch(() => {});
  await knex('account_movements').del().catch(() => {});
  await knex('accounts').del().catch(() => {});
  await knex('payments').del().catch(() => {});
  await knex('return_items').del().catch(() => {});
  await knex('returns').del().catch(() => {});
  await knex('sale_items').del().catch(() => {});
  await knex('sales').del().catch(() => {});
  await knex('expenses').del().catch(() => {});
  await knex('warehouses').del().catch(() => {});
  await knex('products').del().catch(() => {});
  await knex('customers').del().catch(() => {});

  // =====================
  // 1. CUSTOMERS
  // =====================
  const customers = await knex('customers')
    .insert([
      { name: 'Ahmet Yilmaz', phone: '0532 111 2233', email: 'ahmet@email.com', address: 'Kadikoy, Istanbul', tax_number: '1234567890', tax_office: 'Kadikoy', balance: 0, notes: 'Duzenli musteri' },
      { name: 'Mehmet Demir', phone: '0533 222 3344', email: 'mehmet@email.com', address: 'Besiktas, Istanbul', balance: -1500.0, notes: 'Veresiye limiti 5000 TL' },
      { name: 'Ayse Kaya', phone: '0534 333 4455', email: 'ayse@email.com', address: 'Uskudar, Istanbul', tax_number: '9876543210', tax_office: 'Uskudar', balance: 250.0 },
      { name: 'Fatma Ozturk', phone: '0535 444 5566', address: 'Bakirkoy, Istanbul', balance: -3200.0 },
      { name: 'Ali Celik', phone: '0536 555 6677', email: 'ali@email.com', address: 'Sisli, Istanbul', balance: 0 },
    ])
    .returning('*');

  // =====================
  // 2. PRODUCTS
  // =====================
  const products = await knex('products')
    .insert([
      { name: 'Samsung Galaxy A54', barcode: '8806094959697', category: 'Telefon', unit: 'adet', purchase_price: 12000.0, sale_price: 15000.0, vat_rate: 20, stock_quantity: 25, min_stock_level: 5 },
      { name: 'iPhone 15 Pro', barcode: '194253401234', category: 'Telefon', unit: 'adet', purchase_price: 45000.0, sale_price: 55000.0, vat_rate: 20, stock_quantity: 10, min_stock_level: 3 },
      { name: 'Apple AirPods Pro 2', barcode: '194253299017', category: 'Aksesuar', unit: 'adet', purchase_price: 5000.0, sale_price: 6500.0, vat_rate: 20, stock_quantity: 50, min_stock_level: 10 },
      { name: 'Samsung 65" QLED TV', barcode: '8806092688001', category: 'Televizyon', unit: 'adet', purchase_price: 25000.0, sale_price: 32000.0, vat_rate: 20, stock_quantity: 8, min_stock_level: 2 },
      { name: 'Xiaomi Redmi Note 13', barcode: '6941812739471', category: 'Telefon', unit: 'adet', purchase_price: 8000.0, sale_price: 10500.0, vat_rate: 20, stock_quantity: 40, min_stock_level: 10 },
      { name: 'JBL Flip 6 Hoparlor', barcode: '6925281993459', category: 'Aksesuar', unit: 'adet', purchase_price: 2500.0, sale_price: 3200.0, vat_rate: 20, stock_quantity: 30, min_stock_level: 5 },
      { name: 'Anker PowerBank 20000mAh', barcode: '194644097301', category: 'Aksesuar', unit: 'adet', purchase_price: 800.0, sale_price: 1200.0, vat_rate: 20, stock_quantity: 100, min_stock_level: 20 },
      { name: 'USB-C Sarj Kablosu 1m', barcode: '8681234567890', category: 'Aksesuar', unit: 'adet', purchase_price: 50.0, sale_price: 100.0, vat_rate: 20, stock_quantity: 200, min_stock_level: 50 },
      { name: 'Telefon Kilifi Universal', barcode: '8681234567891', category: 'Aksesuar', unit: 'adet', purchase_price: 30.0, sale_price: 75.0, vat_rate: 20, stock_quantity: 150, min_stock_level: 30 },
      { name: 'Ekran Koruyucu Cam', barcode: '8681234567892', category: 'Aksesuar', unit: 'adet', purchase_price: 20.0, sale_price: 50.0, vat_rate: 20, stock_quantity: 3, min_stock_level: 50 },
    ])
    .returning('*');

  // =====================
  // 3. WAREHOUSES
  // =====================
  const warehouses = await knex('warehouses')
    .insert([
      { name: 'Ana Depo', code: 'AD001', address: 'Kadikoy, Istanbul', phone: '0216 123 4567', manager: 'Hasan Yilmaz', is_default: true, is_active: true },
      { name: 'Sube Depo', code: 'SD001', address: 'Besiktas, Istanbul', phone: '0212 234 5678', manager: 'Ayse Kara', is_default: false, is_active: true },
      { name: 'Yedek Depo', code: 'YD001', address: 'Umraniye, Istanbul', phone: '0216 345 6789', manager: 'Mehmet Oz', is_default: false, is_active: true },
    ])
    .returning('*');

  // =====================
  // 4. WAREHOUSE STOCKS
  // =====================
  for (const product of products) {
    await knex('warehouse_stocks').insert([
      { warehouse_id: warehouses[0].id, product_id: product.id, quantity: Math.floor(product.stock_quantity * 0.6) },
      { warehouse_id: warehouses[1].id, product_id: product.id, quantity: Math.floor(product.stock_quantity * 0.3) },
      { warehouse_id: warehouses[2].id, product_id: product.id, quantity: Math.floor(product.stock_quantity * 0.1) },
    ]);
  }

  // =====================
  // 5. ACCOUNTS (Kasa/Banka)
  // =====================
  const accounts = await knex('accounts')
    .insert([
      { name: 'Ana Kasa', type: 'kasa', balance: 25000.0, opening_balance: 10000.0, is_default: true, is_active: true },
      { name: 'Garanti Bankasi', type: 'banka', bank_name: 'Garanti BBVA', branch_name: 'Kadikoy Subesi', account_number: '1234567', iban: 'TR12 0006 2000 0001 2345 6789 01', balance: 150000.0, opening_balance: 100000.0, is_default: false, is_active: true },
      { name: 'Is Bankasi', type: 'banka', bank_name: 'Turkiye Is Bankasi', branch_name: 'Besiktas Subesi', account_number: '7654321', iban: 'TR98 0006 4000 0017 6543 2100 01', balance: 75000.0, opening_balance: 50000.0, is_default: false, is_active: true },
      { name: 'Pos Cihazi', type: 'kasa', balance: 5000.0, opening_balance: 0, is_default: false, is_active: true },
    ])
    .returning('*');

  // =====================
  // 6. SALES
  // =====================
  const sales = await knex('sales')
    .insert([
      { invoice_number: 'INV202401001', customer_id: customers[0].id, warehouse_id: warehouses[0].id, sale_date: '2024-01-15', subtotal: 15000, discount_amount: 0, discount_rate: 0, vat_total: 3000, grand_total: 18000, include_vat: true, payment_method: 'cash', status: 'completed' },
      { invoice_number: 'INV202401002', customer_id: customers[1].id, warehouse_id: warehouses[0].id, sale_date: '2024-01-16', subtotal: 55000, discount_amount: 2750, discount_rate: 5, vat_total: 10450, grand_total: 62700, include_vat: true, payment_method: 'credit_card', status: 'completed' },
      { invoice_number: 'INV202401003', customer_id: customers[2].id, warehouse_id: warehouses[1].id, sale_date: '2024-01-17', subtotal: 6500, discount_amount: 0, discount_rate: 0, vat_total: 1300, grand_total: 7800, include_vat: true, payment_method: 'bank_transfer', status: 'completed' },
      { invoice_number: 'INV202401004', customer_id: customers[3].id, warehouse_id: warehouses[0].id, sale_date: '2024-01-18', subtotal: 32000, discount_amount: 1600, discount_rate: 5, vat_total: 6080, grand_total: 36480, include_vat: true, payment_method: 'credit', due_date: '2024-02-18', status: 'completed' },
      { invoice_number: 'INV202401005', customer_id: customers[4].id, warehouse_id: warehouses[0].id, sale_date: '2024-01-20', subtotal: 21000, discount_amount: 0, discount_rate: 0, vat_total: 4200, grand_total: 25200, include_vat: true, payment_method: 'cash', status: 'completed' },
      { invoice_number: 'INV202401006', customer_id: customers[0].id, warehouse_id: warehouses[0].id, sale_date: '2024-01-22', subtotal: 3200, discount_amount: 0, discount_rate: 0, vat_total: 640, grand_total: 3840, include_vat: true, payment_method: 'credit_card', status: 'completed' },
      { invoice_number: 'INV202401007', customer_id: customers[1].id, warehouse_id: warehouses[1].id, sale_date: '2024-01-25', subtotal: 10500, discount_amount: 525, discount_rate: 5, vat_total: 1995, grand_total: 11970, include_vat: true, payment_method: 'cash', status: 'cancelled' },
    ])
    .returning('*');

  // =====================
  // 7. SALE ITEMS
  // =====================
  await knex('sale_items').insert([
    { sale_id: sales[0].id, product_id: products[0].id, quantity: 1, unit_price: 15000, discount_rate: 0, vat_rate: 20, vat_amount: 3000, line_total: 18000 },
    { sale_id: sales[1].id, product_id: products[1].id, quantity: 1, unit_price: 55000, discount_rate: 5, vat_rate: 20, vat_amount: 10450, line_total: 62700 },
    { sale_id: sales[2].id, product_id: products[2].id, quantity: 1, unit_price: 6500, discount_rate: 0, vat_rate: 20, vat_amount: 1300, line_total: 7800 },
    { sale_id: sales[3].id, product_id: products[3].id, quantity: 1, unit_price: 32000, discount_rate: 5, vat_rate: 20, vat_amount: 6080, line_total: 36480 },
    { sale_id: sales[4].id, product_id: products[4].id, quantity: 2, unit_price: 10500, discount_rate: 0, vat_rate: 20, vat_amount: 4200, line_total: 25200 },
    { sale_id: sales[5].id, product_id: products[5].id, quantity: 1, unit_price: 3200, discount_rate: 0, vat_rate: 20, vat_amount: 640, line_total: 3840 },
    { sale_id: sales[6].id, product_id: products[4].id, quantity: 1, unit_price: 10500, discount_rate: 5, vat_rate: 20, vat_amount: 1995, line_total: 11970 },
  ]);

  // =====================
  // 8. PAYMENTS
  // =====================
  await knex('payments').insert([
    { customer_id: customers[0].id, sale_id: sales[0].id, payment_date: '2024-01-15', amount: 18000, method: 'cash', notes: 'Pesin odeme' },
    { customer_id: customers[1].id, sale_id: sales[1].id, payment_date: '2024-01-16', amount: 62700, method: 'credit_card', notes: 'Tek cekim' },
    { customer_id: customers[2].id, sale_id: sales[2].id, payment_date: '2024-01-17', amount: 7800, method: 'bank_transfer', notes: 'Havale ile odeme' },
    { customer_id: customers[3].id, sale_id: sales[3].id, payment_date: '2024-01-25', amount: 20000, method: 'cash', notes: 'Kismi odeme' },
    { customer_id: customers[4].id, sale_id: sales[4].id, payment_date: '2024-01-20', amount: 25200, method: 'cash', notes: 'Pesin odeme' },
    { customer_id: customers[0].id, sale_id: sales[5].id, payment_date: '2024-01-22', amount: 3840, method: 'credit_card', notes: 'Kredi karti ile odeme' },
  ]);

  // =====================
  // 9. RETURNS
  // =====================
  const returns = await knex('returns')
    .insert([
      { return_number: 'RET202401001', sale_id: sales[0].id, customer_id: customers[0].id, return_date: '2024-01-20', total_amount: 15000, vat_total: 3000, reason: 'Urun arizali', status: 'completed' },
      { return_number: 'RET202401002', customer_id: customers[2].id, return_date: '2024-01-22', total_amount: 6500, vat_total: 1300, reason: 'Yanlis urun', status: 'completed' },
    ])
    .returning('*');

  // =====================
  // 10. RETURN ITEMS
  // =====================
  await knex('return_items').insert([
    { return_id: returns[0].id, product_id: products[0].id, quantity: 1, unit_price: 15000, vat_amount: 3000, line_total: 18000 },
    { return_id: returns[1].id, product_id: products[2].id, quantity: 1, unit_price: 6500, vat_amount: 1300, line_total: 7800 },
  ]);

  // =====================
  // 11. EXPENSES
  // =====================
  await knex('expenses').insert([
    { category: 'kira', description: 'Dukkan kirasi - Ocak 2024', amount: 15000.0, expense_date: '2024-01-01', is_recurring: true, recurrence_period: 'aylik' },
    { category: 'fatura', description: 'Elektrik faturasi - Ocak 2024', amount: 2500.0, expense_date: '2024-01-15', is_recurring: false },
    { category: 'maas', description: 'Calisan maasi - Ocak 2024', amount: 25000.0, expense_date: '2024-01-30', is_recurring: true, recurrence_period: 'aylik' },
    { category: 'vergi', description: 'KDV odemesi - 4. ceyrek 2023', amount: 8500.0, expense_date: '2024-01-25', is_recurring: false },
    { category: 'diger', description: 'Ofis malzemeleri', amount: 750.0, expense_date: '2024-01-10', is_recurring: false },
    { category: 'fatura', description: 'Internet faturasi - Ocak 2024', amount: 500.0, expense_date: '2024-01-20', is_recurring: true, recurrence_period: 'aylik' },
    { category: 'fatura', description: 'Su faturasi - Ocak 2024', amount: 350.0, expense_date: '2024-01-18', is_recurring: false },
  ]);

  // =====================
  // 12. ACCOUNT MOVEMENTS
  // =====================
  await knex('account_movements').insert([
    { account_id: accounts[0].id, movement_type: 'gelir', category: 'satis', amount: 18000, balance_after: 28000, description: 'Satis tahsilati - INV202401001', movement_date: '2024-01-15' },
    { account_id: accounts[0].id, movement_type: 'gelir', category: 'satis', amount: 25200, balance_after: 53200, description: 'Satis tahsilati - INV202401005', movement_date: '2024-01-20' },
    { account_id: accounts[0].id, movement_type: 'gider', category: 'kira', amount: 15000, balance_after: 38200, description: 'Dukkan kirasi - Ocak', movement_date: '2024-01-01' },
    { account_id: accounts[1].id, movement_type: 'gelir', category: 'satis', amount: 62700, balance_after: 162700, description: 'Satis tahsilati - INV202401002', movement_date: '2024-01-16' },
    { account_id: accounts[1].id, movement_type: 'gelir', category: 'satis', amount: 7800, balance_after: 170500, description: 'Satis tahsilati - INV202401003', movement_date: '2024-01-17' },
    { account_id: accounts[1].id, movement_type: 'gider', category: 'maas', amount: 25000, balance_after: 145500, description: 'Calisan maasi - Ocak', movement_date: '2024-01-30' },
    { account_id: accounts[3].id, movement_type: 'gelir', category: 'satis', amount: 3840, balance_after: 3840, description: 'POS tahsilati - INV202401006', movement_date: '2024-01-22' },
  ]);

  // =====================
  // 13. ACCOUNT TRANSFERS
  // =====================
  await knex('account_transfers').insert([
    { from_account_id: accounts[0].id, to_account_id: accounts[1].id, amount: 20000, description: 'Kasadan bankaya aktarim', transfer_date: '2024-01-25' },
    { from_account_id: accounts[3].id, to_account_id: accounts[1].id, amount: 3000, description: 'POS hesabindan bankaya aktarim', transfer_date: '2024-01-28' },
  ]);

  // =====================
  // 14. QUOTES
  // =====================
  const quotes = await knex('quotes')
    .insert([
      { quote_number: 'QT202401001', customer_id: customers[0].id, quote_date: '2024-01-10', validity_date: '2024-02-10', subtotal: 65000, discount_amount: 3250, discount_rate: 5, vat_total: 12350, grand_total: 74100, include_vat: true, status: 'sent', notes: 'Toplu alis teklifi' },
      { quote_number: 'QT202401002', customer_id: customers[1].id, quote_date: '2024-01-12', validity_date: '2024-01-27', subtotal: 32000, discount_amount: 0, discount_rate: 0, vat_total: 6400, grand_total: 38400, include_vat: true, status: 'accepted' },
      { quote_number: 'QT202401003', customer_id: customers[2].id, quote_date: '2024-01-14', validity_date: '2024-01-29', subtotal: 10500, discount_amount: 0, discount_rate: 0, vat_total: 2100, grand_total: 12600, include_vat: true, status: 'rejected', notes: 'Fiyat yuksek bulundu' },
      { quote_number: 'QT202401004', customer_id: customers[3].id, quote_date: '2024-01-18', validity_date: '2024-02-18', subtotal: 21000, discount_amount: 1050, discount_rate: 5, vat_total: 3990, grand_total: 23940, include_vat: true, status: 'draft' },
      { quote_number: 'QT202401005', customer_id: customers[4].id, quote_date: '2024-01-20', validity_date: '2024-02-20', subtotal: 55000, discount_amount: 0, discount_rate: 0, vat_total: 11000, grand_total: 66000, include_vat: true, status: 'converted', converted_sale_id: sales[1].id },
    ])
    .returning('*');

  // =====================
  // 15. QUOTE ITEMS
  // =====================
  await knex('quote_items').insert([
    { quote_id: quotes[0].id, product_id: products[0].id, quantity: 2, unit_price: 15000, discount_rate: 5, vat_rate: 20, vat_amount: 5700, line_total: 34200 },
    { quote_id: quotes[0].id, product_id: products[2].id, quantity: 5, unit_price: 6500, discount_rate: 5, vat_rate: 20, vat_amount: 6175, line_total: 37050 },
    { quote_id: quotes[1].id, product_id: products[3].id, quantity: 1, unit_price: 32000, discount_rate: 0, vat_rate: 20, vat_amount: 6400, line_total: 38400 },
    { quote_id: quotes[2].id, product_id: products[4].id, quantity: 1, unit_price: 10500, discount_rate: 0, vat_rate: 20, vat_amount: 2100, line_total: 12600 },
    { quote_id: quotes[3].id, product_id: products[4].id, quantity: 2, unit_price: 10500, discount_rate: 5, vat_rate: 20, vat_amount: 3990, line_total: 23940 },
    { quote_id: quotes[4].id, product_id: products[1].id, quantity: 1, unit_price: 55000, discount_rate: 0, vat_rate: 20, vat_amount: 11000, line_total: 66000 },
  ]);

  // =====================
  // 16. E-DOCUMENTS
  // =====================
  const eDocuments = await knex('e_documents')
    .insert([
      { document_type: 'e-fatura', document_number: 'EF2024000001', sale_id: sales[0].id, customer_id: customers[0].id, issue_date: '2024-01-15', subtotal: 15000, vat_total: 3000, grand_total: 18000, status: 'sent', gib_uuid: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', gib_response_code: '1000', gib_response_message: 'Basariyla gonderildi' },
      { document_type: 'e-fatura', document_number: 'EF2024000002', sale_id: sales[1].id, customer_id: customers[1].id, issue_date: '2024-01-16', subtotal: 55000, vat_total: 10450, grand_total: 62700, status: 'sent', gib_uuid: 'b2c3d4e5-f6a7-8901-bcde-f23456789012' },
      { document_type: 'e-arsiv', document_number: 'EA2024000001', sale_id: sales[2].id, customer_id: customers[2].id, issue_date: '2024-01-17', subtotal: 6500, vat_total: 1300, grand_total: 7800, status: 'created' },
      { document_type: 'e-irsaliye', document_number: 'EI2024000001', customer_id: customers[3].id, issue_date: '2024-01-18', subtotal: 32000, vat_total: 6080, grand_total: 36480, status: 'pending' },
      { document_type: 'e-smm', document_number: 'ES2024000001', customer_id: customers[4].id, issue_date: '2024-01-20', subtotal: 5000, vat_total: 1000, grand_total: 6000, status: 'sent', gib_uuid: 'c3d4e5f6-a7b8-9012-cdef-345678901234' },
    ])
    .returning('*');

  // =====================
  // 17. E-DOCUMENT LOGS
  // =====================
  await knex('e_document_logs').insert([
    { e_document_id: eDocuments[0].id, action: 'create', status: 'created', message: 'Belge olusturuldu' },
    { e_document_id: eDocuments[0].id, action: 'send', status: 'sent', message: 'GIB\'e gonderildi' },
    { e_document_id: eDocuments[1].id, action: 'create', status: 'created', message: 'Belge olusturuldu' },
    { e_document_id: eDocuments[1].id, action: 'send', status: 'sent', message: 'GIB\'e gonderildi' },
    { e_document_id: eDocuments[2].id, action: 'create', status: 'created', message: 'Belge olusturuldu' },
    { e_document_id: eDocuments[3].id, action: 'create', status: 'created', message: 'Belge olusturuldu' },
    { e_document_id: eDocuments[3].id, action: 'send', status: 'pending', message: 'Gonderim bekleniyor' },
  ]);

  // =====================
  // 18. INTEGRATIONS
  // =====================
  const integrations = await knex('integrations')
    .insert([
      { name: 'Trendyol Magazasi', type: 'e-commerce', provider: 'trendyol', status: 'active', config: JSON.stringify({ apiKey: 'xxx', sellerId: '12345', warehouseId: warehouses[0].id }), last_sync_at: '2024-01-25 10:30:00' },
      { name: 'Hepsiburada Magazasi', type: 'e-commerce', provider: 'hepsiburada', status: 'active', config: JSON.stringify({ apiKey: 'yyy', merchantId: '67890' }), last_sync_at: '2024-01-24 15:45:00' },
      { name: 'N11 Magazasi', type: 'e-commerce', provider: 'n11', status: 'inactive', config: JSON.stringify({ apiKey: 'zzz', sellerId: '11111' }) },
      { name: 'Garanti Banka Entegrasyonu', type: 'bank', provider: 'garanti', status: 'active', config: JSON.stringify({ accountId: accounts[1].id, merchantId: 'M123' }), last_sync_at: '2024-01-25 09:00:00' },
      { name: 'Iyzico Odeme', type: 'payment', provider: 'iyzico', status: 'active', config: JSON.stringify({ apiKey: 'iyz_xxx', secretKey: 'iyz_secret' }) },
    ])
    .returning('*');

  // =====================
  // 19. INTEGRATION LOGS
  // =====================
  await knex('integration_logs').insert([
    { integration_id: integrations[0].id, action: 'sync_orders', status: 'success', message: '15 siparis senkronize edildi' },
    { integration_id: integrations[0].id, action: 'sync_products', status: 'success', message: 'Urunler guncellendi' },
    { integration_id: integrations[0].id, action: 'sync_orders', status: 'failed', message: 'API baglanti hatasi', error_details: 'Connection timeout' },
    { integration_id: integrations[1].id, action: 'sync_orders', status: 'success', message: '8 siparis senkronize edildi' },
    { integration_id: integrations[3].id, action: 'sync_statements', status: 'success', message: 'Hesap ekstresi alindi' },
  ]);

  // =====================
  // 20. E-COMMERCE ORDERS
  // =====================
  await knex('e_commerce_orders').insert([
    { integration_id: integrations[0].id, platform_order_id: 'TY-2024-001', order_date: '2024-01-20', customer_name: 'Online Musteri 1', total_amount: 15000, status: 'delivered', sync_status: 'synced', sale_id: sales[4].id },
    { integration_id: integrations[0].id, platform_order_id: 'TY-2024-002', order_date: '2024-01-22', customer_name: 'Online Musteri 2', total_amount: 6500, status: 'shipped', sync_status: 'synced' },
    { integration_id: integrations[0].id, platform_order_id: 'TY-2024-003', order_date: '2024-01-25', customer_name: 'Online Musteri 3', total_amount: 3200, status: 'pending', sync_status: 'pending' },
    { integration_id: integrations[1].id, platform_order_id: 'HB-2024-001', order_date: '2024-01-21', customer_name: 'HB Musteri 1', total_amount: 10500, status: 'delivered', sync_status: 'synced' },
    { integration_id: integrations[1].id, platform_order_id: 'HB-2024-002', order_date: '2024-01-24', customer_name: 'HB Musteri 2', total_amount: 1200, status: 'processing', sync_status: 'error', error_message: 'Stok yetersiz' },
  ]);

  // =====================
  // 21. CRM CONTACTS
  // =====================
  const contacts = await knex('crm_contacts')
    .insert([
      { name: 'Burak Yildirim', email: 'burak@firma.com', phone: '0537 111 2233', mobile: '0537 111 2233', company: 'ABC Teknoloji', title: 'Satin Alma Muduru', status: 'lead', source: 'website', notes: 'Web sitesinden form doldurdu' },
      { name: 'Selin Aksoy', email: 'selin@xyz.com', phone: '0538 222 3344', company: 'XYZ Holding', title: 'IT Direktoru', status: 'prospect', source: 'referral', notes: 'Ahmet Bey tarafindan yonlendirildi' },
      { name: 'Emre Koc', email: 'emre@startup.io', phone: '0539 333 4455', company: 'Startup IO', title: 'CEO', status: 'customer', source: 'fair', notes: 'Fuarda tanistik', customer_id: customers[4].id },
      { name: 'Zeynep Demir', email: 'zeynep@bigcorp.com', phone: '0540 444 5566', mobile: '0540 444 5566', company: 'Big Corp', title: 'Proje Yoneticisi', status: 'lead', source: 'linkedin', notes: 'LinkedIn\'den baglanti kuruldu' },
      { name: 'Can Ozkan', email: 'can@techfirm.com', phone: '0541 555 6677', company: 'Tech Firm', title: 'CTO', status: 'lost', source: 'cold_call', notes: 'Baska tedarikci ile anlasti', lost_reason: 'Fiyat yuksek' },
    ])
    .returning('*');

  // =====================
  // 22. CRM ACTIVITIES
  // =====================
  await knex('crm_activities').insert([
    { contact_id: contacts[0].id, type: 'call', subject: 'Ilk gorusme', description: 'Urun tanitimi yapildi, fiyat teklifi istendi', status: 'completed', scheduled_at: '2024-01-15 10:00:00', completed_at: '2024-01-15 10:30:00', duration_minutes: 30 },
    { contact_id: contacts[0].id, type: 'email', subject: 'Teklif gonderimi', description: 'Fiyat teklifi email ile gonderildi', status: 'completed', scheduled_at: '2024-01-16 14:00:00', completed_at: '2024-01-16 14:15:00' },
    { contact_id: contacts[1].id, type: 'meeting', subject: 'Yuz yuze toplanti', description: 'Ofislerinde urun demosu yapilacak', status: 'planned', scheduled_at: '2024-02-01 14:00:00', duration_minutes: 60 },
    { contact_id: contacts[1].id, type: 'call', subject: 'Tanitim gorusmesi', description: 'Telefonda urun tanitimi yapildi', status: 'completed', scheduled_at: '2024-01-20 11:00:00', completed_at: '2024-01-20 11:45:00', duration_minutes: 45 },
    { contact_id: contacts[2].id, type: 'note', subject: 'Musteri oldu', description: 'Satis tamamlandi, musteri hesabi olusturuldu', status: 'completed', completed_at: '2024-01-18 16:00:00' },
    { contact_id: contacts[3].id, type: 'task', subject: 'Teklif hazirlama', description: 'Ozel teklif hazirlanacak', status: 'planned', scheduled_at: '2024-01-28 09:00:00' },
    { contact_id: contacts[4].id, type: 'call', subject: 'Son gorusme', description: 'Baska tedarikci ile anlastigini bildirdi', status: 'completed', scheduled_at: '2024-01-22 15:00:00', completed_at: '2024-01-22 15:20:00', duration_minutes: 20 },
  ]);

  // =====================
  // 23. FIELD TEAM ROUTES
  // =====================
  const routes = await knex('field_team_routes')
    .insert([
      { name: 'Kadikoy Rotasi', route_date: '2024-01-25', status: 'completed', notes: 'Kadikoy bolgesi ziyaretleri', estimated_duration: 240, actual_duration: 255 },
      { name: 'Besiktas Rotasi', route_date: '2024-01-26', status: 'completed', notes: 'Besiktas bolgesi ziyaretleri', estimated_duration: 180, actual_duration: 195 },
      { name: 'Sisli Rotasi', route_date: '2024-01-28', status: 'in_progress', notes: 'Sisli bolgesi ziyaretleri', estimated_duration: 300 },
      { name: 'Bakirkoy Rotasi', route_date: '2024-01-29', status: 'planned', notes: 'Bakirkoy bolgesi ziyaretleri', estimated_duration: 210 },
      { name: 'Uskudar Rotasi', route_date: '2024-01-30', status: 'planned', notes: 'Uskudar bolgesi ziyaretleri', estimated_duration: 240 },
    ])
    .returning('*');

  // =====================
  // 24. FIELD TEAM VISITS
  // =====================
  await knex('field_team_visits').insert([
    { route_id: routes[0].id, customer_id: customers[0].id, visit_type: 'regular', scheduled_time: '09:00', check_in_time: '2024-01-25 09:05:00', check_out_time: '2024-01-25 09:45:00', status: 'completed', notes: 'Yeni urunler tanitildi', outcome: 'Siparis alindi' },
    { route_id: routes[0].id, customer_id: customers[2].id, visit_type: 'collection', scheduled_time: '10:30', check_in_time: '2024-01-25 10:35:00', check_out_time: '2024-01-25 11:00:00', status: 'completed', notes: 'Tahsilat yapildi', outcome: 'Odeme alindi' },
    { route_id: routes[1].id, customer_id: customers[1].id, visit_type: 'regular', scheduled_time: '14:00', check_in_time: '2024-01-26 14:10:00', check_out_time: '2024-01-26 14:50:00', status: 'completed', notes: 'Stok kontrolu yapildi' },
    { route_id: routes[2].id, customer_id: customers[4].id, visit_type: 'regular', scheduled_time: '10:00', check_in_time: '2024-01-28 10:00:00', status: 'in_progress', notes: 'Gorusme devam ediyor' },
    { route_id: routes[2].id, customer_id: customers[3].id, visit_type: 'collection', scheduled_time: '11:30', status: 'pending' },
    { route_id: routes[3].id, customer_id: customers[3].id, visit_type: 'regular', scheduled_time: '09:00', status: 'pending' },
    { route_id: routes[4].id, customer_id: customers[2].id, visit_type: 'regular', scheduled_time: '10:00', status: 'pending' },
  ]);

  // =====================
  // 25. STOCK MOVEMENTS
  // =====================
  await knex('stock_movements').insert([
    { product_id: products[0].id, warehouse_id: warehouses[0].id, movement_type: 'sale', quantity: -1, stock_after: 14, reference_type: 'sale', reference_id: sales[0].id, notes: 'Satis - INV202401001' },
    { product_id: products[1].id, warehouse_id: warehouses[0].id, movement_type: 'sale', quantity: -1, stock_after: 5, reference_type: 'sale', reference_id: sales[1].id, notes: 'Satis - INV202401002' },
    { product_id: products[2].id, warehouse_id: warehouses[1].id, movement_type: 'sale', quantity: -1, stock_after: 14, reference_type: 'sale', reference_id: sales[2].id, notes: 'Satis - INV202401003' },
    { product_id: products[0].id, warehouse_id: warehouses[0].id, movement_type: 'return', quantity: 1, stock_after: 15, reference_type: 'return', reference_id: returns[0].id, notes: 'Iade - RET202401001' },
    { product_id: products[4].id, warehouse_id: warehouses[0].id, movement_type: 'adjustment', quantity: 5, stock_after: 29, notes: 'Sayim fazlasi' },
    { product_id: products[6].id, warehouse_id: warehouses[0].id, movement_type: 'purchase', quantity: 50, stock_after: 110, notes: 'Yeni stok girisi' },
  ]);

  console.log('Seed data inserted successfully!');
  console.log(`- ${customers.length} customers`);
  console.log(`- ${products.length} products`);
  console.log(`- ${warehouses.length} warehouses`);
  console.log(`- ${accounts.length} accounts`);
  console.log(`- ${sales.length} sales`);
  console.log(`- ${returns.length} returns`);
  console.log(`- ${quotes.length} quotes`);
  console.log(`- ${eDocuments.length} e-documents`);
  console.log(`- ${integrations.length} integrations`);
  console.log(`- ${contacts.length} CRM contacts`);
  console.log(`- ${routes.length} field team routes`);
  console.log('- 7 expenses');
  console.log('- Multiple movements, items, logs, visits...');
}
