import * as XLSX from 'xlsx';

export interface ParsedCustomerRow {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxNumber: string | null;
  taxOffice: string | null;
  notes: string | null;
  renewalDate: string | null;
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
  'yenileme_tarihi': 'renewalDate', 'yenileme tarihi': 'renewalDate',
  // English
  'name': 'name', 'customer_name': 'name', 'customer name': 'name', 'customer': 'name',
  'company': 'name', 'company_name': 'name', 'company name': 'name',
  'phone': 'phone', 'telephone': 'phone', 'mobile': 'phone',
  'address': 'address',
  'tax_number': 'taxNumber', 'tax number': 'taxNumber', 'tax_id': 'taxNumber',
  'tax_office': 'taxOffice', 'tax office': 'taxOffice',
  'notes': 'notes', 'note': 'notes', 'description': 'notes',
  'renewal_date': 'renewalDate', 'renewal date': 'renewalDate',
};

// --- Contacts format column names ---
const CONTACTS_COLUMNS = [
  'first name', 'last name', 'middle name',
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
// Phone number formatting
// =========================================================================

/**
 * Fix phone numbers that Excel converted to scientific notation.
 * "9.05378E+11" -> "905378000000" -> "0905378000000" or similar
 * Also handles raw numbers like 905321644585
 */
function formatPhoneNumber(value: string | null | undefined): string | null {
  if (!value) return null;
  let phone = String(value).trim();
  if (!phone) return null;

  // Handle scientific notation: "9.05378E+11", "9,05378E+11"
  const sciMatch = phone.match(/^(\d+[.,]\d+)[eE]\+(\d+)$/);
  if (sciMatch) {
    const num = parseFloat(phone.replace(',', '.'));
    if (!isNaN(num)) {
      phone = Math.round(num).toString();
    }
  }

  // If it's a pure number (no spaces, dashes, parens), format it
  const digitsOnly = phone.replace(/\D/g, '');

  // Turkish phone: starts with 90 and is 12 digits, or starts with 0 and is 11 digits
  if (digitsOnly.length === 12 && digitsOnly.startsWith('90')) {
    // 905321644585 -> 0532 164 45 85
    const rest = digitsOnly.substring(2); // 5321644585
    return `0${rest.substring(0, 3)} ${rest.substring(3, 6)} ${rest.substring(6, 8)} ${rest.substring(8, 10)}`;
  }

  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    // 05321644585 -> 0532 164 45 85
    return `${digitsOnly.substring(0, 4)} ${digitsOnly.substring(4, 7)} ${digitsOnly.substring(7, 9)} ${digitsOnly.substring(9, 11)}`;
  }

  if (digitsOnly.length === 10 && digitsOnly.startsWith('5')) {
    // 5321644585 -> 0532 164 45 85
    return `0${digitsOnly.substring(0, 3)} ${digitsOnly.substring(3, 6)} ${digitsOnly.substring(6, 8)} ${digitsOnly.substring(8, 10)}`;
  }

  // Return as-is if already formatted (has spaces/parens/dashes)
  return phone;
}

// =========================================================================
// Contacts format: smart name extraction
// =========================================================================

// Prefixes to strip (case-insensitive)
const PREFIX_PATTERNS = [
  /^e\s*[-–—]\s*[iİ]mza\s*/i,    // "E - İmza", "E-İmza", "E- İmza"
  /^e\s+[iİ]mza\s*/i,             // "E İmza", "E imza"
  /^e[-]?[iİ]mza\s*/i,            // "Eİmza", "E-imza"
];

// Emoji pattern (checkmarks, etc.)
const EMOJI_PATTERN = /[\u2705\u2611\u2714\u2716\u274C\u274E\u2B50\u{1F4E6}\u{1F4E5}\u{1F44D}\u{1F44E}]/gu;

// Words/phrases that are NOT real names - should be moved to notes or filtered
const NOT_A_NAME_WORDS = [
  'müşteri', 'musteri', 'müşterisi', 'musterisi',
  'haber ver', 'haber',
  'ara', 'aranacak',
  'haftaya', 'yarın', 'yarin', 'bugün', 'bugun',
  'almadı', 'almadi', 'aldı', 'aldi', 'almaz',
  'başka yerden', 'baska yerden',
  'kurye', 'hizmeti', 'hizmet',
  'askıda', 'askida',
  'iptal', 'bitti', 'kapandı', 'kapandi',
  'deneme', 'test',
];

// Turkish month abbreviations
const MONTH_NAMES = ['oca', 'şub', 'sub', 'mar', 'nis', 'may', 'haz', 'tem', 'ağu', 'agu', 'eyl', 'eki', 'kas', 'ara'];

interface ExtractedContact {
  name: string;
  notes: string[];
}

