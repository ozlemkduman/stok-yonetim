import { ValidationError } from 'class-validator';

// Alan adı → Türkçe etiket
const FIELD_LABELS: Record<string, string> = {
  // Genel
  name: 'Ad',
  email: 'E-posta',
  password: 'Şifre',
  phone: 'Telefon',
  address: 'Adres',
  code: 'Kod',
  description: 'Açıklama',
  notes: 'Not',
  status: 'Durum',
  is_active: 'Aktif',
  // Ürün
  barcode: 'Barkod',
  category: 'Kategori',
  unit: 'Birim',
  purchase_price: 'Alış fiyatı',
  sale_price: 'Satış fiyatı',
  wholesale_price: 'Toptan satış fiyatı',
  vat_rate: 'KDV oranı',
  stock_quantity: 'Stok miktarı',
  min_stock_level: 'Minimum stok seviyesi',
  subscription_duration: 'Abonelik süresi',
  // Müşteri
  customer_id: 'Müşteri',
  tax_number: 'Vergi numarası',
  tax_office: 'Vergi dairesi',
  balance: 'Bakiye',
  // Satış / iade / teklif
  sale_date: 'Satış tarihi',
  return_date: 'İade tarihi',
  quote_date: 'Teklif tarihi',
  payment_method: 'Ödeme yöntemi',
  invoice_number: 'Fatura numarası',
  return_number: 'İade numarası',
  quote_number: 'Teklif numarası',
  quantity: 'Miktar',
  unit_price: 'Birim fiyat',
  discount_rate: 'İskonto oranı',
  vat_amount: 'KDV tutarı',
  line_total: 'Satır toplamı',
  subtotal: 'Ara toplam',
  total: 'Toplam',
  grand_total: 'Genel toplam',
  items: 'Kalemler',
  product_id: 'Ürün',
  reason: 'Sebep',
  // Depo
  warehouse_id: 'Depo',
  warehouse_name: 'Depo adı',
  // Kullanıcı / kimlik doğrulama
  role: 'Rol',
  permissions: 'Yetkiler',
  current_password: 'Mevcut şifre',
  new_password: 'Yeni şifre',
  // Plan / kiracı
  plan: 'Plan',
  plan_id: 'Plan',
  tenant_id: 'Kiracı',
  // Sayfalama
  page: 'Sayfa',
  limit: 'Limit',
  sortBy: 'Sıralama alanı',
  sortOrder: 'Sıralama yönü',
  search: 'Arama',
};

const labelFor = (property: string): string => FIELD_LABELS[property] || property;

// Constraint anahtarı → Türkçe mesaj üretici
const CONSTRAINT_TRANSLATORS: Record<string, (label: string, ctx: string) => string> = {
  isNotEmpty: (l) => `${l} boş olamaz`,
  isDefined: (l) => `${l} zorunludur`,
  isString: (l) => `${l} metin olmalı`,
  isNumber: (l) => `${l} sayı olmalı`,
  isInt: (l) => `${l} tam sayı olmalı`,
  isBoolean: (l) => `${l} doğru/yanlış değer olmalı`,
  isDate: (l) => `${l} geçerli bir tarih olmalı`,
  isDateString: (l) => `${l} geçerli bir tarih olmalı`,
  isEmail: (l) => `${l} geçerli bir e-posta olmalı`,
  isUUID: (l) => `${l} geçerli bir kimlik olmalı`,
  isUrl: (l) => `${l} geçerli bir URL olmalı`,
  isPhoneNumber: (l) => `${l} geçerli bir telefon numarası olmalı`,
  isEnum: (l, c) => `${l} geçerli bir değer olmalı${extractAllowed(c)}`,
  isIn: (l, c) => `${l} geçerli bir değer olmalı${extractAllowed(c)}`,
  matches: (l) => `${l} geçerli formatta olmalı`,
  isArray: (l) => `${l} liste olmalı`,
  arrayMinSize: (l, c) => `${l} en az ${extractNumber(c)} öğe içermeli`,
  arrayMaxSize: (l, c) => `${l} en fazla ${extractNumber(c)} öğe içerebilir`,
  arrayNotEmpty: (l) => `${l} en az bir öğe içermeli`,
  minLength: (l, c) => `${l} en az ${extractNumber(c)} karakter olmalı`,
  maxLength: (l, c) => `${l} en fazla ${extractNumber(c)} karakter olabilir`,
  min: (l, c) => `${l} en az ${extractNumber(c)} olmalı`,
  max: (l, c) => `${l} en fazla ${extractNumber(c)} olabilir`,
  equals: (l, c) => `${l} ${extractNumber(c)} olmalı`,
  whitelistValidation: (l) => `${l} alanına izin verilmiyor`,
};

const extractNumber = (ctx: string): string => {
  const m = ctx.match(/\b\d+(?:\.\d+)?\b/);
  return m ? m[0] : '';
};

const extractAllowed = (ctx: string): string => {
  const m = ctx.match(/following values:?\s*(.+)$/i);
  return m ? ` (${m[1]})` : '';
};

const translateConstraint = (
  property: string,
  constraintKey: string,
  originalMessage: string,
): string => {
  const label = labelFor(property);
  const translator = CONSTRAINT_TRANSLATORS[constraintKey];
  if (translator) return translator(label, originalMessage);
  // Fallback: property adını Türkçe karşılığıyla değiştir
  return originalMessage.replace(new RegExp(`\\b${property}\\b`, 'g'), label);
};

const flattenErrors = (
  errors: ValidationError[],
  parentPath = '',
): string[] => {
  const messages: string[] = [];
  for (const err of errors) {
    const path = parentPath ? `${parentPath}.${err.property}` : err.property;
    if (err.constraints) {
      for (const [key, msg] of Object.entries(err.constraints)) {
        messages.push(translateConstraint(err.property, key, msg));
      }
    }
    if (err.children && err.children.length > 0) {
      messages.push(...flattenErrors(err.children, path));
    }
  }
  return messages;
};

export const translateValidationErrors = (
  errors: ValidationError[],
): { message: string; errors: string[] } => {
  const translated = flattenErrors(errors);
  return {
    message: translated[0] || 'Geçersiz veri',
    errors: translated,
  };
};
