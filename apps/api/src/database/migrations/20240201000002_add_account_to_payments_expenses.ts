import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add account_id to payments table
  await knex.schema.alterTable('payments', (table) => {
    table.uuid('account_id').references('id').inTable('accounts').onDelete('SET NULL');
    table.index('account_id');
  });

  // Add account_id to expenses table
  await knex.schema.alterTable('expenses', (table) => {
    table.uuid('account_id').references('id').inTable('accounts').onDelete('SET NULL');
    table.index('account_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('payments', (table) => {
    table.dropColumn('account_id');
  });

  await knex.schema.alterTable('expenses', (table) => {
    table.dropColumn('account_id');
  });
}
