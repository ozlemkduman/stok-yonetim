import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

  await knex.schema.createTable('customers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 255).notNullable();
    table.string('phone', 20);
    table.string('email', 255);
    table.text('address');
    table.string('tax_number', 20);
    table.string('tax_office', 100);
    table.decimal('balance', 12, 2).defaultTo(0);
    table.text('notes');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);

    table.index('name');
    table.index('phone');
    table.index('is_active');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('customers');
}
