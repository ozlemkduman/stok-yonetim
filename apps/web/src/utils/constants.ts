export const PAYMENT_METHODS = {
  nakit: 'Nakit',
  kredi_karti: 'Kredi Kartı',
  havale: 'Havale',
  veresiye: 'Veresiye',
} as const;

export const EXPENSE_CATEGORIES = {
  kira: 'Kira',
  vergi: 'Vergi',
  maas: 'Maaş',
  fatura: 'Fatura',
  diger: 'Diğer',
} as const;

export const SALE_STATUSES = {
  completed: 'Tamamlandı',
  cancelled: 'İptal',
  refunded: 'İade Edildi',
} as const;

export const VAT_RATES = [0, 1, 10, 20] as const;

export const UNITS = ['adet', 'kg', 'litre', 'metre', 'paket', 'kutu'] as const;
