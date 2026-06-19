import type { Knex } from 'knex';

/**
 * service_orders.order_number'a tenant-scoped unique ekle.
 * İş emri numarası üreticisi (generateOrderNumber) tenant bazında IE{YYYY}{MM}{NNNN}
 * sayar; ancak tabloda hiçbir unique kısıt yoktu — eşzamanlı/yarışan oluşturmada
 * mükerrer iş emri numarası üretilebiliyordu. Diğer belge numaralarıyla
 * (sales/returns/quotes/e_documents — 20260617000002) tutarlı hale getirilir.
 *
 * Global değil tenant-scoped: numara tenant bazında üretildiğinden iki tenant'ın
 * aynı numarayı taşıması meşru.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('service_orders', (table) => {
    table.unique(['tenant_id', 'order_number']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('service_orders', (table) => {
    table.dropUnique(['tenant_id', 'order_number']);
  });
}
