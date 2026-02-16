import { Knex } from 'knex';
import * as bcrypt from 'bcrypt';

const DEMO_SLUG = 'stoksayac-demo';

export async function seed(knex: Knex): Promise<void> {
  // Idempotent: skip if demo tenant already exists
  const existing = await knex('tenants').where({ slug: DEMO_SLUG }).first();
  if (existing) {
    return;
  }

  // Get the Pro plan
  const plan = await knex('plans').where({ code: 'pro' }).first();

  // ─── 1. Tenant ───────────────────────────────────────────
  const [tenant] = await knex('tenants')
    .insert({
      name: 'StokSayaç Demo',
      slug: DEMO_SLUG,
      plan_id: plan?.id || null,
      status: 'active',
      settings: JSON.stringify({
        address: 'Levent Mah. Büyükdere Cad. No:185 Şişli/İstanbul',
        phone: '0212 555 0001',
        taxOffice: 'Levent VD',
        taxNumber: '1234567890',
        currency: 'TRY',
        companyTitle: 'StokSayaç Demo Ticaret A.Ş.',
      }),
      subscription_starts_at: knex.fn.now(),
      billing_email: 'demo@stoksayac.com',
    })
    .returning('id');

  const tenantId = tenant.id;

  // ─── 2. User ─────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Demo2026!', 12);

  const [user] = await knex('users')
    .insert({
      tenant_id: tenantId,
      email: 'demo@stoksayac.com',
      password_hash: passwordHash,
      name: 'Demo Kullanıcı',
      phone: '0532 555 0001',
      role: 'tenant_admin',
      permissions: JSON.stringify(['*']),
      status: 'active',
      email_verified_at: knex.fn.now(),
    })
    .returning('id');

  const userId = user.id;

  // Update tenant owner
  await knex('tenants').where({ id: tenantId }).update({ owner_id: userId });

  // ─── 3. Müşteriler (10 adet) ─────────────────────────────
  const customersData = [
    { name: 'Anadolu Elektrik Ltd. Şti.', phone: '0212 444 1001', email: 'info@anadoluelektrik.com', address: 'Kozyatağı, Kadıköy/İstanbul', tax_number: '1111111111', tax_office: 'Kadıköy VD', balance: 4500.00 },
    { name: 'Yıldız Mobilya San. Tic. A.Ş.', phone: '0216 333 2002', email: 'satis@yildizmobilya.com', address: 'Organize Sanayi, Kocaeli', tax_number: '2222222222', tax_office: 'Gebze VD', balance: 12000.00 },
    { name: 'Karadeniz Gıda Pazarlama', phone: '0462 321 3003', email: 'siparis@karadenizgida.com', address: 'Pelitli, Trabzon', tax_number: '3333333333', tax_office: 'Trabzon VD', balance: 0 },
    { name: 'Ege Tekstil A.Ş.', phone: '0232 456 4004', email: 'bilgi@egetekstil.com', address: 'Bornova, İzmir', tax_number: '4444444444', tax_office: 'Bornova VD', balance: 8750.00 },
    { name: 'Marmara Otomotiv Ltd. Şti.', phone: '0224 567 5005', email: 'servis@marmaraoto.com', address: 'Nilüfer, Bursa', tax_number: '5555555555', tax_office: 'Nilüfer VD', balance: 3200.00 },
    { name: 'Akdeniz İnşaat Malz. Tic.', phone: '0242 678 6006', email: 'satis@akdenizinsaat.com', address: 'Kepez, Antalya', tax_number: '6666666666', tax_office: 'Antalya VD', balance: 0 },
    { name: 'Başkent Bilişim Hizmetleri', phone: '0312 789 7007', email: 'destek@baskentbilisim.com', address: 'Çankaya, Ankara', tax_number: '7777777777', tax_office: 'Çankaya VD', balance: 15000.00 },
    { name: 'Doğu Madencilik A.Ş.', phone: '0442 890 8008', email: 'info@dogumaden.com', address: 'Yakutiye, Erzurum', tax_number: '8888888888', tax_office: 'Erzurum VD', balance: 0 },
    { name: 'Trakya Kimya San. Ltd.', phone: '0284 901 9009', email: 'satin@trakyakimya.com', address: 'Çerkezköy, Tekirdağ', tax_number: '9999999999', tax_office: 'Çerkezköy VD', balance: 6500.00 },
    { name: 'Güneş Enerji Sistemleri', phone: '0352 012 1010', email: 'proje@gunesenerji.com', address: 'Melikgazi, Kayseri', tax_number: '1010101010', tax_office: 'Kayseri VD', balance: 22000.00 },
  ];

  const customers = await knex('customers')
    .insert(customersData.map(c => ({ ...c, tenant_id: tenantId, is_active: true })))
    .returning('id');

  const customerIds = customers.map(c => c.id);

  // ─── 4. Ürünler (15 adet) ────────────────────────────────
  const productsData = [
    { name: 'Laptop HP ProBook 450 G10', barcode: 'DEMO-8001001', category: 'Bilgisayar', unit: 'adet', purchase_price: 28000, sale_price: 35000, vat_rate: 20, stock_quantity: 25 },
    { name: 'Monitor Dell 27" 4K', barcode: 'DEMO-8001002', category: 'Bilgisayar', unit: 'adet', purchase_price: 8500, sale_price: 11500, vat_rate: 20, stock_quantity: 40 },
    { name: 'Klavye Logitech MX Keys', barcode: 'DEMO-8001003', category: 'Aksesuar', unit: 'adet', purchase_price: 2200, sale_price: 3200, vat_rate: 20, stock_quantity: 60 },
    { name: 'Mouse Logitech MX Master 3S', barcode: 'DEMO-8001004', category: 'Aksesuar', unit: 'adet', purchase_price: 1800, sale_price: 2800, vat_rate: 20, stock_quantity: 55 },
    { name: 'Yazıcı HP LaserJet Pro', barcode: 'DEMO-8001005', category: 'Yazıcı', unit: 'adet', purchase_price: 5500, sale_price: 7500, vat_rate: 20, stock_quantity: 15 },
    { name: 'Toner HP 26A Siyah', barcode: 'DEMO-8001006', category: 'Sarf Malzeme', unit: 'adet', purchase_price: 450, sale_price: 750, vat_rate: 20, stock_quantity: 100 },
    { name: 'USB-C Hub 7in1', barcode: 'DEMO-8001007', category: 'Aksesuar', unit: 'adet', purchase_price: 600, sale_price: 950, vat_rate: 20, stock_quantity: 80 },
    { name: 'Webcam Logitech C920', barcode: 'DEMO-8001008', category: 'Aksesuar', unit: 'adet', purchase_price: 1500, sale_price: 2200, vat_rate: 20, stock_quantity: 35 },
    { name: 'UPS APC 1500VA', barcode: 'DEMO-8001009', category: 'Güç Kaynağı', unit: 'adet', purchase_price: 4200, sale_price: 5800, vat_rate: 20, stock_quantity: 20 },
    { name: 'Cat6 Ethernet Kablo 50m', barcode: 'DEMO-8001010', category: 'Kablo', unit: 'adet', purchase_price: 250, sale_price: 450, vat_rate: 20, stock_quantity: 150 },
    { name: 'SSD Samsung 1TB NVMe', barcode: 'DEMO-8001011', category: 'Depolama', unit: 'adet', purchase_price: 2800, sale_price: 3800, vat_rate: 20, stock_quantity: 45 },
    { name: 'RAM DDR5 16GB', barcode: 'DEMO-8001012', category: 'Bileşen', unit: 'adet', purchase_price: 1900, sale_price: 2600, vat_rate: 20, stock_quantity: 50 },
    { name: 'Masa Üstü Telefon Cisco', barcode: 'DEMO-8001013', category: 'Telefon', unit: 'adet', purchase_price: 3500, sale_price: 4800, vat_rate: 20, stock_quantity: 18 },
    { name: 'Projeksiyon Epson EB-W52', barcode: 'DEMO-8001014', category: 'Sunum', unit: 'adet', purchase_price: 12000, sale_price: 16000, vat_rate: 20, stock_quantity: 8 },
    { name: 'A4 Kağıt 5\'li Paket', barcode: 'DEMO-8001015', category: 'Sarf Malzeme', unit: 'paket', purchase_price: 180, sale_price: 280, vat_rate: 10, stock_quantity: 200 },
  ];

  const products = await knex('products')
    .insert(productsData.map(p => ({ ...p, tenant_id: tenantId, is_active: true, min_stock_level: 5 })))
    .returning('id');

  const productIds = products.map(p => p.id);

  // ─── 5. Depolar (3 adet) ─────────────────────────────────
  const warehousesData = [
    { name: 'Ana Depo', code: 'DEMO-WH01', address: 'Levent, Şişli/İstanbul', phone: '0212 555 0010', manager_name: 'Ali Yılmaz', is_default: true },
    { name: 'Şube Depo', code: 'DEMO-WH02', address: 'Kartal, Kadıköy/İstanbul', phone: '0216 555 0020', manager_name: 'Mehmet Demir', is_default: false },
    { name: 'E-Ticaret Deposu', code: 'DEMO-WH03', address: 'Tuzla, İstanbul', phone: '0216 555 0030', manager_name: 'Ayşe Kaya', is_default: false },
  ];

  const warehouses = await knex('warehouses')
    .insert(warehousesData.map(w => ({ ...w, tenant_id: tenantId, is_active: true })))
    .returning('id');

  const warehouseIds = warehouses.map(w => w.id);

  // Warehouse stocks - distribute products across warehouses
  const warehouseStocksData: any[] = [];
  for (let i = 0; i < productIds.length; i++) {
    const totalStock = productsData[i].stock_quantity;
    const mainStock = Math.floor(totalStock * 0.5);
    const branchStock = Math.floor(totalStock * 0.3);
    const ecomStock = totalStock - mainStock - branchStock;

    warehouseStocksData.push(
      { tenant_id: tenantId, warehouse_id: warehouseIds[0], product_id: productIds[i], quantity: mainStock, min_stock_level: 3 },
      { tenant_id: tenantId, warehouse_id: warehouseIds[1], product_id: productIds[i], quantity: branchStock, min_stock_level: 2 },
      { tenant_id: tenantId, warehouse_id: warehouseIds[2], product_id: productIds[i], quantity: ecomStock, min_stock_level: 2 },
    );
  }
  await knex('warehouse_stocks').insert(warehouseStocksData);

  // ─── 6. Hesaplar (3 adet) ────────────────────────────────
  const accountsData = [
    { name: 'Kasa', account_type: 'kasa', currency: 'TRY', opening_balance: 50000, current_balance: 67500, is_default: true },
    { name: 'İş Bankası', account_type: 'banka', bank_name: 'İş Bankası', iban: 'TR330006100519786457841326', account_number: '5197864578', branch_name: 'Levent Şubesi', currency: 'TRY', opening_balance: 150000, current_balance: 185000, is_default: false },
    { name: 'Garanti BBVA', account_type: 'banka', bank_name: 'Garanti BBVA', iban: 'TR580006200082600006299429', account_number: '6200826000', branch_name: 'Maslak Şubesi', currency: 'TRY', opening_balance: 80000, current_balance: 95000, is_default: false },
  ];

  const accounts = await knex('accounts')
    .insert(accountsData.map(a => ({ ...a, tenant_id: tenantId, is_active: true })))
    .returning('id');

  const accountIds = accounts.map(a => a.id);

  // Account movements
  const now = new Date();
  const daysAgo = (d: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    return date;
  };

  const movementsData = [
    { account_id: accountIds[0], movement_type: 'gelir', amount: 12500, balance_after: 62500, category: 'Satış', description: 'Nakit satış tahsilatı', movement_date: daysAgo(25) },
    { account_id: accountIds[0], movement_type: 'gider', amount: 3500, balance_after: 59000, category: 'Kira', description: 'Ofis kirası', movement_date: daysAgo(20) },
    { account_id: accountIds[0], movement_type: 'gelir', amount: 8500, balance_after: 67500, category: 'Satış', description: 'Nakit tahsilat', movement_date: daysAgo(10) },
    { account_id: accountIds[1], movement_type: 'gelir', amount: 45000, balance_after: 195000, category: 'Satış', description: 'Havale ile tahsilat', movement_date: daysAgo(22) },
    { account_id: accountIds[1], movement_type: 'gider', amount: 15000, balance_after: 180000, category: 'Maaş', description: 'Personel maaş ödemesi', movement_date: daysAgo(15) },
    { account_id: accountIds[1], movement_type: 'gelir', amount: 5000, balance_after: 185000, category: 'Satış', description: 'EFT ile tahsilat', movement_date: daysAgo(5) },
    { account_id: accountIds[2], movement_type: 'gelir', amount: 20000, balance_after: 100000, category: 'Satış', description: 'Kredi kartı tahsilat', movement_date: daysAgo(18) },
    { account_id: accountIds[2], movement_type: 'gider', amount: 5000, balance_after: 95000, category: 'Fatura', description: 'Elektrik faturası', movement_date: daysAgo(8) },
  ];

  await knex('account_movements').insert(movementsData.map(m => ({ ...m, tenant_id: tenantId, reference_type: null, reference_id: null })));

  // ─── 7. Satışlar (12 adet) ───────────────────────────────
  const salesData = [
    { invoice_number: 'DEMO-SAT-2026-001', customer_idx: 0, warehouse_idx: 0, sale_date: daysAgo(28), subtotal: 70000, vat_total: 14000, grand_total: 84000, payment_method: 'havale', status: 'completed', items: [{ prod: 0, qty: 2, price: 35000 }] },
    { invoice_number: 'DEMO-SAT-2026-002', customer_idx: 1, warehouse_idx: 0, sale_date: daysAgo(26), subtotal: 23000, vat_total: 4600, grand_total: 27600, payment_method: 'kredi_karti', status: 'completed', items: [{ prod: 1, qty: 2, price: 11500 }] },
    { invoice_number: 'DEMO-SAT-2026-003', customer_idx: 2, warehouse_idx: 0, sale_date: daysAgo(24), subtotal: 6000, vat_total: 1200, grand_total: 7200, payment_method: 'nakit', status: 'completed', items: [{ prod: 2, qty: 1, price: 3200 }, { prod: 3, qty: 1, price: 2800 }] },
    { invoice_number: 'DEMO-SAT-2026-004', customer_idx: 3, warehouse_idx: 1, sale_date: daysAgo(22), subtotal: 15000, vat_total: 3000, grand_total: 18000, payment_method: 'havale', status: 'completed', items: [{ prod: 4, qty: 2, price: 7500 }] },
    { invoice_number: 'DEMO-SAT-2026-005', customer_idx: 4, warehouse_idx: 0, sale_date: daysAgo(20), subtotal: 7500, vat_total: 1500, grand_total: 9000, payment_method: 'nakit', status: 'completed', items: [{ prod: 5, qty: 10, price: 750 }] },
    { invoice_number: 'DEMO-SAT-2026-006', customer_idx: 6, warehouse_idx: 2, sale_date: daysAgo(18), subtotal: 38000, vat_total: 7600, grand_total: 45600, payment_method: 'kredi_karti', status: 'completed', items: [{ prod: 10, qty: 10, price: 3800 }] },
    { invoice_number: 'DEMO-SAT-2026-007', customer_idx: 7, warehouse_idx: 0, sale_date: daysAgo(15), subtotal: 16000, vat_total: 3200, grand_total: 19200, payment_method: 'havale', status: 'completed', items: [{ prod: 13, qty: 1, price: 16000 }] },
    { invoice_number: 'DEMO-SAT-2026-008', customer_idx: 8, warehouse_idx: 1, sale_date: daysAgo(12), subtotal: 5200, vat_total: 1040, grand_total: 6240, payment_method: 'nakit', status: 'completed', items: [{ prod: 11, qty: 2, price: 2600 }] },
    { invoice_number: 'DEMO-SAT-2026-009', customer_idx: 9, warehouse_idx: 0, sale_date: daysAgo(10), subtotal: 11600, vat_total: 2320, grand_total: 13920, payment_method: 'kredi_karti', status: 'completed', items: [{ prod: 8, qty: 2, price: 5800 }] },
    { invoice_number: 'DEMO-SAT-2026-010', customer_idx: 0, warehouse_idx: 2, sale_date: daysAgo(7), subtotal: 9500, vat_total: 1900, grand_total: 11400, payment_method: 'havale', status: 'completed', items: [{ prod: 1, qty: 1, price: 11500 }].map(i => ({ ...i, price: 9500 })) },
    { invoice_number: 'DEMO-SAT-2026-011', customer_idx: 5, warehouse_idx: 0, sale_date: daysAgo(4), subtotal: 4800, vat_total: 960, grand_total: 5760, payment_method: 'nakit', status: 'completed', items: [{ prod: 12, qty: 1, price: 4800 }] },
    { invoice_number: 'DEMO-SAT-2026-012', customer_idx: 3, warehouse_idx: 0, sale_date: daysAgo(1), subtotal: 2800, vat_total: 280, grand_total: 3080, payment_method: 'kredi_karti', status: 'completed', items: [{ prod: 14, qty: 10, price: 280 }] },
  ];

  const saleIds: string[] = [];
  const allSaleItemIds: string[][] = [];

  for (const sale of salesData) {
    const [saleRecord] = await knex('sales')
      .insert({
        tenant_id: tenantId,
        invoice_number: sale.invoice_number,
        customer_id: customerIds[sale.customer_idx],
        warehouse_id: warehouseIds[sale.warehouse_idx],
        sale_date: sale.sale_date,
        subtotal: sale.subtotal,
        vat_total: sale.vat_total,
        grand_total: sale.grand_total,
        payment_method: sale.payment_method,
        status: sale.status,
        include_vat: true,
        discount_amount: 0,
        discount_rate: 0,
      })
      .returning('id');

    saleIds.push(saleRecord.id);

    const itemInserts = sale.items.map(item => ({
      tenant_id: tenantId,
      sale_id: saleRecord.id,
      product_id: productIds[item.prod],
      quantity: item.qty,
      unit_price: item.price,
      vat_rate: productsData[item.prod].vat_rate,
      vat_amount: item.price * item.qty * (productsData[item.prod].vat_rate / 100),
      discount_rate: 0,
      line_total: item.price * item.qty,
    }));

    const insertedItems = await knex('sale_items').insert(itemInserts).returning('id');
    allSaleItemIds.push(insertedItems.map(i => i.id));
  }

  // ─── 8. İadeler (3 adet) ─────────────────────────────────
  const returnsData = [
    {
      return_number: 'DEMO-IAD-2026-001',
      sale_idx: 2,
      customer_idx: 2,
      warehouse_idx: 0,
      return_date: daysAgo(20),
      total_amount: 2800,
      vat_total: 560,
      reason: 'Ürün arızalı geldi',
      items: [{ prod: 3, qty: 1, price: 2800, sale_item_idx: 1 }],
    },
    {
      return_number: 'DEMO-IAD-2026-002',
      sale_idx: 4,
      customer_idx: 4,
      warehouse_idx: 0,
      return_date: daysAgo(16),
      total_amount: 1500,
      vat_total: 300,
      reason: 'Yanlış ürün gönderildi',
      items: [{ prod: 5, qty: 2, price: 750, sale_item_idx: 0 }],
    },
    {
      return_number: 'DEMO-IAD-2026-003',
      sale_idx: 7,
      customer_idx: 8,
      warehouse_idx: 1,
      return_date: daysAgo(8),
      total_amount: 2600,
      vat_total: 520,
      reason: 'Müşteri vazgeçti',
      items: [{ prod: 11, qty: 1, price: 2600, sale_item_idx: 0 }],
    },
  ];

  for (const ret of returnsData) {
    const [returnRecord] = await knex('returns')
      .insert({
        tenant_id: tenantId,
        return_number: ret.return_number,
        sale_id: saleIds[ret.sale_idx],
        customer_id: customerIds[ret.customer_idx],
        warehouse_id: warehouseIds[ret.warehouse_idx],
        return_date: ret.return_date,
        total_amount: ret.total_amount,
        vat_total: ret.vat_total,
        reason: ret.reason,
        status: 'completed',
      })
      .returning('id');

    await knex('return_items').insert(
      ret.items.map(item => ({
        tenant_id: tenantId,
        return_id: returnRecord.id,
        product_id: productIds[item.prod],
        sale_item_id: allSaleItemIds[ret.sale_idx][item.sale_item_idx],
        quantity: item.qty,
        unit_price: item.price,
        vat_amount: item.price * item.qty * 0.2,
        line_total: item.price * item.qty,
      })),
    );
  }

  // ─── 9. Ödemeler (8 adet) ────────────────────────────────
  const paymentsData = [
    { customer_idx: 0, sale_idx: 0, account_idx: 1, payment_date: daysAgo(27), amount: 84000, method: 'havale' },
    { customer_idx: 1, sale_idx: 1, account_idx: 2, payment_date: daysAgo(25), amount: 27600, method: 'kredi_karti' },
    { customer_idx: 2, sale_idx: 2, account_idx: 0, payment_date: daysAgo(23), amount: 7200, method: 'nakit' },
    { customer_idx: 3, sale_idx: 3, account_idx: 1, payment_date: daysAgo(21), amount: 18000, method: 'havale' },
    { customer_idx: 4, sale_idx: 4, account_idx: 0, payment_date: daysAgo(19), amount: 9000, method: 'nakit' },
    { customer_idx: 6, sale_idx: 5, account_idx: 2, payment_date: daysAgo(17), amount: 45600, method: 'kredi_karti' },
    { customer_idx: 9, sale_idx: 8, account_idx: 2, payment_date: daysAgo(9), amount: 13920, method: 'kredi_karti' },
    { customer_idx: 5, sale_idx: 10, account_idx: 0, payment_date: daysAgo(3), amount: 5760, method: 'nakit' },
  ];

  await knex('payments').insert(
    paymentsData.map(p => ({
      tenant_id: tenantId,
      customer_id: customerIds[p.customer_idx],
      sale_id: saleIds[p.sale_idx],
      account_id: accountIds[p.account_idx],
      payment_date: p.payment_date,
      amount: p.amount,
      method: p.method,
    })),
  );

  // ─── 10. Giderler (8 adet) ───────────────────────────────
  const expensesData = [
    { category: 'Kira', description: 'Ofis kirası - Şubat 2026', amount: 18000, expense_date: daysAgo(28), account_idx: 1, is_recurring: true, recurrence_period: 'monthly' },
    { category: 'Fatura', description: 'Elektrik faturası', amount: 4500, expense_date: daysAgo(25), account_idx: 1, is_recurring: true, recurrence_period: 'monthly' },
    { category: 'Fatura', description: 'İnternet + Telefon faturası', amount: 2800, expense_date: daysAgo(24), account_idx: 1, is_recurring: true, recurrence_period: 'monthly' },
    { category: 'Maaş', description: 'Personel maaşları - Ocak', amount: 85000, expense_date: daysAgo(20), account_idx: 1, is_recurring: true, recurrence_period: 'monthly' },
    { category: 'Malzeme', description: 'Ofis malzemesi alımı', amount: 3200, expense_date: daysAgo(15), account_idx: 0, is_recurring: false, recurrence_period: null },
    { category: 'Ulaşım', description: 'Kargo ve nakliye giderleri', amount: 5500, expense_date: daysAgo(12), account_idx: 0, is_recurring: false, recurrence_period: null },
    { category: 'Pazarlama', description: 'Google Ads kampanyası', amount: 8000, expense_date: daysAgo(8), account_idx: 2, is_recurring: false, recurrence_period: null },
    { category: 'Bakım', description: 'Araç bakım ve yakıt', amount: 4200, expense_date: daysAgo(3), account_idx: 0, is_recurring: false, recurrence_period: null },
  ];

  await knex('expenses').insert(
    expensesData.map(e => ({
      tenant_id: tenantId,
      category: e.category,
      description: e.description,
      amount: e.amount,
      expense_date: e.expense_date,
      account_id: accountIds[e.account_idx],
      is_recurring: e.is_recurring,
      recurrence_period: e.recurrence_period,
    })),
  );

  // ─── 11. Teklifler (5 adet) ──────────────────────────────
  const quotesData = [
    { quote_number: 'DEMO-TEK-2026-001', customer_idx: 0, quote_date: daysAgo(28), valid_until: daysAgo(-30), subtotal: 105000, vat_total: 21000, grand_total: 126000, status: 'converted', items: [{ prod: 0, qty: 3, price: 35000 }] },
    { quote_number: 'DEMO-TEK-2026-002', customer_idx: 3, quote_date: daysAgo(20), valid_until: daysAgo(-10), subtotal: 32000, vat_total: 6400, grand_total: 38400, status: 'accepted', items: [{ prod: 13, qty: 2, price: 16000 }] },
    { quote_number: 'DEMO-TEK-2026-003', customer_idx: 6, quote_date: daysAgo(15), valid_until: daysAgo(-15), subtotal: 23000, vat_total: 4600, grand_total: 27600, status: 'sent', items: [{ prod: 1, qty: 2, price: 11500 }] },
    { quote_number: 'DEMO-TEK-2026-004', customer_idx: 9, quote_date: daysAgo(10), valid_until: daysAgo(-20), subtotal: 46000, vat_total: 9200, grand_total: 55200, status: 'rejected', items: [{ prod: 0, qty: 1, price: 35000 }, { prod: 1, qty: 1, price: 11500 }] },
    { quote_number: 'DEMO-TEK-2026-005', customer_idx: 4, quote_date: daysAgo(2), valid_until: daysAgo(-28), subtotal: 11400, vat_total: 2280, grand_total: 13680, status: 'draft', items: [{ prod: 8, qty: 1, price: 5800 }, { prod: 7, qty: 1, price: 2200 }, { prod: 6, qty: 2, price: 950 }, { prod: 10, qty: 1, price: 3800 }] },
  ];

  for (let i = 0; i < quotesData.length; i++) {
    const q = quotesData[i];
    const converted_sale_id = q.status === 'converted' ? saleIds[0] : null;

    const [quoteRecord] = await knex('quotes')
      .insert({
        tenant_id: tenantId,
        quote_number: q.quote_number,
        customer_id: customerIds[q.customer_idx],
        quote_date: q.quote_date,
        valid_until: q.valid_until,
        subtotal: q.subtotal,
        vat_total: q.vat_total,
        grand_total: q.grand_total,
        status: q.status,
        include_vat: true,
        discount_amount: 0,
        discount_rate: 0,
        converted_sale_id,
      })
      .returning('id');

    await knex('quote_items').insert(
      q.items.map(item => ({
        tenant_id: tenantId,
        quote_id: quoteRecord.id,
        product_id: productIds[item.prod],
        product_name: productsData[item.prod].name,
        quantity: item.qty,
        unit_price: item.price,
        vat_rate: productsData[item.prod].vat_rate,
        vat_amount: item.price * item.qty * (productsData[item.prod].vat_rate / 100),
        discount_rate: 0,
        line_total: item.price * item.qty,
      })),
    );
  }

  // ─── 12. e-Belgeler (4 adet) ─────────────────────────────
  const eDocsData = [
    { document_type: 'e_fatura', document_number: 'DEMO-EFT-2026-001', reference_type: 'sale', reference_idx: 0, customer_idx: 0, amount: 70000, vat_amount: 14000, total_amount: 84000, status: 'approved', issue_date: daysAgo(27), sent_at: daysAgo(27), approved_at: daysAgo(26) },
    { document_type: 'e_arsiv', document_number: 'DEMO-EAR-2026-001', reference_type: 'sale', reference_idx: 2, customer_idx: 2, amount: 6000, vat_amount: 1200, total_amount: 7200, status: 'sent', issue_date: daysAgo(23), sent_at: daysAgo(23), approved_at: null },
    { document_type: 'e_irsaliye', document_number: 'DEMO-EIR-2026-001', reference_type: 'waybill', reference_idx: 5, customer_idx: 6, amount: 38000, vat_amount: 7600, total_amount: 45600, status: 'pending', issue_date: daysAgo(17), sent_at: null, approved_at: null },
    { document_type: 'e_fatura', document_number: 'DEMO-EFT-2026-002', reference_type: 'sale', reference_idx: 8, customer_idx: 9, amount: 11600, vat_amount: 2320, total_amount: 13920, status: 'draft', issue_date: daysAgo(9), sent_at: null, approved_at: null },
  ];

  for (const doc of eDocsData) {
    const [eDoc] = await knex('e_documents')
      .insert({
        tenant_id: tenantId,
        document_type: doc.document_type,
        document_number: doc.document_number,
        reference_type: doc.reference_type,
        reference_id: saleIds[doc.reference_idx],
        customer_id: customerIds[doc.customer_idx],
        issue_date: doc.issue_date,
        amount: doc.amount,
        vat_amount: doc.vat_amount,
        total_amount: doc.total_amount,
        status: doc.status,
        sent_at: doc.sent_at,
        approved_at: doc.approved_at,
      })
      .returning('id');

    // e_document_logs
    const logs: any[] = [
      { document_id: eDoc.id, tenant_id: tenantId, action: 'created', status_before: null, status_after: 'draft', message: 'Belge oluşturuldu', created_at: doc.issue_date },
    ];

    if (doc.status !== 'draft') {
      logs.push({ document_id: eDoc.id, tenant_id: tenantId, action: 'sent', status_before: 'draft', status_after: doc.status === 'pending' ? 'pending' : 'sent', message: 'GİB\'e gönderildi', created_at: doc.sent_at || doc.issue_date });
    }
    if (doc.status === 'approved') {
      logs.push({ document_id: eDoc.id, tenant_id: tenantId, action: 'approved', status_before: 'sent', status_after: 'approved', message: 'GİB tarafından onaylandı', created_at: doc.approved_at || doc.issue_date });
    }

    await knex('e_document_logs').insert(logs);
  }

  // ─── 13. CRM Kişiler (6 adet) + Aktiviteler (10 adet) ───
  const crmContactsData = [
    { customer_idx: 0, name: 'Ahmet Yılmaz', title: 'Satın Alma Müdürü', email: 'ahmet@anadoluelektrik.com', phone: '0532 111 0001', status: 'customer', source: 'referral' },
    { customer_idx: 1, name: 'Fatma Demir', title: 'Genel Müdür', email: 'fatma@yildizmobilya.com', phone: '0533 222 0002', status: 'customer', source: 'website' },
    { customer_idx: 3, name: 'Emre Kara', title: 'IT Direktörü', email: 'emre@egetekstil.com', phone: '0535 444 0004', status: 'prospect', source: 'cold_call' },
    { customer_idx: 6, name: 'Selin Öztürk', title: 'Finans Müdürü', email: 'selin@baskentbilisim.com', phone: '0537 777 0007', status: 'customer', source: 'event' },
    { customer_idx: null, name: 'Burak Aksoy', title: 'Kurucu', email: 'burak@techstartup.io', phone: '0538 888 0008', status: 'lead', source: 'social' },
    { customer_idx: null, name: 'Zeynep Çelik', title: 'Operasyon Müdürü', email: 'zeynep@logistik.com', phone: '0539 999 0009', status: 'lead', source: 'website' },
  ];

  const crmContacts = await knex('crm_contacts')
    .insert(
      crmContactsData.map(c => ({
        tenant_id: tenantId,
        customer_id: c.customer_idx !== null ? customerIds[c.customer_idx] : null,
        name: c.name,
        title: c.title,
        email: c.email,
        phone: c.phone,
        status: c.status,
        source: c.source,
        last_contact_date: daysAgo(Math.floor(Math.random() * 15) + 1),
        next_follow_up: daysAgo(-Math.floor(Math.random() * 14) - 1),
      })),
    )
    .returning('id');

  const contactIds = crmContacts.map(c => c.id);

  const crmActivitiesData = [
    { contact_idx: 0, type: 'call', subject: 'Yeni sipariş görüşmesi', description: 'Q2 için toplu sipariş talebi', status: 'completed', scheduled_at: daysAgo(25), completed_at: daysAgo(25), duration_minutes: 30 },
    { contact_idx: 0, type: 'email', subject: 'Teklif gönderimi', description: 'Laptop toplu alım teklifi gönderildi', status: 'completed', scheduled_at: daysAgo(24), completed_at: daysAgo(24), duration_minutes: 15 },
    { contact_idx: 1, type: 'meeting', subject: 'Yüz yüze toplantı', description: 'Fabrika ziyareti ve ürün tanıtımı', status: 'completed', scheduled_at: daysAgo(20), completed_at: daysAgo(20), duration_minutes: 90 },
    { contact_idx: 2, type: 'call', subject: 'İlk görüşme', description: 'IT altyapı ihtiyaçları hakkında görüşme', status: 'completed', scheduled_at: daysAgo(18), completed_at: daysAgo(18), duration_minutes: 25 },
    { contact_idx: 3, type: 'email', subject: 'Fatura takibi', description: 'Ödeme hatırlatma maili', status: 'completed', scheduled_at: daysAgo(15), completed_at: daysAgo(15), duration_minutes: 10 },
    { contact_idx: 4, type: 'call', subject: 'Potansiyel müşteri araması', description: 'LinkedIn üzerinden gelen talep', status: 'completed', scheduled_at: daysAgo(12), completed_at: daysAgo(12), duration_minutes: 20 },
    { contact_idx: 4, type: 'meeting', subject: 'Demo sunumu', description: 'Ürün demosu planlanıyor', status: 'planned', scheduled_at: daysAgo(-3), completed_at: null, duration_minutes: 60 },
    { contact_idx: 5, type: 'call', subject: 'İlk temas', description: 'Web sitesinden gelen form', status: 'completed', scheduled_at: daysAgo(10), completed_at: daysAgo(10), duration_minutes: 15 },
    { contact_idx: 5, type: 'task', subject: 'Teklif hazırla', description: 'Lojistik çözüm teklifi hazırlanacak', status: 'planned', scheduled_at: daysAgo(-1), completed_at: null, duration_minutes: null },
    { contact_idx: 2, type: 'note', subject: 'Toplantı notları', description: 'Bütçe onayı bekleniyor, Mart ayında karar verilecek', status: 'completed', scheduled_at: daysAgo(5), completed_at: daysAgo(5), duration_minutes: null },
  ];

  await knex('crm_activities').insert(
    crmActivitiesData.map(a => ({
      tenant_id: tenantId,
      contact_id: contactIds[a.contact_idx],
      type: a.type,
      subject: a.subject,
      description: a.description,
      status: a.status,
      scheduled_at: a.scheduled_at,
      completed_at: a.completed_at,
      duration_minutes: a.duration_minutes,
      created_by: userId,
    })),
  );

  // ─── 14. Saha Ekibi (2 rota + 6 ziyaret) ────────────────
  const [route1] = await knex('field_team_routes')
    .insert({
      tenant_id: tenantId,
      name: 'İstanbul Anadolu Yakası Rotası',
      route_date: daysAgo(5),
      assigned_to: userId,
      status: 'completed',
      notes: 'Haftalık rutin ziyaretler',
      estimated_duration_minutes: 360,
      actual_duration_minutes: 400,
    })
    .returning('id');

  const [route2] = await knex('field_team_routes')
    .insert({
      tenant_id: tenantId,
      name: 'İstanbul Avrupa Yakası Rotası',
      route_date: daysAgo(-2),
      assigned_to: userId,
      status: 'planned',
      notes: 'Yeni müşteri ziyaretleri',
      estimated_duration_minutes: 300,
      actual_duration_minutes: null,
    })
    .returning('id');

  const visitsData = [
    { route_id: route1.id, customer_idx: 0, contact_idx: 0, visit_order: 1, status: 'completed', visit_type: 'sales', address: 'Kozyatağı, Kadıköy', scheduled_time: daysAgo(5), check_in_time: daysAgo(5), check_out_time: daysAgo(5), notes: 'Yeni sipariş alındı', outcome: 'Sipariş onaylandı' },
    { route_id: route1.id, customer_idx: 1, contact_idx: 1, visit_order: 2, status: 'completed', visit_type: 'collection', address: 'Organize Sanayi, Kocaeli', scheduled_time: daysAgo(5), check_in_time: daysAgo(5), check_out_time: daysAgo(5), notes: 'Tahsilat yapıldı', outcome: '27.600 TL tahsil edildi' },
    { route_id: route1.id, customer_idx: 4, contact_idx: null, visit_order: 3, status: 'skipped', visit_type: 'support', address: 'Nilüfer, Bursa', scheduled_time: daysAgo(5), check_in_time: null, check_out_time: null, notes: 'Müşteri müsait değildi', outcome: null },
    { route_id: route2.id, customer_idx: 6, contact_idx: 3, visit_order: 1, status: 'pending', visit_type: 'meeting', address: 'Çankaya, Ankara', scheduled_time: daysAgo(-2), check_in_time: null, check_out_time: null, notes: 'Yıllık sözleşme görüşmesi', outcome: null },
    { route_id: route2.id, customer_idx: 5, contact_idx: null, visit_order: 2, status: 'pending', visit_type: 'sales', address: 'Kepez, Antalya', scheduled_time: daysAgo(-2), check_in_time: null, check_out_time: null, notes: 'Ürün tanıtımı', outcome: null },
    { route_id: route2.id, customer_idx: 8, contact_idx: null, visit_order: 3, status: 'pending', visit_type: 'delivery', address: 'Çerkezköy, Tekirdağ', scheduled_time: daysAgo(-2), check_in_time: null, check_out_time: null, notes: 'Ürün teslimatı', outcome: null },
  ];

  await knex('field_team_visits').insert(
    visitsData.map(v => ({
      tenant_id: tenantId,
      route_id: v.route_id,
      customer_id: customerIds[v.customer_idx],
      contact_id: v.contact_idx !== null ? contactIds[v.contact_idx] : null,
      visit_order: v.visit_order,
      status: v.status,
      visit_type: v.visit_type,
      address: v.address,
      scheduled_time: v.scheduled_time,
      check_in_time: v.check_in_time,
      check_out_time: v.check_out_time,
      notes: v.notes,
      outcome: v.outcome,
    })),
  );

  // ─── 15. Entegrasyonlar (2 adet) ─────────────────────────
  const [trendyolIntegration] = await knex('integrations')
    .insert({
      tenant_id: tenantId,
      name: 'Trendyol Mağaza',
      type: 'e_commerce',
      provider: 'trendyol',
      status: 'active',
      config: JSON.stringify({ shopId: 'demo-shop-123', autoSync: true, syncInterval: 30 }),
      credentials: JSON.stringify({ apiKey: 'demo-api-key', apiSecret: 'demo-api-secret', sellerId: 'demo-seller' }),
      last_sync_at: daysAgo(0),
    })
    .returning('id');

  const [bankIntegration] = await knex('integrations')
    .insert({
      tenant_id: tenantId,
      name: 'İş Bankası Hesap',
      type: 'bank',
      provider: 'isbank',
      status: 'active',
      config: JSON.stringify({ accountId: accountIds[1], syncDays: 7 }),
      credentials: JSON.stringify({ clientId: 'demo-client', clientSecret: 'demo-secret' }),
      last_sync_at: daysAgo(1),
    })
    .returning('id');

  // Integration logs
  const integrationLogsData = [
    { integration_id: trendyolIntegration.id, action: 'sync', status: 'success', message: '15 ürün senkronize edildi', details: JSON.stringify({ productCount: 15, duration: 2300 }), created_at: daysAgo(1) },
    { integration_id: trendyolIntegration.id, action: 'pull', status: 'success', message: '3 yeni sipariş alındı', details: JSON.stringify({ orderCount: 3 }), created_at: daysAgo(0) },
    { integration_id: bankIntegration.id, action: 'sync', status: 'success', message: '12 hesap hareketi senkronize edildi', details: JSON.stringify({ transactionCount: 12 }), created_at: daysAgo(1) },
    { integration_id: bankIntegration.id, action: 'pull', status: 'failed', message: 'API bağlantı zaman aşımı', details: JSON.stringify({ error: 'Connection timeout after 30s' }), created_at: daysAgo(0) },
  ];

  await knex('integration_logs').insert(
    integrationLogsData.map(l => ({ ...l, tenant_id: tenantId })),
  );

  // ─── 16. Stok Transferleri (2 adet) ──────────────────────
  const [transfer1] = await knex('stock_transfers')
    .insert({
      tenant_id: tenantId,
      transfer_number: 'DEMO-TRN-2026-001',
      from_warehouse_id: warehouseIds[0],
      to_warehouse_id: warehouseIds[1],
      transfer_date: daysAgo(10),
      status: 'completed',
      notes: 'Şube depoya stok takviyesi',
    })
    .returning('id');

  const [transfer2] = await knex('stock_transfers')
    .insert({
      tenant_id: tenantId,
      transfer_number: 'DEMO-TRN-2026-002',
      from_warehouse_id: warehouseIds[0],
      to_warehouse_id: warehouseIds[2],
      transfer_date: daysAgo(3),
      status: 'in_transit',
      notes: 'E-ticaret deposuna transfer',
    })
    .returning('id');

  await knex('stock_transfer_items').insert([
    { tenant_id: tenantId, transfer_id: transfer1.id, product_id: productIds[0], quantity: 5 },
    { tenant_id: tenantId, transfer_id: transfer1.id, product_id: productIds[2], quantity: 10 },
    { tenant_id: tenantId, transfer_id: transfer1.id, product_id: productIds[5], quantity: 20 },
    { tenant_id: tenantId, transfer_id: transfer2.id, product_id: productIds[1], quantity: 5 },
    { tenant_id: tenantId, transfer_id: transfer2.id, product_id: productIds[3], quantity: 10 },
  ]);

  // ─── 17. Müşteri İşlemleri (account_transactions) ────────
  const transactionsData = [
    { customer_idx: 0, type: 'borc', amount: 84000, description: 'DEMO-SAT-2026-001 satış', reference_type: 'sale', reference_idx: 0, date: daysAgo(28) },
    { customer_idx: 0, type: 'alacak', amount: 84000, description: 'Havale ile ödeme', reference_type: 'payment', reference_idx: null, date: daysAgo(27) },
    { customer_idx: 1, type: 'borc', amount: 27600, description: 'DEMO-SAT-2026-002 satış', reference_type: 'sale', reference_idx: 1, date: daysAgo(26) },
    { customer_idx: 1, type: 'alacak', amount: 27600, description: 'Kredi kartı ile ödeme', reference_type: 'payment', reference_idx: null, date: daysAgo(25) },
    { customer_idx: 2, type: 'borc', amount: 7200, description: 'DEMO-SAT-2026-003 satış', reference_type: 'sale', reference_idx: 2, date: daysAgo(24) },
    { customer_idx: 2, type: 'alacak', amount: 7200, description: 'Nakit ödeme', reference_type: 'payment', reference_idx: null, date: daysAgo(23) },
    { customer_idx: 2, type: 'alacak', amount: 2800, description: 'DEMO-IAD-2026-001 iade', reference_type: 'return', reference_idx: null, date: daysAgo(20) },
    { customer_idx: 3, type: 'borc', amount: 18000, description: 'DEMO-SAT-2026-004 satış', reference_type: 'sale', reference_idx: 3, date: daysAgo(22) },
    { customer_idx: 3, type: 'alacak', amount: 18000, description: 'Havale ile ödeme', reference_type: 'payment', reference_idx: null, date: daysAgo(21) },
    { customer_idx: 4, type: 'borc', amount: 9000, description: 'DEMO-SAT-2026-005 satış', reference_type: 'sale', reference_idx: 4, date: daysAgo(20) },
    { customer_idx: 4, type: 'alacak', amount: 9000, description: 'Nakit ödeme', reference_type: 'payment', reference_idx: null, date: daysAgo(19) },
    { customer_idx: 6, type: 'borc', amount: 45600, description: 'DEMO-SAT-2026-006 satış', reference_type: 'sale', reference_idx: 5, date: daysAgo(18) },
    { customer_idx: 6, type: 'alacak', amount: 45600, description: 'Kredi kartı ile ödeme', reference_type: 'payment', reference_idx: null, date: daysAgo(17) },
    { customer_idx: 9, type: 'borc', amount: 13920, description: 'DEMO-SAT-2026-009 satış', reference_type: 'sale', reference_idx: 8, date: daysAgo(10) },
    { customer_idx: 9, type: 'alacak', amount: 13920, description: 'Kredi kartı ile ödeme', reference_type: 'payment', reference_idx: null, date: daysAgo(9) },
    { customer_idx: 0, type: 'borc', amount: 11400, description: 'DEMO-SAT-2026-010 satış', reference_type: 'sale', reference_idx: 9, date: daysAgo(7) },
    { customer_idx: 5, type: 'borc', amount: 5760, description: 'DEMO-SAT-2026-011 satış', reference_type: 'sale', reference_idx: 10, date: daysAgo(4) },
    { customer_idx: 5, type: 'alacak', amount: 5760, description: 'Nakit ödeme', reference_type: 'payment', reference_idx: null, date: daysAgo(3) },
    { customer_idx: 3, type: 'borc', amount: 3080, description: 'DEMO-SAT-2026-012 satış', reference_type: 'sale', reference_idx: 11, date: daysAgo(1) },
  ];

  await knex('account_transactions').insert(
    transactionsData.map(t => ({
      tenant_id: tenantId,
      customer_id: customerIds[t.customer_idx],
      type: t.type,
      amount: t.amount,
      description: t.description,
      reference_type: t.reference_type,
      reference_id: t.reference_idx !== null ? saleIds[t.reference_idx] : null,
      transaction_date: t.date,
    })),
  );

  console.log('✅ Demo tenant seed completed: demo@stoksayac.com / Demo2026!');
}
