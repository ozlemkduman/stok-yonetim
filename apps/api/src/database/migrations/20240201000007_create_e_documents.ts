import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // e-Documents table (e-Belgeler)
  await knex.schema.createTable('e_documents', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('document_type', 30).notNullable(); // e_fatura, e_arsiv, e_ihracat, e_irsaliye, e_smm
    table.string('document_number', 50).unique().notNullable();
    table.string('gib_uuid', 50); // Mock GIB UUID
    table.string('reference_type', 20).notNullable(); // sale, return, waybill
    table.uuid('reference_id').notNullable();
    table.uuid('customer_id').references('id').inTable('customers').onDelete('SET NULL');
    table.timestamp('issue_date').defaultTo(knex.fn.now());
    table.decimal('amount', 12, 2).notNullable();
    table.decimal('vat_amount', 12, 2).defaultTo(0);
    table.decimal('total_amount', 12, 2).notNullable();
    table.string('status', 20).defaultTo('draft'); // draft, pending, sent, approved, rejected, cancelled
    table.string('gib_response_code', 10);
    table.text('gib_response_message');
    table.string('envelope_uuid', 50);
    table.text('xml_content'); // Mock XML
    table.string('pdf_path', 255);
    table.timestamp('sent_at');
    table.timestamp('approved_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index('document_type');
    table.index('document_number');
    table.index('gib_uuid');
    table.index('reference_type');
    table.index('reference_id');
    table.index('customer_id');
    table.index('status');
    table.index('issue_date');
  });

  // e-Document logs table (e-Belge Loglari)
  await knex.schema.createTable('e_document_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('document_id').notNullable().references('id').inTable('e_documents').onDelete('CASCADE');
    table.string('action', 30).notNullable(); // created, sent, approved, rejected, cancelled
    table.string('status_before', 20);
    table.string('status_after', 20);
    table.text('message');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('document_id');
    table.index('action');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('e_document_logs');
  await knex.schema.dropTableIfExists('e_documents');
}
