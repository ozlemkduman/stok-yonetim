import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Quotes table (Teklifler)
  if (!(await knex.schema.hasTable('quotes'))) {
    await knex.schema.createTable('quotes', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('quote_number', 50).unique().notNullable();
      table.uuid('customer_id').references('id').inTable('customers').onDelete('SET NULL');
      table.timestamp('quote_date').defaultTo(knex.fn.now());
      table.date('valid_until').notNullable();
      table.decimal('subtotal', 12, 2).defaultTo(0);
      table.decimal('discount_amount', 12, 2).defaultTo(0);
      table.decimal('discount_rate', 5, 2).defaultTo(0);
      table.decimal('vat_total', 12, 2).defaultTo(0);
      table.decimal('grand_total', 12, 2).notNullable();
      table.boolean('include_vat').defaultTo(true);
      table.string('status', 20).defaultTo('draft'); // draft, sent, accepted, rejected, expired, converted
      table.uuid('converted_sale_id').references('id').inTable('sales').onDelete('SET NULL');
      table.text('notes');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.index('quote_number');
      table.index('customer_id');
      table.index('status');
      table.index('quote_date');
      table.index('valid_until');
    });
  }

  // Quote items table (Teklif Kalemleri)
  if (!(await knex.schema.hasTable('quote_items'))) {
    await knex.schema.createTable('quote_items', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('quote_id').notNullable().references('id').inTable('quotes').onDelete('CASCADE');
      table.uuid('product_id').references('id').inTable('products').onDelete('SET NULL');
      table.string('product_name', 255).notNullable();
      table.integer('quantity').notNullable();
      table.decimal('unit_price', 12, 2).notNullable();
      table.decimal('discount_rate', 5, 2).defaultTo(0);
      table.decimal('vat_rate', 5, 2).defaultTo(0);
      table.decimal('vat_amount', 12, 2).defaultTo(0);
      table.decimal('line_total', 12, 2).notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());

      table.index('quote_id');
      table.index('product_id');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('quote_items');
  await knex.schema.dropTableIfExists('quotes');
}
