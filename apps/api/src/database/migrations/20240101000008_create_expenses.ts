import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('expenses'))) {
    await knex.schema.createTable('expenses', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('category', 50).notNullable();
      table.text('description');
      table.decimal('amount', 12, 2).notNullable();
      table.date('expense_date').notNullable();
      table.boolean('is_recurring').defaultTo(false);
      table.string('recurrence_period', 20);
      table.timestamps(true, true);

      table.index('category');
      table.index('expense_date');
      table.index('is_recurring');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('expenses');
}
