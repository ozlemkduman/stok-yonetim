import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('sales', (table) => {
    table.string('sale_type', 20).defaultTo('retail');
    table.index('sale_type');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('sales', (table) => {
    table.dropIndex('sale_type');
    table.dropColumn('sale_type');
  });
}
