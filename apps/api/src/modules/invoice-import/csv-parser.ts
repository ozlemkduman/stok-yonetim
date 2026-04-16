import { ParsedUblInvoice, ParsedInvoice, ParsedCustomer, ParsedItem, ParsedTotals } from './ubl-parser';

/**
 * CSV kolon adları (Türkçe ve İngilizce desteklenir)
 * Zorunlu: urun_adi, miktar, birim_fiyat
 * Opsiyonel: fatura_no, fatura_tarihi, musteri_adi, vergi_no, vergi_dairesi,
 *            adres, telefon, email, kdv_orani, birim
 */

const COLUMN_ALIASES: Record<string, string> = {
  // Turkish
  'fatura_no': 'invoiceNo',
  'fatura no': 'invoiceNo',
  'fatura numarasi': 'invoiceNo',
  'fatura_tarihi': 'invoiceDate',
  'fatura tarihi': 'invoiceDate',
  'tarih': 'invoiceDate',
  'musteri_adi': 'customerName',
  'musteri adi': 'customerName',
  'müsteri_adi': 'customerName',
  'müsteri adi': 'customerName',
  'müşteri_adı': 'customerName',
  'müşteri adı': 'customerName',
  'musteri': 'customerName',
  'müşteri': 'customerName',
  'vergi_no': 'taxNumber',
  'vergi no': 'taxNumber',
  'vergi numarasi': 'taxNumber',
  'vergi_numarasi': 'taxNumber',
  'vkn': 'taxNumber',
  'tckn': 'taxNumber',
  'vergi_dairesi': 'taxOffice',
  'vergi dairesi': 'taxOffice',
  'adres': 'address',
  'telefon': 'phone',
  'tel': 'phone',
  'email': 'email',
  'e-posta': 'email',
  'eposta': 'email',
  'urun_adi': 'productName',
  'urun adi': 'productName',
  'ürün_adı': 'productName',
  'ürün adı': 'productName',
  'urun': 'productName',
  'ürün': 'productName',
  'miktar': 'quantity',
  'adet': 'quantity',
  'birim_fiyat': 'unitPrice',
  'birim fiyat': 'unitPrice',
  'fiyat': 'unitPrice',
  'kdv_orani': 'vatRate',
  'kdv orani': 'vatRate',
  'kdv': 'vatRate',
  'birim': 'unit',
  // English
  'invoice_no': 'invoiceNo',
  'invoice no': 'invoiceNo',
  'invoice_number': 'invoiceNo',
  'invoice_date': 'invoiceDate',
  'invoice date': 'invoiceDate',
  'date': 'invoiceDate',
  'customer_name': 'customerName',
  'customer name': 'customerName',
  'customer': 'customerName',
  'tax_number': 'taxNumber',
  'tax number': 'taxNumber',
  'tax_id': 'taxNumber',
  'tax_office': 'taxOffice',
  'tax office': 'taxOffice',
  'address': 'address',
  'phone': 'phone',
  'product_name': 'productName',
  'product name': 'productName',
  'product': 'productName',
  'quantity': 'quantity',
  'qty': 'quantity',
  'unit_price': 'unitPrice',
  'unit price': 'unitPrice',
  'price': 'unitPrice',
  'vat_rate': 'vatRate',
  'vat rate': 'vatRate',
  'vat': 'vatRate',
  'unit': 'unit',
};

interface CsvRow {
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

function detectDelimiter(firstLine: string): string {
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  if (tabCount > semicolonCount && tabCount > commaCount) return '\t';
  if (semicolonCount > commaCount) return ';';
  return ',';
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++; // skip escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === delimiter) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

function normalizeColumnName(name: string): string {
  // Remove BOM, trim, lowercase, normalize Turkish chars for lookup
  const cleaned = name.replace(/^\uFEFF/, '').trim().toLowerCase();
  return COLUMN_ALIASES[cleaned] || cleaned;
}

export function parseCsv(buffer: Buffer): ParsedUblInvoice {
  const content = buffer.toString('utf-8').replace(/^\uFEFF/, '');
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    throw new Error('CSV dosyası en az bir başlık satırı ve bir veri satırı içermelidir');
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter).map(normalizeColumnName);

  // Validate required columns
  const hasProductName = headers.includes('productName');
  const hasQuantity = headers.includes('quantity');
  const hasUnitPrice = headers.includes('unitPrice');

  if (!hasProductName) {
    throw new Error('CSV dosyasında "urun_adi" veya "product_name" kolonu bulunamadı');
  }
  if (!hasQuantity) {
    throw new Error('CSV dosyasında "miktar" veya "quantity" kolonu bulunamadı');
  }
  if (!hasUnitPrice) {
    throw new Error('CSV dosyasında "birim_fiyat" veya "unit_price" kolonu bulunamadı');
  }

  // Parse rows
  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i], delimiter);
    if (values.every((v) => v === '')) continue; // skip empty rows

    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });

    const productName = row['productName']?.trim();
    if (!productName) continue; // skip rows without product name

    const quantity = parseFloat(row['quantity']?.replace(',', '.') || '0');
    const unitPrice = parseFloat(row['unitPrice']?.replace(',', '.') || '0');
    const vatRate = parseFloat(row['vatRate']?.replace(',', '.') || '20');

    if (quantity <= 0) {
      throw new Error(`Satır ${i + 1}: "${productName}" için miktar 0'dan büyük olmalıdır`);
    }
    if (unitPrice < 0) {
      throw new Error(`Satır ${i + 1}: "${productName}" için birim fiyat negatif olamaz`);
    }

    rows.push({
      invoiceNo: row['invoiceNo']?.trim() || undefined,
      invoiceDate: row['invoiceDate']?.trim() || undefined,
      customerName: row['customerName']?.trim() || undefined,
      taxNumber: row['taxNumber']?.trim() || undefined,
      taxOffice: row['taxOffice']?.trim() || undefined,
      address: row['address']?.trim() || undefined,
      phone: row['phone']?.trim() || undefined,
      email: row['email']?.trim() || undefined,
      productName,
      quantity,
      unitPrice,
      vatRate,
      unit: row['unit']?.trim() || 'adet',
    });
  }

  if (rows.length === 0) {
    throw new Error('CSV dosyasında geçerli ürün satırı bulunamadı');
  }

  // Extract invoice info from first row
  const firstRow = rows[0];
  const invoice: ParsedInvoice = {
    id: firstRow.invoiceNo || `CSV-${Date.now()}`,
    issueDate: parseDate(firstRow.invoiceDate) || new Date().toISOString().split('T')[0],
    invoiceTypeCode: 'SATIS',
    currencyCode: 'TRY',
  };

  // Extract customer info from first row
  const customer: ParsedCustomer = {
    name: firstRow.customerName || '',
    taxNumber: firstRow.taxNumber || null,
    taxOffice: firstRow.taxOffice || null,
    address: firstRow.address || null,
    phone: firstRow.phone || null,
    email: firstRow.email || null,
  };

  // Build items
  const items: ParsedItem[] = rows.map((row) => {
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

  // Compute totals
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

function parseDate(value: string | undefined): string | null {
  if (!value) return null;

  // Try common Turkish/European date formats: DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY
  const dmyMatch = value.match(/^(\d{1,2})[./\-](\d{1,2})[./\-](\d{4})$/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Try ISO format: YYYY-MM-DD
  const isoMatch = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    return value;
  }

  return null;
}
