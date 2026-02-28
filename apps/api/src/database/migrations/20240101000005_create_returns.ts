import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('returns'))) {
    await knex.schema.createTable('returns', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('return_number', 50).unique().notNullable();
      table.uuid('sale_id').references('id').inTable('sales').onDelete('SET NULL');
      table.uuid('customer_id').references('id').inTable('customers').onDelete('SET NULL');
      table.timestamp('return_date').notNullable().defaultTo(knex.fn.now());
      table.decimal('total_amount', 12, 2).notNullable();
      table.decimal('vat_total', 12, 2).defaultTo(0);
      table.text('reason');
      table.string('status', 20).defaultTo('completed');
      table.timestamps(true, true);

      table.index('return_number');
      table.index('sale_id');
      table.index('customer_id');
      table.index('return_date');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('returns');
}
