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

// --- Column alias mapping (standard format) ---
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

// --- Contacts format column names ---
const CONTACTS_COLUMNS = [
  'first name', 'last name', 'middle name',
  'phonetic first name', 'phonetic last name', 'phonetic middle name',
  'name prefix', 'name suffix', 'nickname',
];

function normalizeColumn(name: string): string {
  const cleaned = String(name).replace(/^\uFEFF/, '').trim().toLowerCase();
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

// =========================================================================
// Contacts format: smart name extraction
// =========================================================================

/**
 * Extracts a clean customer name and notes from a messy contacts field.
 *
 * Input examples from "First Name":
 *   "E - İmza Emel Bal ✅ 05.01.2026"
 *   "E İmza 16 Haz Haftaya Ara"
 *   "E-İmza Ahmet Can Yılmaz ✅"
 *   "E-imza Ali Taner Bey ✅"
 *   "E-İmza Batu Bey ✅  01.10.2025"
 *
 * Input examples from "Last Name":
 *   "3yıllık", "3 Yıllık 07.07.25", "Avukat", "Almadı", "(Serdar Bey)"
 */

// Prefixes to strip (case-insensitive)
const PREFIX_PATTERNS = [
  /^e\s*[-–—]\s*[iİ]mza\s*/i,    // "E - İmza", "E-İmza", "E- İmza"
  /^e\s+[iİ]mza\s*/i,             // "E İmza", "E imza"
  /^e[-]?[iİ]mza\s*/i,            // "Eİmza", "E-imza"
];

// Date patterns: DD.MM.YYYY, DD.MM.YY, DD/MM/YYYY, DD/MM/YY
const DATE_PATTERN = /\b(\d{1,2})[./](\d{1,2})[./](\d{2,4})\b/g;

// Duration patterns: "3yıllık", "3 yıllık", "1 yillik", "3 Yıllık"
const DURATION_PATTERN = /\b(\d+)\s*[yY][iıİ]ll[iıİ]k\b/gi;

// Month abbreviations (Turkish): "16 Haz", "11 Haz"
const MONTH_PATTERN = /\b(\d{1,2})\s+(Oca|Şub|Mar|Nis|May|Haz|Tem|Ağu|Eyl|Eki|Kas|Ara)\b/gi;

// Emoji pattern (checkmarks, etc.)
const EMOJI_PATTERN = /[\u2705\u2611\u2714\u2716\u274C\u274E\u2B50\u{1F4E6}\u{1F4E5}\u{1F44D}\u{1F44E}]/gu;

// Additional info keywords that should go to notes
const INFO_KEYWORDS = [
  'haftaya', 'almadı', 'almadi', 'başka yerden', 'baska yerden',
  'kurye', 'hizmeti', 'askıda', 'askida',
];

interface ExtractedContact {
  name: string;
  notes: string[];
}

function extractContactInfo(firstName: string, middleName: string, lastName: string): ExtractedContact {
  const notes: string[] = [];

  // --- Process First Name ---
  let cleanFirst = firstName;

  // Remove prefix (E İmza, E-İmza, etc.)
  for (const pattern of PREFIX_PATTERNS) {
    cleanFirst = cleanFirst.replace(pattern, '');
  }

  // Remove emojis
  cleanFirst = cleanFirst.replace(EMOJI_PATTERN, '');

  // Extract dates from first name
  const firstDates: string[] = [];
  cleanFirst = cleanFirst.replace(DATE_PATTERN, (match) => {
    firstDates.push(match);
    return '';
  });
  if (firstDates.length > 0) {
    notes.push(...firstDates.map(d => `Tarih: ${d}`));
  }

  // Extract durations from first name
  cleanFirst = cleanFirst.replace(DURATION_PATTERN, (match) => {
    notes.push(match.trim());
    return '';
  });

  // Extract month references from first name
  cleanFirst = cleanFirst.replace(MONTH_PATTERN, (match) => {
    notes.push(match.trim());
    return '';
  });

  // Check for info keywords in first name
  const lowerFirst = cleanFirst.toLowerCase();
  for (const keyword of INFO_KEYWORDS) {
    if (lowerFirst.includes(keyword)) {
      // Extract the keyword and surrounding words as a note
      const keywordRegex = new RegExp(`\\b\\S*${keyword}\\S*(?:\\s+\\S+)?\\b`, 'gi');
      cleanFirst = cleanFirst.replace(keywordRegex, (match) => {
        notes.push(match.trim());
        return '';
      });
    }
  }

  // --- Process Last Name ---
  let cleanLast = lastName;
  cleanLast = cleanLast.replace(EMOJI_PATTERN, '');

  // Extract dates from last name
  const lastDates: string[] = [];
  cleanLast = cleanLast.replace(DATE_PATTERN, (match) => {
    lastDates.push(match);
    return '';
  });
  if (lastDates.length > 0) {
    notes.push(...lastDates.map(d => `Tarih: ${d}`));
  }

  // Extract durations from last name
  cleanLast = cleanLast.replace(DURATION_PATTERN, (match) => {
    notes.push(match.trim());
    return '';
  });

  // Check if last name is entirely a note (not a real surname)
  const cleanLastTrimmed = cleanLast.trim();
  const isNoteName = isLikelyNote(cleanLastTrimmed);
  if (isNoteName && cleanLastTrimmed) {
    notes.push(cleanLastTrimmed);
    cleanLast = '';
  }

  // --- Process Middle Name ---
  let cleanMiddle = (middleName || '').replace(EMOJI_PATTERN, '').trim();

  // --- Build final name ---
  const nameParts = [cleanFirst, cleanMiddle, cleanLast]
    .map(s => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  let finalName = nameParts.join(' ').trim();

  // Remove dangling punctuation
  finalName = finalName.replace(/^[-–—\s]+|[-–—\s]+$/g, '').trim();

  // Deduplicate notes
  const uniqueNotes = [...new Set(notes.map(n => n.trim()).filter(Boolean))];

  return {
    name: finalName,
    notes: uniqueNotes,
  };
}

/**
 * Determines if a "Last Name" value is actually a note/metadata, not a real surname.
 * Real surnames are typically 1-2 Turkish words without numbers or special keywords.
 */
function isLikelyNote(value: string): boolean {
  if (!value) return false;
  const lower = value.toLowerCase();

  // Contains a date
  if (DATE_PATTERN.test(value)) {
    DATE_PATTERN.lastIndex = 0;
    return true;
  }

  // Contains duration
  if (DURATION_PATTERN.test(value)) {
    DURATION_PATTERN.lastIndex = 0;
    return true;
  }

  // Known note keywords
  const noteKeywords = [
    'almadı', 'almadi', 'avukat', 'doktor', 'mühendis', 'muhendis',
    'öğretmen', 'ogretmen', 'üniversite', 'universite', 'araştırma', 'arastirma',
    'görevli', 'gorevli', 'başka', 'baska', 'yerden', 'aldı', 'aldi',
    'kurye', 'hizmet', 'müşteri', 'musteri', 'askıda', 'askida',
    'ara', 'haftaya',
  ];

  for (const keyword of noteKeywords) {
    if (lower.includes(keyword)) return true;
  }

  // Starts with parentheses - it's a note: "(Serdar Bey)"
  if (value.startsWith('(')) return true;

  return false;
}

// =========================================================================
// CSV / XLSX row parsing
// =========================================================================

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

function getRawRows(buffer: Buffer, fileType: 'csv' | 'xlsx'): { headers: string[]; rows: Record<string, string>[] } {
  if (fileType === 'csv') {
    const content = buffer.toString('utf-8').replace(/^\uFEFF/, '');
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      throw new Error('Dosya en az bir başlık satırı ve bir veri satırı içermelidir');
    }
    const delimiter = detectDelimiter(lines[0]);
    const rawHeaders = parseCsvLine(lines[0], delimiter);
    const headers = rawHeaders.map(h => h.replace(/^\uFEFF/, '').trim().toLowerCase());
    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCsvLine(lines[i], delimiter);
      if (values.every((v) => v === '')) continue;
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
      rows.push(row);
    }
    return { headers, rows };
  } else {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error('Excel dosyasında sayfa bulunamadı');
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
    if (rawRows.length === 0) throw new Error('Excel dosyasında veri satırı bulunamadı');

    const origKeys = Object.keys(rawRows[0]);
    const headers = origKeys.map(k => k.trim().toLowerCase());
    const rows = rawRows.map((raw) => {
      const mapped: Record<string, string> = {};
      origKeys.forEach((origKey, idx) => {
        mapped[headers[idx]] = toStr(raw[origKey]);
      });
      return mapped;
    });
    return { headers, rows };
  }
}

