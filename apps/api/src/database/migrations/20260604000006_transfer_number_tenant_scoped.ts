import type { Knex } from 'knex';

/**
 * stock_transfers.transfer_number globally unique idi — barkod sorununun
 * aynısı. Tenant A "TR001" alırsa Tenant B alamıyordu. (tenant_id, transfer_number)
 * composite unique'e çek.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.raw('ALTER TABLE stock_transfers DROP CONSTRAINT IF EXISTS stock_transfers_transfer_number_unique');
  await knex.schema.alterTable('stock_transfers', (table) => {
    table.unique(['tenant_id', 'transfer_number']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('stock_transfers', (table) => {
    table.dropUnique(['tenant_id', 'transfer_number']);
  });
}
