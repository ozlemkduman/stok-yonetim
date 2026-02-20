import { Knex } from 'knex';

const TENANT_EMAIL = 'demo206@stoksayac.com';

export async function seed(knex: Knex): Promise<void> {
  const tenant = await knex('tenants').where({ billing_email: TENANT_EMAIL }).first();
  if (!tenant) {
    console.log(`⚠️ Tenant not found for ${TENANT_EMAIL}, skipping seed`);
    return;
  }

  const tenantId = tenant.id;

  // Idempotent check
  const marker = await knex('expenses')
    .where({ tenant_id: tenantId, description: 'SEED206: Ofis kirası - Ocak 2025' })
    .first();
  if (marker) {
    console.log(`⚠️ demo206 seed already applied, skipping`);
    return;
  }

  const user = await knex('users').where({ tenant_id: tenantId }).first();
  const userId = user?.id || null;

  const date = (y: number, m: number, d: number) => new Date(y, m - 1, d);

  // ─── Müşteriler (8 adet ek) ──────────────────────────────
  const newCustomers = await knex('customers')
    .insert([
      { tenant_id: tenantId, name: 'Yıldız Bilişim A.Ş.', phone: '0212 555 1001', email: 'info@yildizbilisim.com', tax_number: '1112223334', tax_office: 'Şişli VD', balance: 0, is_active: true },
      { tenant_id: tenantId, name: 'Ege Makina San. Ltd.', phone: '0232 444 2002', email: 'satis@egemakina.com', tax_number: '2223334445', tax_office: 'Bornova VD', balance: 0, is_active: true },
      { tenant_id: tenantId, name: 'Doğu Lojistik Hizmetleri', phone: '0442 333 3003', email: 'bilgi@dogulojistik.com', tax_number: '3334445556', tax_office: 'Erzurum VD', balance: 0, is_active: true },
      { tenant_id: tenantId, name: 'Marmara Gıda Paz. Tic.', phone: '0224 222 4004', email: 'siparis@marmaragida.com', tax_number: '4445556667', tax_office: 'Nilüfer VD', balance: 0, is_active: true },
      { tenant_id: tenantId, name: 'Akdeniz Turizm A.Ş.', phone: '0242 111 5005', email: 'info@akdeniztur.com', tax_number: '5556667778', tax_office: 'Antalya VD', balance: 0, is_active: true },
      { tenant_id: tenantId, name: 'Karadeniz Orman Ürünleri', phone: '0462 666 6006', email: 'satis@karadenizorman.com', tax_number: '6667778889', tax_office: 'Trabzon VD', balance: 0, is_active: true },
      { tenant_id: tenantId, name: 'Başkent Enerji Sistemleri', phone: '0312 777 7007', email: 'proje@baskentenerji.com', tax_number: '7778889990', tax_office: 'Çankaya VD', balance: 0, is_active: true },
      { tenant_id: tenantId, name: 'Trakya Tekstil San. Ltd.', phone: '0284 888 8008', email: 'bilgi@trakyatekstil.com', tax_number: '8889990001', tax_office: 'Çerkezköy VD', balance: 0, is_active: true },
    ])
    .returning('id');

  // Get all customer IDs
  const allCustomers = await knex('customers').where({ tenant_id: tenantId }).select('id');
  const customerIds = allCustomers.map(c => c.id);

  // ─── Ürünler (10 adet ek) ────────────────────────────────
  const productsData = [
    { name: 'Laptop Lenovo ThinkPad T14', barcode: 'S206-001', category: 'Bilgisayar', unit: 'adet', purchase_price: 32000, sale_price: 42000, vat_rate: 20, stock_quantity: 20, min_stock_level: 3 },
    { name: 'Monitor Samsung 27" QHD', barcode: 'S206-002', category: 'Bilgisayar', unit: 'adet', purchase_price: 7500, sale_price: 10500, vat_rate: 20, stock_quantity: 30, min_stock_level: 5 },
    { name: 'Yazıcı Brother HL-L2350DW', barcode: 'S206-003', category: 'Yazıcı', unit: 'adet', purchase_price: 4200, sale_price: 6000, vat_rate: 20, stock_quantity: 15, min_stock_level: 3 },
    { name: 'Toner Brother TN-2420', barcode: 'S206-004', category: 'Sarf Malzeme', unit: 'adet', purchase_price: 380, sale_price: 650, vat_rate: 20, stock_quantity: 80, min_stock_level: 10 },
    { name: 'Klavye Corsair K70 RGB', barcode: 'S206-005', category: 'Aksesuar', unit: 'adet', purchase_price: 2800, sale_price: 3900, vat_rate: 20, stock_quantity: 40, min_stock_level: 5 },
    { name: 'Mouse Razer DeathAdder V3', barcode: 'S206-006', category: 'Aksesuar', unit: 'adet', purchase_price: 1200, sale_price: 1800, vat_rate: 20, stock_quantity: 50, min_stock_level: 5 },
    { name: 'Webcam Logitech Brio 4K', barcode: 'S206-007', category: 'Aksesuar', unit: 'adet', purchase_price: 3500, sale_price: 4800, vat_rate: 20, stock_quantity: 25, min_stock_level: 3 },
    { name: 'SSD Kingston 1TB NVMe', barcode: 'S206-008', category: 'Depolama', unit: 'adet', purchase_price: 2200, sale_price: 3200, vat_rate: 20, stock_quantity: 35, min_stock_level: 5 },
    { name: 'UPS Eaton 1000VA', barcode: 'S206-009', category: 'Güç Kaynağı', unit: 'adet', purchase_price: 3800, sale_price: 5200, vat_rate: 20, stock_quantity: 18, min_stock_level: 3 },
    { name: 'A4 Kağıt 10\'lu Paket', barcode: 'S206-010', category: 'Sarf Malzeme', unit: 'paket', purchase_price: 320, sale_price: 480, vat_rate: 10, stock_quantity: 150, min_stock_level: 20 },
  ];

  const products = await knex('products')
    .insert(productsData.map(p => ({ ...p, tenant_id: tenantId, is_active: true })))
    .returning('id');
  const productIds = products.map(p => p.id);

  // Get existing warehouse
  const warehouse = await knex('warehouses').where({ tenant_id: tenantId }).first();
  const warehouseId = warehouse?.id || null;

  // ─── 50 Gider Kaydı ──────────────────────────────────────
  const expenses = [
    { category: 'kira', description: 'SEED206: Ofis kirası - Ocak 2025', amount: 15000, expense_date: date(2025, 1, 5), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'fatura', description: 'Elektrik faturası - Ocak 2025', amount: 3200, expense_date: date(2025, 1, 12), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'maas', description: 'Personel maaşları - Ocak 2025', amount: 72000, expense_date: date(2025, 1, 25), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'kira', description: 'Ofis kirası - Şubat 2025', amount: 15000, expense_date: date(2025, 2, 5), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'fatura', description: 'İnternet faturası - Şubat 2025', amount: 1800, expense_date: date(2025, 2, 10), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'diger', description: 'Ofis malzemesi alımı', amount: 2400, expense_date: date(2025, 2, 18), is_recurring: false, recurrence_period: null },
    { category: 'maas', description: 'Personel maaşları - Şubat 2025', amount: 72000, expense_date: date(2025, 2, 25), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'kira', description: 'Ofis kirası - Mart 2025', amount: 15000, expense_date: date(2025, 3, 5), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'fatura', description: 'Doğalgaz faturası - Mart 2025', amount: 4500, expense_date: date(2025, 3, 15), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'vergi', description: 'KDV beyanname ödemesi - Q1 2025', amount: 18500, expense_date: date(2025, 3, 24), is_recurring: false, recurrence_period: null },
    { category: 'maas', description: 'Personel maaşları - Mart 2025', amount: 72000, expense_date: date(2025, 3, 25), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'kira', description: 'Ofis kirası - Nisan 2025', amount: 15000, expense_date: date(2025, 4, 5), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'diger', description: 'Araç bakım ve lastik değişimi', amount: 6800, expense_date: date(2025, 4, 10), is_recurring: false, recurrence_period: null },
    { category: 'fatura', description: 'Telefon faturası - Nisan 2025', amount: 2100, expense_date: date(2025, 4, 18), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'kira', description: 'Ofis kirası - Mayıs 2025', amount: 16000, expense_date: date(2025, 5, 5), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'fatura', description: 'Elektrik faturası - Mayıs 2025', amount: 3800, expense_date: date(2025, 5, 12), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'maas', description: 'Personel maaşları - Mayıs 2025', amount: 75000, expense_date: date(2025, 5, 25), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'kira', description: 'Ofis kirası - Haziran 2025', amount: 16000, expense_date: date(2025, 6, 5), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'vergi', description: 'KDV beyanname ödemesi - Q2 2025', amount: 22000, expense_date: date(2025, 6, 24), is_recurring: false, recurrence_period: null },
    { category: 'maas', description: 'Personel maaşları - Haziran 2025', amount: 75000, expense_date: date(2025, 6, 25), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'diger', description: 'Yemek ve ağırlama giderleri', amount: 3500, expense_date: date(2025, 6, 28), is_recurring: false, recurrence_period: null },
    { category: 'kira', description: 'Ofis kirası - Temmuz 2025', amount: 16000, expense_date: date(2025, 7, 5), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'fatura', description: 'İnternet + Telefon - Temmuz 2025', amount: 4200, expense_date: date(2025, 7, 14), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'diger', description: 'Klima bakım ve onarım', amount: 5200, expense_date: date(2025, 7, 20), is_recurring: false, recurrence_period: null },
    { category: 'kira', description: 'Ofis kirası - Ağustos 2025', amount: 16000, expense_date: date(2025, 8, 5), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'fatura', description: 'Elektrik faturası - Ağustos 2025', amount: 5100, expense_date: date(2025, 8, 12), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'maas', description: 'Personel maaşları - Ağustos 2025', amount: 75000, expense_date: date(2025, 8, 25), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'kira', description: 'Ofis kirası - Eylül 2025', amount: 17000, expense_date: date(2025, 9, 5), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'vergi', description: 'KDV beyanname ödemesi - Q3 2025', amount: 19800, expense_date: date(2025, 9, 24), is_recurring: false, recurrence_period: null },
    { category: 'maas', description: 'Personel maaşları - Eylül 2025', amount: 78000, expense_date: date(2025, 9, 25), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'diger', description: 'Kırtasiye ve baskı giderleri', amount: 1800, expense_date: date(2025, 9, 30), is_recurring: false, recurrence_period: null },
    { category: 'kira', description: 'Ofis kirası - Ekim 2025', amount: 17000, expense_date: date(2025, 10, 5), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'fatura', description: 'Doğalgaz faturası - Ekim 2025', amount: 3200, expense_date: date(2025, 10, 15), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'diger', description: 'Yazılım lisans yenileme', amount: 8500, expense_date: date(2025, 10, 20), is_recurring: false, recurrence_period: null },
    { category: 'maas', description: 'Personel maaşları - Ekim 2025', amount: 78000, expense_date: date(2025, 10, 25), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'kira', description: 'Ofis kirası - Kasım 2025', amount: 17000, expense_date: date(2025, 11, 5), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'fatura', description: 'Elektrik faturası - Kasım 2025', amount: 4200, expense_date: date(2025, 11, 12), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'vergi', description: 'Gelir vergisi geçici vergi - 3. taksit', amount: 12500, expense_date: date(2025, 11, 17), is_recurring: false, recurrence_period: null },
    { category: 'maas', description: 'Personel maaşları - Kasım 2025', amount: 78000, expense_date: date(2025, 11, 25), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'kira', description: 'Ofis kirası - Aralık 2025', amount: 18000, expense_date: date(2025, 12, 5), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'fatura', description: 'Tüm faturalar - Aralık 2025', amount: 9500, expense_date: date(2025, 12, 15), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'maas', description: 'Personel maaşları + ikramiye - Aralık 2025', amount: 156000, expense_date: date(2025, 12, 20), is_recurring: false, recurrence_period: null },
    { category: 'diger', description: 'Yılbaşı organizasyon gideri', amount: 7500, expense_date: date(2025, 12, 28), is_recurring: false, recurrence_period: null },
    { category: 'kira', description: 'Ofis kirası - Ocak 2026', amount: 18000, expense_date: date(2026, 1, 5), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'fatura', description: 'Elektrik faturası - Ocak 2026', amount: 4800, expense_date: date(2026, 1, 12), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'vergi', description: 'KDV beyanname ödemesi - Q4 2025', amount: 25000, expense_date: date(2026, 1, 24), is_recurring: false, recurrence_period: null },
    { category: 'maas', description: 'Personel maaşları - Ocak 2026', amount: 82000, expense_date: date(2026, 1, 25), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'kira', description: 'Ofis kirası - Şubat 2026', amount: 18000, expense_date: date(2026, 2, 5), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'fatura', description: 'İnternet + Telefon - Şubat 2026', amount: 4500, expense_date: date(2026, 2, 10), is_recurring: true, recurrence_period: 'monthly' },
    { category: 'diger', description: 'Ofis mobilya yenileme', amount: 22000, expense_date: date(2026, 2, 14), is_recurring: false, recurrence_period: null },
  ];

  await knex('expenses').insert(
    expenses.map(e => ({
      tenant_id: tenantId, category: e.category, description: e.description,
      amount: e.amount, expense_date: e.expense_date, is_recurring: e.is_recurring,
      recurrence_period: e.recurrence_period, created_by: userId,
    })),
  );

  // ─── 10 Satış (farklı aylar) ──────────────────────────────
  const salesData = [
    { inv: 'S206-SAT-2025-001', cust: 0, dt: date(2025, 3, 10), sub: 84000, vat: 16800, grand: 100800, method: 'havale', items: [{ p: 0, qty: 2, price: 42000 }] },
    { inv: 'S206-SAT-2025-002', cust: 1, dt: date(2025, 4, 15), sub: 21000, vat: 4200, grand: 25200, method: 'kredi_karti', items: [{ p: 1, qty: 2, price: 10500 }] },
    { inv: 'S206-SAT-2025-003', cust: 2, dt: date(2025, 5, 20), sub: 5700, vat: 1140, grand: 6840, method: 'nakit', items: [{ p: 4, qty: 1, price: 3900 }, { p: 5, qty: 1, price: 1800 }] },
    { inv: 'S206-SAT-2025-004', cust: 3, dt: date(2025, 7, 8), sub: 12000, vat: 2400, grand: 14400, method: 'havale', items: [{ p: 2, qty: 2, price: 6000 }] },
    { inv: 'S206-SAT-2025-005', cust: 4, dt: date(2025, 8, 22), sub: 6500, vat: 1300, grand: 7800, method: 'nakit', items: [{ p: 3, qty: 10, price: 650 }] },
    { inv: 'S206-SAT-2025-006', cust: 5, dt: date(2025, 9, 14), sub: 32000, vat: 6400, grand: 38400, method: 'kredi_karti', items: [{ p: 7, qty: 10, price: 3200 }] },
    { inv: 'S206-SAT-2025-007', cust: 6, dt: date(2025, 10, 5), sub: 9600, vat: 1920, grand: 11520, method: 'havale', items: [{ p: 6, qty: 2, price: 4800 }] },
    { inv: 'S206-SAT-2025-008', cust: 7, dt: date(2025, 11, 18), sub: 10400, vat: 2080, grand: 12480, method: 'nakit', items: [{ p: 8, qty: 2, price: 5200 }] },
    { inv: 'S206-SAT-2026-001', cust: 0, dt: date(2026, 1, 12), sub: 42000, vat: 8400, grand: 50400, method: 'kredi_karti', items: [{ p: 0, qty: 1, price: 42000 }] },
    { inv: 'S206-SAT-2026-002', cust: 2, dt: date(2026, 2, 5), sub: 4800, vat: 480, grand: 5280, method: 'nakit', items: [{ p: 9, qty: 10, price: 480 }] },
  ];

  const saleIds: string[] = [];
  const allSaleItemIds: string[][] = [];

  for (const sale of salesData) {
    const [saleRecord] = await knex('sales')
      .insert({
        tenant_id: tenantId, invoice_number: sale.inv,
        customer_id: customerIds[sale.cust], warehouse_id: warehouseId,
        sale_date: sale.dt, subtotal: sale.sub, vat_total: sale.vat,
        grand_total: sale.grand, payment_method: sale.method,
        status: 'completed', include_vat: true, discount_amount: 0, discount_rate: 0,
        created_by: userId,
      })
      .returning('id');
    saleIds.push(saleRecord.id);

    const itemInserts = sale.items.map(item => ({
      tenant_id: tenantId, sale_id: saleRecord.id,
      product_id: productIds[item.p], quantity: item.qty, unit_price: item.price,
      vat_rate: productsData[item.p].vat_rate,
      vat_amount: item.price * item.qty * (productsData[item.p].vat_rate / 100),
      discount_rate: 0, line_total: item.price * item.qty,
    }));
    const inserted = await knex('sale_items').insert(itemInserts).returning('id');
    allSaleItemIds.push(inserted.map(i => i.id));
  }

  // ─── 10 İade (farklı aylar, farklı durumlar) ─────────────
  const returnsData = [
    { num: 'S206-IAD-2025-001', sale: 0, cust: 0, dt: date(2025, 3, 18), amount: 42000, vat: 8400, reason: 'Ürün arızalı geldi', status: 'completed', items: [{ p: 0, qty: 1, price: 42000, si: 0 }] },
    { num: 'S206-IAD-2025-002', sale: 2, cust: 2, dt: date(2025, 5, 28), amount: 1800, vat: 360, reason: 'Yanlış ürün gönderildi', status: 'completed', items: [{ p: 5, qty: 1, price: 1800, si: 1 }] },
    { num: 'S206-IAD-2025-003', sale: 4, cust: 4, dt: date(2025, 9, 2), amount: 1300, vat: 260, reason: 'Müşteri vazgeçti', status: 'completed', items: [{ p: 3, qty: 2, price: 650, si: 0 }] },
    { num: 'S206-IAD-2025-004', sale: 5, cust: 5, dt: date(2025, 9, 25), amount: 3200, vat: 640, reason: 'Ürün hasarlı ulaştı', status: 'completed', items: [{ p: 7, qty: 1, price: 3200, si: 0 }] },
    { num: 'S206-IAD-2025-005', sale: 3, cust: 3, dt: date(2025, 7, 20), amount: 6000, vat: 1200, reason: 'Teknik sorun', status: 'completed', items: [{ p: 2, qty: 1, price: 6000, si: 0 }] },
    { num: 'S206-IAD-2025-006', sale: 6, cust: 6, dt: date(2025, 10, 15), amount: 4800, vat: 960, reason: 'Beklentiyi karşılamadı', status: 'completed', items: [{ p: 6, qty: 1, price: 4800, si: 0 }] },
    { num: 'S206-IAD-2025-007', sale: 7, cust: 7, dt: date(2025, 11, 28), amount: 5200, vat: 1040, reason: 'Garanti kapsamında değişim', status: 'completed', items: [{ p: 8, qty: 1, price: 5200, si: 0 }] },
    { num: 'S206-IAD-2025-008', sale: 1, cust: 1, dt: date(2025, 4, 25), amount: 10500, vat: 2100, reason: 'Ekran hatası', status: 'pending', items: [{ p: 1, qty: 1, price: 10500, si: 0 }] },
    { num: 'S206-IAD-2026-001', sale: 8, cust: 0, dt: date(2026, 1, 20), amount: 42000, vat: 8400, reason: 'Performans yetersiz', status: 'pending', items: [{ p: 0, qty: 1, price: 42000, si: 0 }] },
    { num: 'S206-IAD-2026-002', sale: 9, cust: 2, dt: date(2026, 2, 12), amount: 960, vat: 96, reason: 'Yanlış ürün', status: 'cancelled', items: [{ p: 9, qty: 2, price: 480, si: 0 }] },
  ];

  for (const ret of returnsData) {
    const [returnRecord] = await knex('returns')
      .insert({
        tenant_id: tenantId, return_number: ret.num,
        sale_id: saleIds[ret.sale], customer_id: customerIds[ret.cust],
        return_date: ret.dt, total_amount: ret.amount, vat_total: ret.vat,
        reason: ret.reason, status: ret.status, created_by: userId,
      })
      .returning('id');

    await knex('return_items').insert(
      ret.items.map(item => ({
        tenant_id: tenantId, return_id: returnRecord.id,
        product_id: productIds[item.p],
        sale_item_id: allSaleItemIds[ret.sale][item.si],
        quantity: item.qty, unit_price: item.price,
        vat_amount: item.price * item.qty * (productsData[item.p].vat_rate / 100),
        line_total: item.price * item.qty,
      })),
    );
  }

  // ─── 10 Teklif (farklı aylar, farklı durumlar) ───────────
  const quotesData = [
    { num: 'S206-TEK-2025-001', cust: 0, dt: date(2025, 2, 10), valid: date(2025, 3, 10), sub: 126000, vat: 25200, grand: 151200, status: 'converted', items: [{ p: 0, qty: 3, price: 42000 }] },
    { num: 'S206-TEK-2025-002', cust: 1, dt: date(2025, 4, 5), valid: date(2025, 5, 5), sub: 31500, vat: 6300, grand: 37800, status: 'accepted', items: [{ p: 1, qty: 3, price: 10500 }] },
    { num: 'S206-TEK-2025-003', cust: 3, dt: date(2025, 6, 12), valid: date(2025, 7, 12), sub: 18000, vat: 3600, grand: 21600, status: 'rejected', items: [{ p: 2, qty: 3, price: 6000 }] },
    { num: 'S206-TEK-2025-004', cust: 4, dt: date(2025, 7, 20), valid: date(2025, 8, 20), sub: 9600, vat: 1920, grand: 11520, status: 'sent', items: [{ p: 6, qty: 2, price: 4800 }] },
    { num: 'S206-TEK-2025-005', cust: 5, dt: date(2025, 8, 8), valid: date(2025, 9, 8), sub: 19200, vat: 3840, grand: 23040, status: 'expired', items: [{ p: 7, qty: 6, price: 3200 }] },
    { num: 'S206-TEK-2025-006', cust: 6, dt: date(2025, 9, 15), valid: date(2025, 10, 15), sub: 15600, vat: 3120, grand: 18720, status: 'accepted', items: [{ p: 4, qty: 4, price: 3900 }] },
    { num: 'S206-TEK-2025-007', cust: 7, dt: date(2025, 10, 22), valid: date(2025, 11, 22), sub: 52000, vat: 10400, grand: 62400, status: 'converted', items: [{ p: 8, qty: 10, price: 5200 }] },
    { num: 'S206-TEK-2025-008', cust: 2, dt: date(2025, 12, 5), valid: date(2026, 1, 5), sub: 10800, vat: 2160, grand: 12960, status: 'sent', items: [{ p: 5, qty: 6, price: 1800 }] },
    { num: 'S206-TEK-2026-001', cust: 0, dt: date(2026, 1, 15), valid: date(2026, 2, 15), sub: 84000, vat: 16800, grand: 100800, status: 'draft', items: [{ p: 0, qty: 2, price: 42000 }] },
    { num: 'S206-TEK-2026-002', cust: 3, dt: date(2026, 2, 8), valid: date(2026, 3, 8), sub: 7200, vat: 1440, grand: 8640, status: 'draft', items: [{ p: 5, qty: 4, price: 1800 }] },
  ];

  for (const q of quotesData) {
    const convertedSaleId = q.status === 'converted' ? saleIds[0] : null;
    const [quoteRecord] = await knex('quotes')
      .insert({
        tenant_id: tenantId, quote_number: q.num,
        customer_id: customerIds[q.cust], quote_date: q.dt, valid_until: q.valid,
        subtotal: q.sub, vat_total: q.vat, grand_total: q.grand,
        status: q.status, include_vat: true, discount_amount: 0, discount_rate: 0,
        converted_sale_id: convertedSaleId, created_by: userId,
      })
      .returning('id');

    await knex('quote_items').insert(
      q.items.map(item => ({
        tenant_id: tenantId, quote_id: quoteRecord.id,
        product_id: productIds[item.p], product_name: productsData[item.p].name,
        quantity: item.qty, unit_price: item.price,
        vat_rate: productsData[item.p].vat_rate,
        vat_amount: item.price * item.qty * (productsData[item.p].vat_rate / 100),
        discount_rate: 0, line_total: item.price * item.qty,
      })),
    );
  }

  // ─── 10 Stok Transferi (farklı aylar, farklı durumlar) ────
  // Need a second warehouse
  const [wh2] = await knex('warehouses')
    .insert({ tenant_id: tenantId, name: 'Şube Depo', code: 'S206-WH02', address: 'Karşıyaka, İzmir', is_active: true, is_default: false })
    .returning('id');
  const wh2Id = wh2.id;

  const transfersData = [
    { num: 'S206-TRN-2025-001', from: warehouseId, to: wh2Id, dt: date(2025, 3, 5), status: 'completed', notes: 'Şubeye stok takviyesi', items: [{ p: 0, qty: 3 }, { p: 4, qty: 5 }] },
    { num: 'S206-TRN-2025-002', from: warehouseId, to: wh2Id, dt: date(2025, 4, 12), status: 'completed', notes: 'Aksesuar transferi', items: [{ p: 5, qty: 10 }] },
    { num: 'S206-TRN-2025-003', from: wh2Id, to: warehouseId, dt: date(2025, 5, 20), status: 'completed', notes: 'Fazla stok iadesi', items: [{ p: 3, qty: 15 }] },
    { num: 'S206-TRN-2025-004', from: warehouseId, to: wh2Id, dt: date(2025, 7, 8), status: 'completed', notes: 'Yaz dönemi stok dağıtımı', items: [{ p: 1, qty: 5 }, { p: 2, qty: 3 }] },
    { num: 'S206-TRN-2025-005', from: warehouseId, to: wh2Id, dt: date(2025, 8, 15), status: 'completed', notes: 'Sarf malzeme transferi', items: [{ p: 9, qty: 20 }] },
    { num: 'S206-TRN-2025-006', from: wh2Id, to: warehouseId, dt: date(2025, 9, 22), status: 'completed', notes: 'Konsolidasyon', items: [{ p: 7, qty: 8 }] },
    { num: 'S206-TRN-2025-007', from: warehouseId, to: wh2Id, dt: date(2025, 11, 10), status: 'completed', notes: 'Kış dönemi hazırlığı', items: [{ p: 8, qty: 4 }] },
    { num: 'S206-TRN-2026-001', from: warehouseId, to: wh2Id, dt: date(2026, 1, 8), status: 'in_transit', notes: 'Yeni yıl stok dağıtımı', items: [{ p: 0, qty: 2 }, { p: 6, qty: 3 }] },
    { num: 'S206-TRN-2026-002', from: wh2Id, to: warehouseId, dt: date(2026, 2, 3), status: 'pending', notes: 'Şubat düzenlemesi', items: [{ p: 4, qty: 6 }] },
    { num: 'S206-TRN-2026-003', from: warehouseId, to: wh2Id, dt: date(2026, 2, 15), status: 'cancelled', notes: 'İptal edilen transfer', items: [{ p: 1, qty: 4 }] },
  ];

  for (const t of transfersData) {
    const [transfer] = await knex('stock_transfers')
      .insert({
        tenant_id: tenantId, transfer_number: t.num,
        from_warehouse_id: t.from, to_warehouse_id: t.to,
        transfer_date: t.dt, status: t.status, notes: t.notes,
      })
      .returning('id');

    await knex('stock_transfer_items').insert(
      t.items.map(item => ({
        tenant_id: tenantId, transfer_id: transfer.id,
        product_id: productIds[item.p], quantity: item.qty,
      })),
    );
  }

  console.log(`✅ demo206 seed completed: 50 expenses + 10 sales + 10 returns + 10 quotes + 10 transfers for ${TENANT_EMAIL}`);
}
