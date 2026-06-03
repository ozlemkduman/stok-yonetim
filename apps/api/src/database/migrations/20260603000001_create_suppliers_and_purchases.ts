import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // suppliers — tedarikçiler (customers ile aynı şema kalıpı; cari balance: negatif = bizim borcumuz)
  if (!(await knex.schema.hasTable('suppliers'))) {
    await knex.schema.createTable('suppliers', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
      table.string('name', 255).notNullable();
      table.string('phone', 50);
      table.string('email', 255);
      table.text('address');
      table.string('tax_number', 50);
      table.string('tax_office', 100);
      table.decimal('balance', 14, 2).defaultTo(0); // negatif = biz tedarikçiye borçluyuz
      table.text('notes');
      table.boolean('is_active').defaultTo(true);
      table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
      table.timestamps(true, true);

      table.index('tenant_id');
      table.index('name');
      table.index('is_active');
    });
  }

  // purchases — alış faturaları
  if (!(await knex.schema.hasTable('purchases'))) {
    await knex.schema.createTable('purchases', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
      table.string('purchase_number', 50).notNullable();
      table.uuid('supplier_id').references('id').inTable('suppliers').onDelete('SET NULL');
      table.uuid('warehouse_id').references('id').inTable('warehouses').onDelete('SET NULL');
      table.timestamp('purchase_date').notNullable().defaultTo(knex.fn.now());
      table.decimal('subtotal', 14, 2).defaultTo(0);
      table.decimal('discount_amount', 14, 2).defaultTo(0);
      table.decimal('discount_rate', 5, 2).defaultTo(0);
      table.decimal('vat_total', 14, 2).defaultTo(0);
      table.decimal('grand_total', 14, 2).notNullable();
      table.boolean('include_vat').defaultTo(true);
      table.string('payment_method', 20).notNullable(); // nakit / kredi_karti / havale / veresiye
      table.date('due_date');
      table.string('status', 20).defaultTo('completed'); // completed / cancelled
      table.string('supplier_invoice_no', 100); // tedarikçinin orijinal fatura no'su
      table.text('notes');
      table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
      table.timestamps(true, true);

      table.unique(['tenant_id', 'purchase_number']);
      table.index('tenant_id');
      table.index('supplier_id');
      table.index('purchase_date');
      table.index('status');
    });
  }

  // purchase_items
  if (!(await knex.schema.hasTable('purchase_items'))) {
    await knex.schema.createTable('purchase_items', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
      table.uuid('purchase_id').notNullable().references('id').inTable('purchases').onDelete('CASCADE');
      table.uuid('product_id').references('id').inTable('products').onDelete('SET NULL');
      table.decimal('quantity', 14, 3).notNullable();
      table.decimal('unit_price', 14, 2).notNullable();
      table.decimal('discount_rate', 5, 2).defaultTo(0);
      table.decimal('vat_rate', 5, 2).defaultTo(0);
      table.decimal('vat_amount', 14, 2).defaultTo(0);
      table.decimal('line_total', 14, 2).notNullable();
      table.timestamps(true, true);

      table.index('purchase_id');
      table.index('product_id');
      table.index('tenant_id');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('purchase_items');
  await knex.schema.dropTableIfExists('purchases');
  await knex.schema.dropTableIfExists('suppliers');
}
