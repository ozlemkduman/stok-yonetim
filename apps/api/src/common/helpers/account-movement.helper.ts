import { Knex } from 'knex';

// Hangi ödeme yöntemi hangi hesap türüne aktarılır?
export function accountTypeForPayment(method: string): 'kasa' | 'banka' | null {
  if (method === 'nakit') return 'kasa';
  if (method === 'kredi_karti' || method === 'havale') return 'banka';
  return null; // veresiye ve bilinmeyen → hesap hareketi yok
}

/**
 * Tenant'ın ilgili türdeki default (veya ilk aktif) hesabına gelir/gider hareketi ekler ve
 * accounts.current_balance'i günceller. Uygun hesap yoksa sessizce atlanır (işlemi bloklamaz).
 *
 * direction:  1 = gelir (satış)
 *            -1 = gider (satış iptali, ters hareket)
 */
export async function recordSaleAccountMovement(
  trx: Knex.Transaction,
  tenantId: string,
  paymentMethod: string,
  amount: number,
  saleId: string,
  invoiceNumber: string,
  direction: 1 | -1,
  movementDate: Date,
): Promise<void> {
  const accountType = accountTypeForPayment(paymentMethod);
  if (!accountType) return;

  // Default + aktif hesap, yoksa ilk aktif aynı türden
  const account =
    (await trx('accounts')
      .where({ tenant_id: tenantId, account_type: accountType, is_default: true, is_active: true })
      .first()) ||
    (await trx('accounts')
      .where({ tenant_id: tenantId, account_type: accountType, is_active: true })
      .orderBy('created_at', 'asc')
      .first());

  if (!account) return; // uygun hesap yok, işlemi bloklama

  const signedAmount = direction * amount;
  const newBalance = (Number(account.current_balance) || 0) + signedAmount;

  await trx('account_movements').insert({
    tenant_id: tenantId,
    account_id: account.id,
    movement_type: direction === 1 ? 'gelir' : 'gider',
    amount,
    balance_after: newBalance,
    category: direction === 1 ? 'satış' : 'satış iptali',
    description: direction === 1 ? `Satış: ${invoiceNumber}` : `Satış iptali: ${invoiceNumber}`,
    reference_type: 'sale',
    reference_id: saleId,
    movement_date: movementDate,
  });

  await trx('accounts').where('id', account.id).update({
    current_balance: newBalance,
    updated_at: trx.fn.now(),
  });
}

/** Tenant'ın default (yoksa ilk aktif) hesabını döndürür. accountType verilirse o türden. */
export async function resolveDefaultAccount(
  trx: Knex.Transaction,
  tenantId: string,
  accountType?: 'kasa' | 'banka' | null,
): Promise<{ id: string; current_balance: number } | null> {
  const base = () => {
    const q = trx('accounts').where({ tenant_id: tenantId, is_active: true });
    return accountType ? q.where('account_type', accountType) : q;
  };
  const account =
    (await base().where('is_default', true).first()) ||
    (await base().orderBy('created_at', 'asc').first());
  return account || null;
}

/**
 * Belirli bir hesaba gelir/gider hareketi ekler ve accounts.current_balance'i günceller.
 * accountId verilmezse accountType'a göre default hesaba düşer. Uygun hesap yoksa sessizce atlar
 * (işlemi bloklamaz — kasa/banka tanımlı olmayan tenant'lar için geriye dönük uyumlu).
 */
export async function postAccountMovement(
  trx: Knex.Transaction,
  params: {
    tenantId: string;
    accountId?: string | null;
    accountType?: 'kasa' | 'banka' | null;
    movementType: 'gelir' | 'gider';
    amount: number;
    category: string;
    description: string;
    referenceType: string;
    referenceId: string;
    movementDate: Date;
  },
): Promise<void> {
  let account: { id: string; current_balance: number } | null = null;
  if (params.accountId) {
    account = await trx('accounts')
      .where({ id: params.accountId, tenant_id: params.tenantId, is_active: true })
      .first();
  }
  if (!account) {
    account = await resolveDefaultAccount(trx, params.tenantId, params.accountType);
  }
  if (!account) return;

  const signed = (params.movementType === 'gelir' ? 1 : -1) * params.amount;
  const newBalance = (Number(account.current_balance) || 0) + signed;

  await trx('account_movements').insert({
    tenant_id: params.tenantId,
    account_id: account.id,
    movement_type: params.movementType,
    amount: params.amount,
    balance_after: newBalance,
    category: params.category,
    description: params.description,
    reference_type: params.referenceType,
    reference_id: params.referenceId,
    movement_date: params.movementDate,
  });

  await trx('accounts').where('id', account.id).update({
    current_balance: newBalance,
    updated_at: trx.fn.now(),
  });
}

/**
 * Bir referansa (örn. expense) ait tüm hesap hareketlerini siler ve etkisini current_balance'tan
 * geri alır. Güncelleme/silme öncesi çağrılır; current_balance tam kalır.
 */
export async function removeAccountMovements(
  trx: Knex.Transaction,
  tenantId: string,
  referenceType: string,
  referenceId: string,
): Promise<void> {
  const movements = await trx('account_movements')
    .where({ tenant_id: tenantId, reference_type: referenceType, reference_id: referenceId });
  for (const m of movements) {
    const account = await trx('accounts').where('id', m.account_id).first();
    if (account) {
      // Hareketin bakiyeye etkisini geri al (gelir +amount eklemişti → çıkar; gider tersi).
      const undo = (m.movement_type === 'gelir' ? -1 : 1) * Number(m.amount);
      await trx('accounts').where('id', m.account_id).update({
        current_balance: (Number(account.current_balance) || 0) + undo,
        updated_at: trx.fn.now(),
      });
    }
  }
  await trx('account_movements')
    .where({ tenant_id: tenantId, reference_type: referenceType, reference_id: referenceId })
    .delete();
}
