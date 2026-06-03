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
