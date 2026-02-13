import { Knex } from 'knex';
import * as bcrypt from 'bcrypt';

export async function seed(knex: Knex): Promise<void> {
  const email = process.env.SUPER_ADMIN_EMAIL || 'admin@stokpro.com';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'Admin123!';

  // Check if super admin already exists
  const existingAdmin = await knex('users')
    .where({ email, role: 'super_admin' })
    .first();

  if (existingAdmin) {
    console.log('Super admin already exists, skipping...');
    return;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Insert super admin user (no tenant_id for platform admin)
  await knex('users').insert({
    email,
    password_hash: passwordHash,
    name: 'Platform Admin',
    role: 'super_admin',
    permissions: JSON.stringify(['*']),
    status: 'active',
    email_verified_at: knex.fn.now(),
  });

  console.log(`Super admin created with email: ${email}`);
}
