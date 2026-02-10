import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Integrations table
  await knex.schema.createTable('integrations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name').notNullable();
    table.enum('type', ['e_commerce', 'bank', 'payment', 'crm', 'other']).notNullable();
    table.enum('provider', [
      'trendyol', 'hepsiburada', 'n11', 'amazon', 'gittigidiyor',
      'akbank', 'isbank', 'garanti', 'yapikredi', 'ziraat',
      'iyzico', 'paytr', 'payu', 'stripe',
      'salesforce', 'hubspot', 'zoho',
      'custom'
    ]).notNullable();
    table.enum('status', ['active', 'inactive', 'error']).defaultTo('inactive');
    table.jsonb('config').defaultTo('{}');
    table.jsonb('credentials').defaultTo('{}');
    table.timestamp('last_sync_at').nullable();
    table.string('last_error').nullable();
    table.timestamps(true, true);
  });

  // Integration logs table
  await knex.schema.createTable('integration_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('integration_id').notNullable().references('id').inTable('integrations').onDelete('CASCADE');
    table.enum('action', ['sync', 'push', 'pull', 'webhook', 'error']).notNullable();
    table.enum('status', ['started', 'success', 'failed']).notNullable();
    table.text('message').nullable();
    table.jsonb('details').defaultTo('{}');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });

  // E-commerce orders table
  await knex.schema.createTable('e_commerce_orders', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('integration_id').notNullable().references('id').inTable('integrations').onDelete('CASCADE');
    table.string('external_order_id').notNullable();
    table.string('external_order_number').nullable();
    table.uuid('sale_id').nullable().references('id').inTable('sales').onDelete('SET NULL');
    table.enum('status', ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned']).defaultTo('pending');
    table.enum('sync_status', ['pending', 'synced', 'error']).defaultTo('pending');
    table.string('customer_name').nullable();
    table.string('customer_email').nullable();
    table.string('customer_phone').nullable();
    table.text('shipping_address').nullable();
    table.decimal('subtotal', 12, 2).notNullable().defaultTo(0);
    table.decimal('shipping_cost', 12, 2).notNullable().defaultTo(0);
    table.decimal('commission', 12, 2).notNullable().defaultTo(0);
    table.decimal('total', 12, 2).notNullable().defaultTo(0);
    table.string('currency', 3).defaultTo('TRY');
    table.jsonb('items').defaultTo('[]');
    table.jsonb('raw_data').defaultTo('{}');
    table.timestamp('order_date').notNullable();
    table.timestamps(true, true);
    table.unique(['integration_id', 'external_order_id']);
  });

  // Bank statements table
  await knex.schema.createTable('bank_statements', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('integration_id').notNullable().references('id').inTable('integrations').onDelete('CASCADE');
    table.uuid('account_id').nullable().references('id').inTable('accounts').onDelete('SET NULL');
    table.string('external_id').nullable();
    table.date('transaction_date').notNullable();
    table.date('value_date').nullable();
    table.text('description').nullable();
    table.enum('type', ['credit', 'debit']).notNullable();
    table.decimal('amount', 12, 2).notNullable();
    table.decimal('balance', 12, 2).nullable();
    table.string('currency', 3).defaultTo('TRY');
    table.string('reference').nullable();
    table.enum('match_status', ['unmatched', 'matched', 'ignored']).defaultTo('unmatched');
    table.uuid('matched_movement_id').nullable().references('id').inTable('account_movements').onDelete('SET NULL');
    table.jsonb('raw_data').defaultTo('{}');
    table.timestamps(true, true);
  });

  // Indexes
  await knex.schema.raw('CREATE INDEX idx_integration_logs_integration ON integration_logs(integration_id)');
  await knex.schema.raw('CREATE INDEX idx_e_commerce_orders_integration ON e_commerce_orders(integration_id)');
  await knex.schema.raw('CREATE INDEX idx_e_commerce_orders_status ON e_commerce_orders(status)');
  await knex.schema.raw('CREATE INDEX idx_bank_statements_integration ON bank_statements(integration_id)');
  await knex.schema.raw('CREATE INDEX idx_bank_statements_match_status ON bank_statements(match_status)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('bank_statements');
  await knex.schema.dropTableIfExists('e_commerce_orders');
  await knex.schema.dropTableIfExists('integration_logs');
  await knex.schema.dropTableIfExists('integrations');
}
