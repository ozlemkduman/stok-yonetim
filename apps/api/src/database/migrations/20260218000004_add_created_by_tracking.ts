import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const tables = ['products', 'customers', 'returns', 'expenses', 'quotes'];

  for (const table of tables) {
    await knex.schema.alterTable(table, (t) => {
      t.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
      t.index('created_by');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  const tables = ['products', 'customers', 'returns', 'expenses', 'quotes'];

  for (const table of tables) {
    await knex.schema.alterTable(table, (t) => {
      t.dropColumn('created_by');
    });
  }
}
