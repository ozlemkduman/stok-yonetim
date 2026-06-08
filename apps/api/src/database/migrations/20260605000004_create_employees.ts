import type { Knex } from 'knex';

/**
 * Çalışanlar tablosu — basit referans kartı + opsiyonel kullanıcı bağlantısı +
 * satış komisyonu oranı. HR/bordro modülü değil, KOBİ için temel ihtiyaç.
 */
export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('employees'))) {
    await knex.schema.createTable('employees', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');
      table.string('name', 255).notNullable();
      table.string('email', 255);
      table.string('phone', 50);
      table.string('position', 100); // Pozisyon: Satış, Kasiyer, Muhasebe vb.
      table.date('hire_date');
      table.decimal('salary', 12, 2);
      table.decimal('commission_rate', 5, 2).defaultTo(0); // Satış komisyon yüzdesi
      // Opsiyonel: bu çalışan sisteme login olan bir user mı?
      table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
      table.text('notes');
      table.boolean('is_active').defaultTo(true);
      table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
      table.timestamps(true, true);

      table.index('tenant_id');
      table.index('is_active');
      table.index('name');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('employees');
}
