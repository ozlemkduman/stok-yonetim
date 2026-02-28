import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Stock transfers table (Stok Transferleri)
  if (!(await knex.schema.hasTable('stock_transfers'))) {
    await knex.schema.createTable('stock_transfers', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('transfer_number', 50).unique().notNullable();
      table.uuid('from_warehouse_id').notNullable().references('id').inTable('warehouses');
      table.uuid('to_warehouse_id').notNullable().references('id').inTable('warehouses');
      table.timestamp('transfer_date').defaultTo(knex.fn.now());
      table.string('status', 20).defaultTo('pending'); // pending, in_transit, completed, cancelled
      table.text('notes');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.index('transfer_number');
      table.index('from_warehouse_id');
      table.index('to_warehouse_id');
      table.index('status');
      table.index('transfer_date');
    });
  }

  // Stock transfer items (Transfer Kalemleri)
  if (!(await knex.schema.hasTable('stock_transfer_items'))) {
    await knex.schema.createTable('stock_transfer_items', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('transfer_id').notNullable().references('id').inTable('stock_transfers').onDelete('CASCADE');
      table.uuid('product_id').notNullable().references('id').inTable('products');
      table.integer('quantity').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());

      table.index('transfer_id');
      table.index('product_id');
    });
  }

  // Stock movements table (Stok Hareketleri)
  if (!(await knex.schema.hasTable('stock_movements'))) {
    await knex.schema.createTable('stock_movements', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('warehouse_id').notNullable().references('id').inTable('warehouses');
      table.uuid('product_id').notNullable().references('id').inTable('products');
      table.string('movement_type', 20).notNullable(); // sale, return, transfer_in, transfer_out, adjustment, purchase
      table.integer('quantity').notNullable();
      table.integer('stock_after').notNullable();
      table.string('reference_type', 20); // sale, return, transfer, adjustment
      table.uuid('reference_id');
      table.text('notes');
      table.timestamp('movement_date').defaultTo(knex.fn.now());
      table.timestamp('created_at').defaultTo(knex.fn.now());

      table.index('warehouse_id');
      table.index('product_id');
      table.index('movement_type');
      table.index('reference_type');
      table.index('movement_date');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('stock_movements');
  await knex.schema.dropTableIfExists('stock_transfer_items');
  await knex.schema.dropTableIfExists('stock_transfers');
}
