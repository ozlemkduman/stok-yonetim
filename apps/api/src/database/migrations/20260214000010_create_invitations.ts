import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('invitations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email', 255).notNullable();
    table.string('token', 255).notNullable().unique();
    table.string('role', 50).notNullable().defaultTo('user');
    table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
    table.string('tenant_name', 255); // For new tenant creation
    table.uuid('invited_by').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('expires_at').notNullable();
    table.timestamp('accepted_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index(['email']);
    table.index(['token']);
    table.index(['tenant_id']);
  });

  // Disable public registration - only invitation-based
  console.log('Invitation system created. Public registration will be disabled.');
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('invitations');
}
