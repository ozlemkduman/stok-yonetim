import type { Knex } from 'knex';

/**
 * CRITICAL: Change CASCADE DELETE to RESTRICT on financial tables.
 * Prevents accidental data loss when a customer record is deleted.
 * Financial records (payments, account_transactions) must NEVER be deleted.
 */
export async function up(knex: Knex): Promise<void> {
  // Fix payments.customer_id: CASCADE -> RESTRICT
  await knex.schema.alterTable('payments', (table) => {
    table.dropForeign(['customer_id']);
    table
      .uuid('customer_id')
      .notNullable()
      .references('id')
      .inTable('customers')
      .onDelete('RESTRICT')
      .alter();
  });

  // Fix account_transactions.customer_id: CASCADE -> RESTRICT
  await knex.schema.alterTable('account_transactions', (table) => {
    table.dropForeign(['customer_id']);
    table
      .uuid('customer_id')
      .notNullable()
      .references('id')
      .inTable('customers')
      .onDelete('RESTRICT')
      .alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  // Revert to CASCADE (not recommended)
  await knex.schema.alterTable('payments', (table) => {
    table.dropForeign(['customer_id']);
    table
      .uuid('customer_id')
      .notNullable()
      .references('id')
      .inTable('customers')
      .onDelete('CASCADE')
      .alter();
  });

  await knex.schema.alterTable('account_transactions', (table) => {
    table.dropForeign(['customer_id']);
    table
      .uuid('customer_id')
      .notNullable()
      .references('id')
      .inTable('customers')
      .onDelete('CASCADE')
      .alter();
  });
}