function extractContactInfo(firstName: string, middleName: string, lastName: string): ExtractedContact {
  const notes: string[] = [];

  // Use fresh regex instances to avoid lastIndex issues
  const dateRe = () => /(\d{1,2})[./](\d{1,2})[./](\d{2,4})/g;
  const durationRe = () => /(\d+)\s*[yY][iıİ]ll[iıİ][kK]/g;
  const monthRe = () => /\b(\d{1,2})\s*(Oca|Şub|Şub|Sub|Mar|Nis|May|Haz|Tem|Ağu|Agu|Eyl|Eki|Kas|Ara)\b/gi;
  const standaloneMonthRe = () => /^(\d{1,2})\s*(oca|şub|sub|mar|nis|may|haz|tem|ağu|agu|eyl|eki|kas|ara)$/i;

  // --- Process a text field: extract dates, durations, notes ---
  function extractMetadata(text: string): string {
    let result = text;

    // Remove emojis
    result = result.replace(EMOJI_PATTERN, '');

    // Extract dates
    result = result.replace(dateRe(), (match) => {
      notes.push(`Tarih: ${match}`);
      return ' ';
    });

    // Extract durations
    result = result.replace(durationRe(), (match) => {
      notes.push(match.trim());
      return ' ';
    });

    // Extract month references (e.g., "16 Haz", "11 Haz")
    result = result.replace(monthRe(), (match) => {
      notes.push(match.trim());
      return ' ';
    });

    // Extract NOT_A_NAME phrases
    for (const phrase of NOT_A_NAME_WORDS) {
      const phraseRe = new RegExp(`\\b${escapeRegex(phrase)}\\b`, 'gi');
      result = result.replace(phraseRe, (match) => {
        notes.push(match.trim());
        return ' ';
      });
    }

    return result;
  }

  // --- Process First Name ---
  let cleanFirst = firstName;
  for (const pattern of PREFIX_PATTERNS) {
    cleanFirst = cleanFirst.replace(pattern, '');
  }
  cleanFirst = extractMetadata(cleanFirst);

  // --- Process Last Name ---
  let cleanLast = extractMetadata(lastName);

  // Check if remaining last name is still a note-like value
  const cleanLastTrimmed = cleanLast.replace(/\s+/g, ' ').trim();
  if (cleanLastTrimmed && isLikelyNote(cleanLastTrimmed)) {
    notes.push(cleanLastTrimmed);
    cleanLast = '';
  }

  // --- Process Middle Name ---
  let cleanMiddle = extractMetadata(middleName || '');

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

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Determines if a "Last Name" value is actually a note/metadata, not a real surname.
 */
function isLikelyNote(value: string): boolean {
  if (!value) return false;
  const lower = value.toLowerCase().trim();

  // Contains a date
  if (/(\d{1,2})[./](\d{1,2})[./](\d{2,4})/.test(value)) return true;

  // Contains duration
  if (/(\d+)\s*[yY][iıİ]ll[iıİ][kK]/.test(value)) return true;

  // Known note keywords
  const noteKeywords = [
    'almadı', 'almadi', 'aldı', 'aldi', 'almaz',
    'avukat', 'doktor', 'mühendis', 'muhendis',
    'öğretmen', 'ogretmen', 'üniversite', 'universite',
    'araştırma', 'arastirma', 'görevli', 'gorevli',
    'başka', 'baska', 'yerden',
    'kurye', 'hizmet', 'müşteri', 'musteri',
    'askıda', 'askida', 'iptal', 'bitti',
    'ara', 'aranacak', 'haftaya',
  ];

  for (const keyword of noteKeywords) {
    if (lower.includes(keyword)) return true;
  }

  // Starts with parentheses - it's a note: "(Serdar Bey)"
  if (value.startsWith('(')) return true;

  // Pure number or month-like: "20.08.2025", "12.08.2025"
  if (/^\d/.test(value)) return true;

  return false;
}

/**
 * Check if a final extracted name is a valid person/company name.
 * Filters out garbage results.
 */
function isValidName(name: string): boolean {
  if (!name || name.length < 2) return false;

  const lower = name.toLowerCase().trim();

  // Too short single word (likely not a name)
  const words = lower.split(/\s+/);
  if (words.length === 1 && lower.length <= 3) return false;

  // Is it just a month name? "Haz", "Ara", "Oca"
  if (words.length === 1 && MONTH_NAMES.includes(lower)) return false;

  // Is it just a number?
  if (/^\d+$/.test(name)) return false;

  // Is it a standalone month+number like "16haz"?
  if (/^\d+\s*(oca|şub|sub|mar|nis|may|haz|tem|ağu|agu|eyl|eki|kas|ara)$/i.test(lower)) return false;

  // Is it a NOT_A_NAME word?
  for (const word of NOT_A_NAME_WORDS) {
    if (lower === word) return false;
  }

  return true;
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
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true, cellText: false });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error('Excel dosyasında sayfa bulunamadı');
    const sheet = workbook.Sheets[sheetName];

    // Use raw: false with specific formatting to preserve phone numbers
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
      raw: false, // Get formatted strings, not raw numbers
    });
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
      phone: formatPhoneNumber(row['phone']) || null,
      email: row['email']?.trim() || null,
      address: row['address']?.trim() || null,
      taxNumber: row['taxNumber']?.trim() || null,
      taxOffice: row['taxOffice']?.trim() || null,
      notes: row['notes']?.trim() || null,
      renewalDate: row['renewalDate']?.trim() || null,
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

    // Validate name
    if (!isValidName(extracted.name)) continue;

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
    phone = formatPhoneNumber(phone);

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
      renewalDate: null,
    });
  }

  if (customers.length === 0) {
    throw new Error('Dosyada geçerli müşteri satırı bulunamadı');
  }

  return customers;
}
