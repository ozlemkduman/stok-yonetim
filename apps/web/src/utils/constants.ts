export const PAYMENT_METHODS = {
  nakit: 'Nakit',
  kredi_karti: 'Kredi Karti',
  havale: 'Havale',
  veresiye: 'Veresiye',
} as const;

export const EXPENSE_CATEGORIES = {
  kira: 'Kira',
  vergi: 'Vergi',
  maas: 'Maas',
  fatura: 'Fatura',
  diger: 'Diger',
} as const;

export const SALE_STATUSES = {
  completed: 'Tamamlandi',
  cancelled: 'Iptal',
  refunded: 'Iade Edildi',
} as const;

export const VAT_RATES = [0, 1, 10, 20] as const;

export const UNITS = ['adet', 'kg', 'litre', 'metre', 'paket', 'kutu'] as const;
