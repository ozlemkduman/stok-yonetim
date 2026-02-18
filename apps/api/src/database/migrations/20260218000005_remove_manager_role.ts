import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Convert existing managers to user role
  await knex('users').where('role', 'manager').update({ role: 'user' });

  // Give all users with empty permissions the wildcard permission
  await knex('users')
    .whereRaw("permissions = '[]'")
    .update({ permissions: JSON.stringify(['*']) });
}

export async function down(knex: Knex): Promise<void> {
  // No reliable way to revert - managers are now users
}
