import * as XLSX from 'xlsx';

export interface ParsedCustomerRow {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxNumber: string | null;
  taxOffice: string | null;
  notes: string | null;
}

const COLUMN_ALIASES: Record<string, string> = {
  // Turkish
  'musteri_adi': 'name', 'musteri adi': 'name', 'müşteri_adı': 'name', 'müşteri adı': 'name',
  'musteri': 'name', 'müşteri': 'name', 'ad': 'name', 'isim': 'name', 'firma': 'name',
  'firma_adi': 'name', 'firma adi': 'name', 'firma adı': 'name',
  'telefon': 'phone', 'tel': 'phone', 'cep': 'phone', 'cep_telefonu': 'phone',
  'email': 'email', 'e-posta': 'email', 'eposta': 'email', 'e_posta': 'email', 'mail': 'email',
  'adres': 'address',
  'vergi_no': 'taxNumber', 'vergi no': 'taxNumber', 'vergi numarasi': 'taxNumber',
  'vergi_numarasi': 'taxNumber', 'vkn': 'taxNumber', 'tckn': 'taxNumber',
  'vergi_dairesi': 'taxOffice', 'vergi dairesi': 'taxOffice',
  'not': 'notes', 'notlar': 'notes', 'aciklama': 'notes', 'açıklama': 'notes',
  // English
  'name': 'name', 'customer_name': 'name', 'customer name': 'name', 'customer': 'name',
  'company': 'name', 'company_name': 'name', 'company name': 'name',
  'phone': 'phone', 'telephone': 'phone', 'mobile': 'phone',
  'address': 'address',
  'tax_number': 'taxNumber', 'tax number': 'taxNumber', 'tax_id': 'taxNumber',
  'tax_office': 'taxOffice', 'tax office': 'taxOffice',
  'notes': 'notes', 'note': 'notes', 'description': 'notes',
};

function normalizeColumn(name: string): string {
  const cleaned = String(name).replace(/^\uFEFF/, '').trim().toLowerCase();
  return COLUMN_ALIASES[cleaned] || cleaned;
}

function toStr(val: unknown): string {
  if (val == null) return '';
  return String(val).trim();
}

// --- CSV parsing helpers ---
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
      if (char === '"' && nextChar === '"') { current += '"'; i++; }
      else if (char === '"') { inQuotes = false; }
      else { current += char; }
    } else {
      if (char === '"') { inQuotes = true; }
      else if (char === delimiter) { fields.push(current.trim()); current = ''; }
      else { current += char; }
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCsvRows(buffer: Buffer): Record<string, string>[] {
  const content = buffer.toString('utf-8').replace(/^\uFEFF/, '');
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    throw new Error('Dosya en az bir başlık satırı ve bir veri satırı içermelidir');
  }
  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter).map(normalizeColumn);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i], delimiter);
    if (values.every((v) => v === '')) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
    rows.push(row);
  }
  return rows;
}

function parseXlsxRows(buffer: Buffer): Record<string, string>[] {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('Excel dosyasında sayfa bulunamadı');
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  if (rawRows.length === 0) throw new Error('Excel dosyasında veri satırı bulunamadı');

  // Normalize columns
  const origKeys = Object.keys(rawRows[0]);
  const columnMap: Record<string, string> = {};
  for (const k of origKeys) { columnMap[k] = normalizeColumn(k); }

  return rawRows.map((raw) => {
    const mapped: Record<string, string> = {};
    for (const [origKey, normKey] of Object.entries(columnMap)) {
      mapped[normKey] = toStr(raw[origKey]);
    }
    return mapped;
  });
}

export function parseCustomerFile(buffer: Buffer, fileType: 'csv' | 'xlsx'): ParsedCustomerRow[] {
  const rows = fileType === 'csv' ? parseCsvRows(buffer) : parseXlsxRows(buffer);

  if (rows.length === 0) {
    throw new Error('Dosyada geçerli veri satırı bulunamadı');
  }

  // Check for name column
  const sampleKeys = Object.keys(rows[0]);
  if (!sampleKeys.includes('name')) {
    throw new Error('Dosyada "musteri_adi", "firma", "name" veya benzeri bir kolon bulunamadı');
  }

  const customers: ParsedCustomerRow[] = [];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = (row['name'] || '').trim();
    if (!name) continue;

    if (name.length < 2) {
      throw new Error(`Satır ${i + 2}: Müşteri adı en az 2 karakter olmalıdır ("${name}")`);
    }

    customers.push({
      name,
      phone: row['phone']?.trim() || null,
      email: row['email']?.trim() || null,
      address: row['address']?.trim() || null,
      taxNumber: row['taxNumber']?.trim() || null,
      taxOffice: row['taxOffice']?.trim() || null,
      notes: row['notes']?.trim() || null,
    });
  }

  if (customers.length === 0) {
    throw new Error('Dosyada geçerli müşteri satırı bulunamadı');
  }

  return customers;
}
