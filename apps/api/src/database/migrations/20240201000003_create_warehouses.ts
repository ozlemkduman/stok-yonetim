import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Warehouses table (Depolar)
  await knex.schema.createTable('warehouses', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 100).notNullable();
    table.string('code', 20).unique().notNullable();
    table.text('address');
    table.string('phone', 20);
    table.string('manager_name', 100);
    table.boolean('is_default').defaultTo(false);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('code');
    table.index('is_active');
    table.index('is_default');
  });

  // Warehouse stocks table (Depo Stoklari)
  await knex.schema.createTable('warehouse_stocks', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('warehouse_id').notNullable().references('id').inTable('warehouses').onDelete('CASCADE');
    table.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
    table.integer('quantity').notNullable().defaultTo(0);
    table.integer('min_stock_level').defaultTo(5);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.unique(['warehouse_id', 'product_id']);
    table.index('warehouse_id');
    table.index('product_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('warehouse_stocks');
  await knex.schema.dropTableIfExists('warehouses');
}
