import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('tenant_invoices', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE').notNullable();
    table.string('invoice_number', 50).unique().notNullable();
    table.date('period_start').nullable();
    table.date('period_end').nullable();
    table.uuid('plan_id').references('id').inTable('plans').onDelete('SET NULL').nullable();
    table.decimal('amount', 12, 2).nullable();
    table.decimal('tax_amount', 12, 2).nullable();
    table.decimal('total_amount', 12, 2).nullable();
    table.string('status', 20).defaultTo('pending');
    table.date('due_date').nullable();
    table.timestamp('paid_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('tenant_id');
    table.index('status');
    table.index('due_date');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('tenant_invoices');
}
