import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex('sales')
    .where('notes', 'like', '%E-Fatura import:%')
    .andWhere('invoice_issued', false)
    .update({ invoice_issued: true });
}

export async function down(knex: Knex): Promise<void> {
  // No rollback — we can't distinguish which ones were manually set
}
