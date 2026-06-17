import type { Knex } from 'knex';

/**
 * İş belgesi numaralarını global unique'ten tenant-scoped unique'e çek.
 * sales.invoice_number, returns.return_number, quotes.quote_number,
 * e_documents.document_number üreticileri tenant bazında sayar; ancak unique
 * constraint global olduğundan iki tenant aynı N'inci numarayı üretince DB hatası
 * (500) oluşur — satış/iade/teklif/e-belge oluşturma kırılır.
 *
 * products.barcode, purchases.purchase_number, stock_transfers.transfer_number,
 * warehouses.code ile aynı düzeltme. (plans.code ve tenant_invoices.invoice_number
 * platform seviyesi olduğundan kasıtlı global; dokunulmaz.)
 */
const FIXES: Array<{ table: string; constraint: string; column: string }> = [
  { table: 'sales', constraint: 'sales_invoice_number_unique', column: 'invoice_number' },
  { table: 'returns', constraint: 'returns_return_number_unique', column: 'return_number' },
  { table: 'quotes', constraint: 'quotes_quote_number_unique', column: 'quote_number' },
  { table: 'e_documents', constraint: 'e_documents_document_number_unique', column: 'document_number' },
];

export async function up(knex: Knex): Promise<void> {
  for (const f of FIXES) {
    await knex.raw(`ALTER TABLE ${f.table} DROP CONSTRAINT IF EXISTS ${f.constraint}`);
    await knex.schema.alterTable(f.table, (table) => {
      table.unique(['tenant_id', f.column]);
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  for (const f of FIXES) {
    await knex.schema.alterTable(f.table, (table) => {
      table.dropUnique(['tenant_id', f.column]);
    });
    // Global unique'i geri eklemek tehlikeli (artık tenant'lar arası duplicate olabilir) — eklenmez.
  }
}
