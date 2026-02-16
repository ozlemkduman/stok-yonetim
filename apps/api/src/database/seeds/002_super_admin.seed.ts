import { Knex } from 'knex';
import * as bcrypt from 'bcrypt';

export async function seed(knex: Knex): Promise<void> {
  const email = process.env.SUPER_ADMIN_EMAIL || 'admin@stoksayac.com';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'StokSayac2026!';

  const existingAdmin = await knex('users')
    .where({ email, role: 'super_admin' })
    .first();

  if (existingAdmin) {
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await knex('users').insert({
    email,
    password_hash: passwordHash,
    name: 'Platform Admin',
    role: 'super_admin',
    permissions: JSON.stringify(['*']),
    status: 'active',
    email_verified_at: knex.fn.now(),
  });
}
