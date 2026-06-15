import { Knex } from 'knex';

/**
 * Tenant'a sektör (business_type) alanı ekler.
 * 'general' = standart işletme (varsayılan), 'auto_service' = oto servis.
 * Sektöre özel modüllerin (oto servis paneli vb.) görünürlüğü buna göre belirlenir.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('tenants', (table) => {
    table.string('business_type', 32).notNullable().defaultTo('general');
    table.index('business_type');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('tenants', (table) => {
    table.dropIndex('business_type');
    table.dropColumn('business_type');
  });
}
