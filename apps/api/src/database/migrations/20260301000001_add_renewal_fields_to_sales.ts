import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('sales', (table) => {
    table.boolean('has_renewal').defaultTo(false);
    table.date('renewal_date').nullable();
    table.integer('reminder_days_before').defaultTo(30);
    table.text('reminder_note').nullable();

    table.index('renewal_date');
    table.index('has_renewal');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('sales', (table) => {
    table.dropIndex('renewal_date');
    table.dropIndex('has_renewal');
    table.dropColumn('has_renewal');
    table.dropColumn('renewal_date');
    table.dropColumn('reminder_days_before');
    table.dropColumn('reminder_note');
  });
}
