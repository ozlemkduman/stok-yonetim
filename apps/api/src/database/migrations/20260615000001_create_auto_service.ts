import type { Knex } from 'knex';

/**
 * Oto Servis modülü Faz 1 tabloları.
 * Yalnızca business_type='auto_service' tenant'larda kullanılır (SectorGuard).
 * - vehicles: araç kartı (plaka, marka/model, opsiyonel müşteri sahibi)
 * - service_orders: iş emri (araca bağlı; şikayet/tespit + işçilik/parça maliyeti).
 *   Bir aracın servis geçmişi = o araca ait service_orders listesi.
 */
export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('vehicles'))) {
    await knex.schema.createTable('vehicles', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
      // Araç sahibi (opsiyonel — plakayla da kayıt açılabilir)
      table.uuid('customer_id').references('id').inTable('customers').onDelete('SET NULL');
      table.string('plate', 20).notNullable(); // Plaka
      table.string('brand', 100); // Marka
      table.string('model', 100);
      table.integer('model_year'); // Model yılı
      table.string('vin', 50); // Şasi no
      table.string('engine_no', 50); // Motor no
      table.string('color', 50);
      table.string('fuel_type', 20); // benzin | dizel | lpg | elektrik | hibrit
      table.integer('mileage'); // Güncel km
      table.text('notes');
      table.boolean('is_active').defaultTo(true);
      table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
      table.timestamps(true, true);

      table.index('tenant_id');
      table.index('plate');
      table.index('customer_id');
      table.index('is_active');
    });
  }

  if (!(await knex.schema.hasTable('service_orders'))) {
    await knex.schema.createTable('service_orders', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
      table.string('order_number', 30).notNullable(); // İş emri no (tenant-scoped)
      // Araç silinemez (RESTRICT) — geçmiş korunur
      table.uuid('vehicle_id').notNullable().references('id').inTable('vehicles').onDelete('RESTRICT');
      table.uuid('customer_id').references('id').inTable('customers').onDelete('SET NULL');
      // İlgilenen usta/personel (opsiyonel)
      table.uuid('assigned_employee_id').references('id').inTable('employees').onDelete('SET NULL');
      table.string('status', 20).notNullable().defaultTo('open'); // open|in_progress|completed|delivered|cancelled
      table.integer('mileage_in'); // Giriş km
      table.text('complaint'); // Müşteri şikayeti
      table.text('diagnosis'); // Tespit / yapılan işlemler
      table.decimal('labor_cost', 12, 2).defaultTo(0); // İşçilik
      table.decimal('parts_cost', 12, 2).defaultTo(0); // Parça
      table.decimal('discount', 12, 2).defaultTo(0);
      table.decimal('total_amount', 12, 2).defaultTo(0); // İşçilik + parça - indirim
      table.timestamp('opened_at').defaultTo(knex.fn.now());
      table.timestamp('completed_at');
      table.timestamp('delivered_at');
      table.text('notes');
      table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
      table.timestamps(true, true);

      table.index('tenant_id');
      table.index('vehicle_id');
      table.index('status');
      table.index('order_number');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('service_orders');
  await knex.schema.dropTableIfExists('vehicles');
}
