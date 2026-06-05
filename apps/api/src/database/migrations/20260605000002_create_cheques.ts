import type { Knex } from 'knex';

/**
 * Çek/Senet modülü:
 * Vadeli ödeme aracı takibi. Çek (cek) ve Senet (senet) aynı tabloda 'type' ile ayrılır.
 *
 * Akış:
 * - Yeni kayıt: portföye girer (in_portfolio). Henüz kasa/cari etkisi YOK.
 * - 'collected' / 'cashed_out': seçilen hesaba (account_id) gelir/gider hareketi yazılır.
 * - 'bounced' / 'returned': sadece status değişimi (bilgi amaçlı).
 *
 * Cari hesap etkisini userin manual yönetmesi gerekir (veresiye satış zaten cariyi
 * borçlandırıyor; çek tahsil edilince ayrı bir tahsilat fişi kesilebilir).
 */
export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('cheques'))) {
    await knex.schema.createTable('cheques', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('tenant_id').references('id').inTable('tenants').onDelete('CASCADE');

      // Tip + yön
      table.string('type', 10).notNullable(); // cek / senet
      table.string('direction', 10).notNullable(); // incoming (alınan) / outgoing (verilen)

      // Belge bilgileri
      table.string('cheque_number', 50); // çek/senet üzerindeki numara (kullanıcı el girişi)
      table.string('bank_name', 100); // genelde çek için
      table.string('drawer_name', 255); // keşideci (çeki imzalayan kişi/firma)

      // Karşı taraf — birinden NULL olmayan birinin set edilmesi beklenir
      table.uuid('customer_id').references('id').inTable('customers').onDelete('SET NULL');
      table.uuid('supplier_id').references('id').inTable('suppliers').onDelete('SET NULL');

      // Tutar + tarihler
      table.decimal('amount', 14, 2).notNullable();
      table.date('issue_date'); // düzenleme tarihi (opsiyonel)
      table.date('due_date').notNullable(); // vade

      // Durum
      table.string('status', 20).notNullable().defaultTo('in_portfolio');
      // in_portfolio / collected / cashed_out / bounced / returned

      // Status değişiminde kullanılan hesap
      table.uuid('account_id').references('id').inTable('accounts').onDelete('SET NULL');
      table.timestamp('status_changed_at');

      table.text('notes');
      table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
      table.timestamps(true, true);

      table.index('tenant_id');
      table.index('status');
      table.index('due_date');
      table.index('type');
      table.index('direction');
      table.index('customer_id');
      table.index('supplier_id');
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('cheques');
}
