import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('tenants', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 255).notNullable();
    table.string('slug', 100).unique().notNullable();
    table.string('domain', 255).nullable();
    table.string('logo_url', 500).nullable();
    table.uuid('plan_id').references('id').inTable('plans').onDelete('SET NULL');
    table.jsonb('settings').defaultTo('{}');
    table.string('status', 20).defaultTo('active');
    table.timestamp('trial_ends_at').nullable();
    table.timestamp('subscription_starts_at').nullable();
    table.timestamp('subscription_ends_at').nullable();
    table.string('billing_email', 255).nullable();
    table.uuid('owner_id').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('status');
    table.index('plan_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('tenants');
}
