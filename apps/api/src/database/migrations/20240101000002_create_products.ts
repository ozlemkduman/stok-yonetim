import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('products'))) {
    await knex.schema.createTable('products', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('name', 255).notNullable();
      table.string('barcode', 50).unique();
      table.string('category', 100);
      table.string('unit', 20).defaultTo('adet');
      table.decimal('purchase_price', 12, 2).notNullable();
      table.decimal('sale_price', 12, 2).notNullable();
      table.decimal('vat_rate', 5, 2).defaultTo(20);
      table.integer('stock_quantity').defaultTo(0);
      table.integer('min_stock_level').defaultTo(5);
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);

      table.index('name');
      table.index('barcode');
      table.index('category');
      table.index('is_active');
      table.index('stock_quantity');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('products');
}