/**
 * Detect if the file is in contacts format (Google Contacts, Phone export, etc.)
 */
function isContactsFormat(headers: string[]): boolean {
  const lowerHeaders = headers.map(h => h.toLowerCase());
  return lowerHeaders.includes('first name') && lowerHeaders.includes('last name');
}

// =========================================================================
// Main parse function
// =========================================================================

export function parseCustomerFile(buffer: Buffer, fileType: 'csv' | 'xlsx'): ParsedCustomerRow[] {
  const { headers, rows } = getRawRows(buffer, fileType);

  if (rows.length === 0) {
    throw new Error('Dosyada geçerli veri satırı bulunamadı');
  }

  // Detect format: contacts vs standard
  if (isContactsFormat(headers)) {
    return parseContactsFormat(rows);
  }

  return parseStandardFormat(headers, rows);
}

/**
 * Standard format: musteri_adi, telefon, email, etc.
 */
function parseStandardFormat(headers: string[], rows: Record<string, string>[]): ParsedCustomerRow[] {
  // Normalize headers
  const normalizedRows = rows.map((row) => {
    const mapped: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      const normKey = normalizeColumn(key);
      mapped[normKey] = value;
    }
    return mapped;
  });

  const sampleKeys = Object.keys(normalizedRows[0] || {});
  if (!sampleKeys.includes('name')) {
    throw new Error('Dosyada "musteri_adi", "firma", "name" veya benzeri bir kolon bulunamadı');
  }

  const customers: ParsedCustomerRow[] = [];
  for (let i = 0; i < normalizedRows.length; i++) {
    const row = normalizedRows[i];
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

/**
 * Contacts format: First Name, Middle Name, Last Name, Phone, Email, etc.
 */
function parseContactsFormat(rows: Record<string, string>[]): ParsedCustomerRow[] {
  // Find phone and email columns - contacts exports can have multiple phone/email columns
  const phoneColumns = [
    'phone 1 - value', 'phone 2 - value', 'phone 3 - value',
    'primary phone', 'mobile phone', 'home phone', 'work phone',
    'phone', 'mobile', 'telephone',
  ];
  const emailColumns = [
    'e-mail 1 - value', 'e-mail 2 - value', 'e-mail 3 - value',
    'primary email', 'email', 'e-mail', 'email address',
  ];
  const addressColumns = [
    'address 1 - formatted', 'address 1 - street', 'address',
    'home address', 'work address',
  ];
  const orgColumns = [
    'organization 1 - name', 'organization name', 'company', 'organization',
  ];

  // Detect available columns from first row
  const sampleKeys = Object.keys(rows[0] || {});
  const findColumn = (candidates: string[]) =>
    candidates.find(c => sampleKeys.includes(c)) || null;

  const phoneCol = findColumn(phoneColumns);
  const emailCol = findColumn(emailColumns);
  const addressCol = findColumn(addressColumns);
  const orgCol = findColumn(orgColumns);

  const customers: ParsedCustomerRow[] = [];

  for (const row of rows) {
    const firstName = (row['first name'] || '').trim();
    const middleName = (row['middle name'] || '').trim();
    const lastName = (row['last name'] || '').trim();

    // Skip empty rows
    if (!firstName && !middleName && !lastName) continue;

    // Extract clean name and notes
    const extracted = extractContactInfo(firstName, middleName, lastName);

    if (!extracted.name || extracted.name.length < 2) continue;

    // Get phone (first non-empty from candidate columns)
    let phone: string | null = null;
    if (phoneCol) {
      phone = row[phoneCol]?.trim() || null;
    }
    if (!phone) {
      for (const col of phoneColumns) {
        if (row[col]?.trim()) { phone = row[col].trim(); break; }
      }
    }

    // Get email
    let email: string | null = null;
    if (emailCol) {
      email = row[emailCol]?.trim() || null;
    }
    if (!email) {
      for (const col of emailColumns) {
        if (row[col]?.trim()) { email = row[col].trim(); break; }
      }
    }

    // Get address
    let address: string | null = null;
    if (addressCol) {
      address = row[addressCol]?.trim() || null;
    }

    // Get organization -> notes
    if (orgCol && row[orgCol]?.trim()) {
      extracted.notes.push(`Firma: ${row[orgCol].trim()}`);
    }

    customers.push({
      name: extracted.name,
      phone,
      email,
      address,
      taxNumber: null,
      taxOffice: null,
      notes: extracted.notes.length > 0 ? extracted.notes.join(', ') : null,
    });
  }

  if (customers.length === 0) {
    throw new Error('Dosyada geçerli müşteri satırı bulunamadı');
  }

  return customers;
}
