import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Accounts table (Kasa/Banka Hesaplari)
  if (!(await knex.schema.hasTable('accounts'))) {
    await knex.schema.createTable('accounts', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('name', 100).notNullable();
      table.string('account_type', 20).notNullable(); // kasa, banka
      table.string('bank_name', 100);
      table.string('iban', 34);
      table.string('account_number', 50);
      table.string('branch_name', 100);
      table.string('currency', 3).defaultTo('TRY');
      table.decimal('opening_balance', 12, 2).defaultTo(0);
      table.decimal('current_balance', 12, 2).defaultTo(0);
      table.boolean('is_default').defaultTo(false);
      table.boolean('is_active').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());

      table.index('account_type');
      table.index('is_active');
      table.index('is_default');
    });
  }

  // Account movements table (Hesap Hareketleri)
  if (!(await knex.schema.hasTable('account_movements'))) {
    await knex.schema.createTable('account_movements', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('account_id').notNullable().references('id').inTable('accounts').onDelete('CASCADE');
      table.string('movement_type', 20).notNullable(); // gelir, gider, transfer_in, transfer_out
      table.decimal('amount', 12, 2).notNullable();
      table.decimal('balance_after', 12, 2).notNullable();
      table.string('category', 50);
      table.text('description');
      table.string('reference_type', 20); // sale, expense, payment, transfer
      table.uuid('reference_id');
      table.timestamp('movement_date').defaultTo(knex.fn.now());
      table.timestamp('created_at').defaultTo(knex.fn.now());

      table.index('account_id');
      table.index('movement_type');
      table.index('reference_type');
      table.index('movement_date');
    });
  }

  // Account transfers table (Hesaplar Arasi Transferler)
  if (!(await knex.schema.hasTable('account_transfers'))) {
    await knex.schema.createTable('account_transfers', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('from_account_id').notNullable().references('id').inTable('accounts');
      table.uuid('to_account_id').notNullable().references('id').inTable('accounts');
      table.decimal('amount', 12, 2).notNullable();
      table.text('description');
      table.timestamp('transfer_date').defaultTo(knex.fn.now());
      table.timestamp('created_at').defaultTo(knex.fn.now());

      table.index('from_account_id');
      table.index('to_account_id');
      table.index('transfer_date');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('account_transfers');
  await knex.schema.dropTableIfExists('account_movements');
  await knex.schema.dropTableIfExists('accounts');
}
