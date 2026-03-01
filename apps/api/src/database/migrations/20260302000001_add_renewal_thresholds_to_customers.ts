import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('customers', (table) => {
    table.integer('renewal_red_days').defaultTo(30);
    table.integer('renewal_yellow_days').defaultTo(60);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('customers', (table) => {
    table.dropColumn('renewal_red_days');
    table.dropColumn('renewal_yellow_days');
  });
}
