import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('sale_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('sale_id').notNullable().references('id').inTable('sales').onDelete('CASCADE');
    table.uuid('product_id').references('id').inTable('products').onDelete('SET NULL');
    table.integer('quantity').notNullable();
    table.decimal('unit_price', 12, 2).notNullable();
    table.decimal('discount_rate', 5, 2).defaultTo(0);
    table.decimal('vat_rate', 5, 2).defaultTo(0);
    table.decimal('vat_amount', 12, 2).defaultTo(0);
    table.decimal('line_total', 12, 2).notNullable();

    table.index('sale_id');
    table.index('product_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('sale_items');
}
