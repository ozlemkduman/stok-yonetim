import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE').nullable();
    table.string('email', 255).notNullable();
    table.string('password_hash', 255).notNullable();
    table.string('name', 255).notNullable();
    table.string('phone', 20).nullable();
    table.string('avatar_url', 500).nullable();
    table.string('role', 50).notNullable().defaultTo('user');
    table.jsonb('permissions').defaultTo('[]');
    table.string('status', 20).defaultTo('active');
    table.timestamp('email_verified_at').nullable();
    table.timestamp('last_login_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.unique(['tenant_id', 'email']);
    table.index('email');
    table.index('tenant_id');
    table.index('role');
    table.index('status');
  });

  // Add foreign key for tenant owner
  await knex.schema.alterTable('tenants', (table) => {
    table.foreign('owner_id').references('id').inTable('users').onDelete('SET NULL');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('tenants', (table) => {
    table.dropForeign(['owner_id']);
  });
  await knex.schema.dropTableIfExists('users');
}
