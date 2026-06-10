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

// Ürün kategorileri — SaaS geneli, sektör-bağımsız sabit liste.
// İleride kiracıya özel `categories` tablosuna geçişte bu değerler seed olur.
export const PRODUCT_CATEGORIES = {
  elektronik: 'Elektronik',
  gida: 'Gıda & İçecek',
  giyim: 'Giyim & Tekstil',
  ev_yasam: 'Ev & Yaşam',
  kozmetik: 'Kozmetik & Kişisel Bakım',
  kirtasiye: 'Kırtasiye & Ofis',
  yapi_hirdavat: 'Yapı & Hırdavat',
  otomotiv: 'Otomotiv & Yedek Parça',
  saglik: 'Sağlık & Medikal',
  yazilim: 'Yazılım',
  hizmet: 'Hizmet',
  diger: 'Diğer',
} as const;

export type ProductCategoryKey = keyof typeof PRODUCT_CATEGORIES;

// Yardımcı: kategori anahtarından etiket (bilinmeyen/eski değerler ham döner)
export const productCategoryLabel = (key?: string | null): string =>
  (key && (PRODUCT_CATEGORIES as Record<string, string>)[key]) || key || '-';

export const SALE_STATUSES = {
  completed: 'Tamamlandı',
  cancelled: 'İptal',
  refunded: 'İade Edildi',
} as const;

export const SALE_TYPES = {
  retail: 'Perakende',
  wholesale: 'Toptan',
} as const;

export const VAT_RATES = [0, 1, 10, 20] as const;

export const UNITS = ['adet', 'kg', 'litre', 'metre', 'paket', 'kutu'] as const;
