import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('products', (table) => {
    table.decimal('purchase_price', 15, 6).notNullable().alter();
    table.decimal('sale_price', 15, 6).notNullable().alter();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('products', (table) => {
    table.decimal('purchase_price', 12, 2).notNullable().alter();
    table.decimal('sale_price', 12, 2).notNullable().alter();
  });
}
