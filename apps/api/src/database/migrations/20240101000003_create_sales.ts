import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('sales'))) {
    await knex.schema.createTable('sales', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('invoice_number', 50).unique().notNullable();
      table.uuid('customer_id').references('id').inTable('customers').onDelete('SET NULL');
      table.timestamp('sale_date').notNullable().defaultTo(knex.fn.now());
      table.decimal('subtotal', 12, 2).defaultTo(0);
      table.decimal('discount_amount', 12, 2).defaultTo(0);
      table.decimal('discount_rate', 5, 2).defaultTo(0);
      table.decimal('vat_total', 12, 2).defaultTo(0);
      table.decimal('grand_total', 12, 2).notNullable();
      table.boolean('include_vat').defaultTo(true);
      table.string('payment_method', 20).notNullable();
      table.date('due_date');
      table.string('status', 20).defaultTo('completed');
      table.text('notes');
      table.timestamps(true, true);

      table.index('invoice_number');
      table.index('customer_id');
      table.index('sale_date');
      table.index('status');
      table.index('payment_method');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('sales');
}
