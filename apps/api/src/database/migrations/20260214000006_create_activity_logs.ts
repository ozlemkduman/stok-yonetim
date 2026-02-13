import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('tenant_activity_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE').nullable();
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL').nullable();
    table.string('action', 100).notNullable();
    table.string('entity_type', 50).nullable();
    table.uuid('entity_id').nullable();
    table.jsonb('old_values').nullable();
    table.jsonb('new_values').nullable();
    table.string('ip_address', 45).nullable();
    table.jsonb('metadata').defaultTo('{}');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('tenant_id');
    table.index('user_id');
    table.index('action');
    table.index('entity_type');
    table.index('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('tenant_activity_logs');
}
