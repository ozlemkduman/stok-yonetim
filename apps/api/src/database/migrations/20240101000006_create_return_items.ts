import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('return_items'))) {
    await knex.schema.createTable('return_items', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('return_id').notNullable().references('id').inTable('returns').onDelete('CASCADE');
      table.uuid('product_id').references('id').inTable('products').onDelete('SET NULL');
      table.uuid('sale_item_id').references('id').inTable('sale_items').onDelete('SET NULL');
      table.integer('quantity').notNullable();
      table.decimal('unit_price', 12, 2).notNullable();
      table.decimal('vat_amount', 12, 2).defaultTo(0);
      table.decimal('line_total', 12, 2).notNullable();

      table.index('return_id');
      table.index('product_id');
      table.index('sale_item_id');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('return_items');
}
