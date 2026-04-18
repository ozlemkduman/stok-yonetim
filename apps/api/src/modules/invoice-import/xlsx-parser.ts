import * as XLSX from 'xlsx';
import { ParsedUblInvoice, ParsedInvoice, ParsedCustomer, ParsedItem, ParsedTotals } from './ubl-parser';

/**
 * Standard Excel kolon adları
 */
const COLUMN_ALIASES: Record<string, string> = {
  // Turkish
  'fatura_no': 'invoiceNo', 'fatura no': 'invoiceNo', 'fatura numarasi': 'invoiceNo',
  'fatura_tarihi': 'invoiceDate', 'fatura tarihi': 'invoiceDate', 'tarih': 'invoiceDate',
  'musteri_adi': 'customerName', 'musteri adi': 'customerName',
  'müsteri_adi': 'customerName', 'müsteri adi': 'customerName',
  'müşteri_adı': 'customerName', 'müşteri adı': 'customerName',
  'musteri': 'customerName', 'müşteri': 'customerName',
  'vergi_no': 'taxNumber', 'vergi no': 'taxNumber', 'vergi numarasi': 'taxNumber',
  'vergi_numarasi': 'taxNumber', 'vkn': 'taxNumber', 'tckn': 'taxNumber',
  'vergi_dairesi': 'taxOffice', 'vergi dairesi': 'taxOffice',
  'adres': 'address', 'telefon': 'phone', 'tel': 'phone',
  'email': 'email', 'e-posta': 'email', 'eposta': 'email',
  'urun_adi': 'productName', 'urun adi': 'productName',
  'ürün_adı': 'productName', 'ürün adı': 'productName',
  'urun': 'productName', 'ürün': 'productName',
  'miktar': 'quantity', 'adet': 'quantity',
  'birim_fiyat': 'unitPrice', 'birim fiyat': 'unitPrice', 'fiyat': 'unitPrice',
  'kdv_orani': 'vatRate', 'kdv orani': 'vatRate', 'kdv': 'vatRate',
  'birim': 'unit',
  // English
  'invoice_no': 'invoiceNo', 'invoice no': 'invoiceNo', 'invoice_number': 'invoiceNo',
  'invoice_date': 'invoiceDate', 'invoice date': 'invoiceDate', 'date': 'invoiceDate',
  'customer_name': 'customerName', 'customer name': 'customerName', 'customer': 'customerName',
  'tax_number': 'taxNumber', 'tax number': 'taxNumber', 'tax_id': 'taxNumber',
  'tax_office': 'taxOffice', 'tax office': 'taxOffice',
  'address': 'address', 'phone': 'phone',
  'product_name': 'productName', 'product name': 'productName', 'product': 'productName',
  'quantity': 'quantity', 'qty': 'quantity',
  'unit_price': 'unitPrice', 'unit price': 'unitPrice', 'price': 'unitPrice',
  'vat_rate': 'vatRate', 'vat rate': 'vatRate', 'vat': 'vatRate',
  'unit': 'unit',
  // GİB e-fatura portal export kolonları
  'alıcı unvan': 'customerName', 'alici unvan': 'customerName',
  'vkn / tckn': 'taxNumber',
  'ödenecek tutar': 'grandTotal', 'odenecek tutar': 'grandTotal',
  'toplam tutar(vergiler hariç)': 'subtotal', 'toplam tutar(vergiler haric)': 'subtotal',
  'vergiler toplamı': 'taxTotal', 'vergiler toplami': 'taxTotal',
  'toplam iskonto tutarı': 'discountTotal', 'toplam iskonto tutari': 'discountTotal',
  'mal hizmet adı': 'productName', 'mal hizmet adi': 'productName',
  'para birimi': 'currencyCode',
  'fatura tipi': 'invoiceType',
  'belge tipi': 'documentType',
};

function normalizeColumn(name: string): string {
  const cleaned = String(name).trim().toLowerCase();
  return COLUMN_ALIASES[cleaned] || cleaned;
}

