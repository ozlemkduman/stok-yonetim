import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('payments'))) {
    await knex.schema.createTable('payments', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('customer_id').notNullable().references('id').inTable('customers').onDelete('CASCADE');
      table.uuid('sale_id').references('id').inTable('sales').onDelete('SET NULL');
      table.timestamp('payment_date').notNullable().defaultTo(knex.fn.now());
      table.decimal('amount', 12, 2).notNullable();
      table.string('method', 20).notNullable();
      table.text('notes');
      table.timestamp('created_at').defaultTo(knex.fn.now());

      table.index('customer_id');
      table.index('sale_id');
      table.index('payment_date');
      table.index('method');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('payments');
}
