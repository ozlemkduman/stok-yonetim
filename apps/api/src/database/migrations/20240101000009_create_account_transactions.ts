import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('account_transactions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('customer_id').notNullable().references('id').inTable('customers').onDelete('CASCADE');
    table.string('type', 20).notNullable(); // borc / alacak
    table.decimal('amount', 12, 2).notNullable();
    table.text('description');
    table.string('reference_type', 20); // sale / return / payment
    table.uuid('reference_id');
    table.timestamp('transaction_date').notNullable().defaultTo(knex.fn.now());
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('customer_id');
    table.index('type');
    table.index('reference_type');
    table.index('transaction_date');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('account_transactions');
}