function toStr(val: unknown): string {
  if (val == null) return '';
  if (val instanceof Date) {
    const d = val;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(val).trim();
}

function toNum(val: unknown, fallback = 0): number {
  if (val == null) return fallback;
  if (typeof val === 'number') return val;
  const n = parseFloat(String(val).replace(/\./g, '').replace(',', '.'));
  return isNaN(n) ? fallback : n;
}

/**
 * Detect if this is a GİB e-fatura portal export
 */
function isGibFormat(headers: string[]): boolean {
  const lower = headers.map(h => h.toLowerCase());
  return lower.includes('alıcı unvan') || lower.includes('alici unvan') ||
    (lower.includes('fatura no') && lower.includes('ödenecek tutar'));
}

/**
 * Parse GİB e-fatura portal export format.
 * Each row = one invoice (not one line item).
 * We create one "sale" per row with a single product item.
 */
function parseGibFormat(rows: Record<string, unknown>[], columnMap: Record<string, string>): ParsedUblInvoice[] {
  const results: ParsedUblInvoice[] = [];

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i];
    const mapped: Record<string, unknown> = {};
    for (const [origKey, normKey] of Object.entries(columnMap)) {
      mapped[normKey] = raw[origKey];
    }

    const customerName = toStr(mapped['customerName']);
    if (!customerName) continue;

    const invoiceNo = toStr(mapped['invoiceNo']);
    const invoiceDate = toStr(mapped['invoiceDate']);
    const taxNumber = toStr(mapped['taxNumber']);
    const grandTotal = toNum(mapped['grandTotal']);
    const subtotal = toNum(mapped['subtotal']);
    const taxTotal = toNum(mapped['taxTotal']);
    const currencyCode = toStr(mapped['currencyCode']) || 'TRY';
    const productName = toStr(mapped['productName']) || 'E-İmza Hizmeti';

    // Determine VAT rate from KDV columns
    let vatRate = 20;
    // Check which KDV matrah is non-zero
    for (const [key, val] of Object.entries(raw)) {
      const keyLower = key.toLowerCase();
      const matrahMatch = keyLower.match(/kdv\(%?\s*(\d+)\)\s*matrah/);
      if (matrahMatch && toNum(val) > 0) {
        vatRate = parseInt(matrahMatch[1], 10);
        break;
      }
    }

    // Parse date (DD.MM.YYYY -> YYYY-MM-DD)
    let parsedDate = invoiceDate;
    const dateMatch = invoiceDate.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (dateMatch) {
      parsedDate = `${dateMatch[3]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}`;
    }

    const invoice: ParsedInvoice = {
      id: invoiceNo || `GIB-${Date.now()}-${i}`,
      issueDate: parsedDate || new Date().toISOString().split('T')[0],
      invoiceTypeCode: 'SATIS',
      currencyCode,
    };

    const customer: ParsedCustomer = {
      name: customerName,
      taxNumber: taxNumber || null,
      taxOffice: null,
      address: null,
      phone: null,
      email: null,
    };

    const unitPrice = subtotal > 0 ? subtotal : (grandTotal > 0 ? grandTotal / (1 + vatRate / 100) : 0);
    const vatAmount = taxTotal > 0 ? taxTotal : unitPrice * (vatRate / 100);

    const items: ParsedItem[] = [{
      name: productName,
      quantity: 1,
      unitPrice,
      vatRate,
      vatAmount,
      lineTotal: grandTotal > 0 ? grandTotal : unitPrice + vatAmount,
      unit: 'adet',
    }];

    const totals: ParsedTotals = {
      lineExtensionAmount: subtotal > 0 ? subtotal : unitPrice,
      taxInclusiveAmount: grandTotal > 0 ? grandTotal : unitPrice + vatAmount,
      taxTotal: vatAmount,
      payableAmount: grandTotal > 0 ? grandTotal : unitPrice + vatAmount,
    };

    results.push({ invoice, customer, items, totals });
  }

  return results;
}

