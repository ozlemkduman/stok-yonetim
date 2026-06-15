import type { Knex } from 'knex';

/**
 * Oto Servis Faz 3 — iş emri parça kalemleri + harici fatura kaydı.
 * - service_order_items: iş emrinde kullanılan ürün/parça kalemleri (stoktan düşer).
 * - service_orders'a: harici portalda kesilen faturanın izi (no/tarih/tutar/dosya),
 *   parçaların düşeceği depo, stok-düşüldü bayrağı ve cari/kasa işleme izi.
 * Yasal fatura uygulama içinde ÜRETİLMEZ; sadece referansı kaydedilir.
 */
export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('service_order_items'))) {
    await knex.schema.createTable('service_order_items', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
      table.uuid('service_order_id').notNullable().references('id').inTable('service_orders').onDelete('CASCADE');
      table.uuid('product_id').notNullable().references('id').inTable('products').onDelete('RESTRICT');
      table.decimal('quantity', 12, 3).notNullable().defaultTo(1);
      table.decimal('unit_price', 12, 2).notNullable().defaultTo(0);
      table.decimal('vat_rate', 5, 2).notNullable().defaultTo(0);
      table.decimal('line_total', 12, 2).notNullable().defaultTo(0); // KDV dahil satır toplamı
      table.timestamps(true, true);

      table.index('tenant_id');
      table.index('service_order_id');
      table.index('product_id');
    });
  }

  await knex.schema.alterTable('service_orders', (table) => {
    // Harici fatura kaydı (uygulama fatura üretmez, sadece izini tutar)
    table.string('invoice_number', 50);
    table.date('invoice_date');
    table.decimal('invoice_amount', 12, 2);
    table.text('invoice_file_url');
    // Parçaların düşeceği depo (boşsa varsayılan depo kullanılır)
    table.uuid('warehouse_id').references('id').inTable('warehouses').onDelete('SET NULL');
    // Stok bu iş emri için düşüldü mü? (çift düşmeyi önler)
    table.boolean('stock_deducted').notNullable().defaultTo(false);
    // Fatura tutarı cari/kasaya nasıl işlendi? (none|veresiye|nakit|kredi_karti|havale)
    table.string('posted_payment_method', 20);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('service_orders', (table) => {
    table.dropColumn('invoice_number');
    table.dropColumn('invoice_date');
    table.dropColumn('invoice_amount');
    table.dropColumn('invoice_file_url');
    table.dropColumn('warehouse_id');
    table.dropColumn('stock_deducted');
    table.dropColumn('posted_payment_method');
  });
  await knex.schema.dropTableIfExists('service_order_items');
}