export function parseXlsx(buffer: Buffer): ParsedUblInvoice {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('Excel dosyasında sayfa bulunamadı');
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

  if (rawRows.length === 0) {
    throw new Error('Excel dosyasında veri satırı bulunamadı');
  }

  // Normalize headers
  const firstRaw = rawRows[0];
  const columnMap: Record<string, string> = {};
  for (const key of Object.keys(firstRaw)) {
    columnMap[key] = normalizeColumn(key);
  }

  const origHeaders = Object.keys(firstRaw);

  // Check if this is GİB format
  if (isGibFormat(origHeaders)) {
    const gibResults = parseGibFormat(rawRows, columnMap);
    if (gibResults.length === 0) {
      throw new Error('Excel dosyasında geçerli fatura satırı bulunamadı');
    }
    // Return first invoice; for multiple invoices we return the first one
    // The rest can be imported one by one
    return gibResults[0];
  }

  // --- Standard format ---
  const rows = rawRows.map((raw) => {
    const mapped: Record<string, unknown> = {};
    for (const [origKey, normKey] of Object.entries(columnMap)) {
      mapped[normKey] = raw[origKey];
    }
    return mapped;
  });

  const normHeaders = Object.values(columnMap);
  if (!normHeaders.includes('productName')) {
    throw new Error('Excel dosyasında "urun_adi" veya "product_name" kolonu bulunamadı');
  }
  if (!normHeaders.includes('quantity')) {
    throw new Error('Excel dosyasında "miktar" veya "quantity" kolonu bulunamadı');
  }
  if (!normHeaders.includes('unitPrice')) {
    throw new Error('Excel dosyasında "birim_fiyat" veya "unit_price" kolonu bulunamadı');
  }

  interface RowData {
    invoiceNo?: string;
    invoiceDate?: string;
    customerName?: string;
    taxNumber?: string;
    taxOffice?: string;
    address?: string;
    phone?: string;
    email?: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    vatRate: number;
    unit: string;
  }

  const parsedRows: RowData[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const productName = toStr(row['productName']);
    if (!productName) continue;

    const quantity = toNum(row['quantity']);
    const unitPrice = toNum(row['unitPrice']);
    const vatRate = toNum(row['vatRate'], 20);

    if (quantity <= 0) {
      throw new Error(`Satır ${i + 2}: "${productName}" için miktar 0'dan büyük olmalıdır`);
    }
    if (unitPrice < 0) {
      throw new Error(`Satır ${i + 2}: "${productName}" için birim fiyat negatif olamaz`);
    }

    parsedRows.push({
      invoiceNo: toStr(row['invoiceNo']) || undefined,
      invoiceDate: toStr(row['invoiceDate']) || undefined,
      customerName: toStr(row['customerName']) || undefined,
      taxNumber: toStr(row['taxNumber']) || undefined,
      taxOffice: toStr(row['taxOffice']) || undefined,
      address: toStr(row['address']) || undefined,
      phone: toStr(row['phone']) || undefined,
      email: toStr(row['email']) || undefined,
      productName,
      quantity,
      unitPrice,
      vatRate,
      unit: toStr(row['unit']) || 'adet',
    });
  }

  if (parsedRows.length === 0) {
    throw new Error('Excel dosyasında geçerli ürün satırı bulunamadı');
  }

  const first = parsedRows[0];
  const invoice: ParsedInvoice = {
    id: first.invoiceNo || `XLSX-${Date.now()}`,
    issueDate: first.invoiceDate || new Date().toISOString().split('T')[0],
    invoiceTypeCode: 'SATIS',
    currencyCode: 'TRY',
  };

  const customer: ParsedCustomer = {
    name: first.customerName || '',
    taxNumber: first.taxNumber || null,
    taxOffice: first.taxOffice || null,
    address: first.address || null,
    phone: first.phone || null,
    email: first.email || null,
  };

  const items: ParsedItem[] = parsedRows.map((row) => {
    const lineSubtotal = row.unitPrice * row.quantity;
    const vatAmount = lineSubtotal * (row.vatRate / 100);
    return {
      name: row.productName,
      quantity: row.quantity,
      unitPrice: row.unitPrice,
      vatRate: row.vatRate,
      vatAmount,
      lineTotal: lineSubtotal + vatAmount,
      unit: row.unit,
    };
  });

  const lineExtensionAmount = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const taxTotal = items.reduce((s, i) => s + i.vatAmount, 0);
  const totals: ParsedTotals = {
    lineExtensionAmount,
    taxInclusiveAmount: lineExtensionAmount + taxTotal,
    taxTotal,
    payableAmount: lineExtensionAmount + taxTotal,
  };

  return { invoice, customer, items, totals };
}

// Export for multi-invoice GİB imports
export { parseGibFormat, isGibFormat };
