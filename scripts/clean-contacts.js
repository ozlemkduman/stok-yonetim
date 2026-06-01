#!/usr/bin/env node
/**
 * Telefon rehberi CSV dosyasını temizleyip müşteri import'a hazır hale getirir.
 *
 * Kullanım:
 *   node scripts/clean-contacts.js contacts.csv
 *   node scripts/clean-contacts.js contacts.csv -o temiz-musteriler.csv
 *
 * Ne yapar:
 *   - "E İmza", "E-İmza" prefix'lerini temizler
 *   - ✅ emoji'leri kaldırır
 *   - Tarihleri, süreleri (3yıllık) ve notları ayıklar
 *   - Telefon numaralarını HAM haliyle korur (Excel bozması yok)
 *   - Geçersiz isimleri filtreler
 *   - Çıktı: musteri_adi;telefon;email;notlar
 */

const fs = require('fs');
const path = require('path');

// --- Args ---
const args = process.argv.slice(2);
if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
  console.log(`
Kullanım: node scripts/clean-contacts.js <dosya.csv> [-o cikti.csv]

Örnek:
  node scripts/clean-contacts.js ~/Downloads/contacts.csv
  node scripts/clean-contacts.js contacts.csv -o temiz.csv
`);
  process.exit(0);
}

const inputFile = args[0];
const outputIdx = args.indexOf('-o');
const outputFile = outputIdx >= 0 && args[outputIdx + 1]
  ? args[outputIdx + 1]
  : inputFile.replace(/\.csv$/i, '-temiz.csv');

if (!fs.existsSync(inputFile)) {
  console.error(`Hata: Dosya bulunamadı: ${inputFile}`);
  process.exit(1);
}

// --- CSV Parser (ham metin, Excel yok) ---
function parseCsvLine(line, delimiter) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];
    if (inQuotes) {
      if (char === '"' && next === '"') { current += '"'; i++; }
      else if (char === '"') { inQuotes = false; }
      else { current += char; }
    } else {
      if (char === '"') { inQuotes = true; }
      else if (char === delimiter) { fields.push(current); current = ''; }
      else { current += char; }
    }
  }
  fields.push(current);
  return fields;
}

function detectDelimiter(line) {
  const semi = (line.match(/;/g) || []).length;
  const comma = (line.match(/,/g) || []).length;
  const tab = (line.match(/\t/g) || []).length;
  if (tab > semi && tab > comma) return '\t';
  if (semi > comma) return ';';
  return ',';
}

// --- Name cleaning ---
const PREFIX_RE = [
  /^e\s*[-–—]\s*[iİ]mza\s*/i,
  /^e\s+[iİ]mza\s*/i,
  /^e[-]?[iİ]mza\s*/i,
];
const EMOJI_RE = /[\u2705\u2611\u2714\u2716\u274C\u274E\u2B50\u{1F4E6}\u{1F4E5}\u{1F44D}\u{1F44E}]/gu;
const DATE_RE = /(\d{1,2})[./](\d{1,2})[./](\d{2,4})/g;
const DURATION_RE = /(\d+)\s*[yY][iıİ]ll[iıİ][kK]/g;
const MONTH_RE = /\b(\d{1,2})\s*(Oca|Şub|Sub|Mar|Nis|May|Haz|Tem|Ağu|Agu|Eyl|Eki|Kas|Ara)\b/gi;
const MONTHS_LOWER = ['oca', 'şub', 'sub', 'mar', 'nis', 'may', 'haz', 'tem', 'ağu', 'agu', 'eyl', 'eki', 'kas', 'ara'];

const NOT_A_NAME = [
  'müşteri', 'musteri', 'haber ver', 'haber', 'ara', 'aranacak',
  'haftaya', 'yarın', 'yarin', 'bugün', 'bugun',
  'almadı', 'almadi', 'aldı', 'aldi', 'almaz',
  'başka yerden', 'baska yerden', 'kurye', 'hizmeti', 'hizmet',
  'askıda', 'askida', 'iptal', 'bitti', 'kapandı', 'kapandi',
  'deneme', 'test',
];

const NOTE_KEYWORDS = [
  'almadı', 'almadi', 'aldı', 'aldi', 'avukat', 'doktor',
  'mühendis', 'muhendis', 'öğretmen', 'ogretmen',
  'üniversite', 'universite', 'araştırma', 'arastirma',
  'görevli', 'gorevli', 'başka', 'baska', 'yerden',
  'kurye', 'hizmet', 'müşteri', 'musteri',
  'askıda', 'askida', 'iptal', 'bitti',
  'ara', 'aranacak', 'haftaya',
];

function cleanField(text) {
  const notes = [];
  let clean = text;

  // Remove prefix
  for (const re of PREFIX_RE) { clean = clean.replace(re, ''); }
  // Remove emojis
  clean = clean.replace(EMOJI_RE, '');
  // Extract dates
  clean = clean.replace(new RegExp(DATE_RE.source, 'g'), (m) => { notes.push(`Tarih: ${m}`); return ' '; });
  // Extract durations
  clean = clean.replace(new RegExp(DURATION_RE.source, 'g'), (m) => { notes.push(m.trim()); return ' '; });
  // Extract month refs
  clean = clean.replace(new RegExp(MONTH_RE.source, 'gi'), (m) => { notes.push(m.trim()); return ' '; });
  // Extract NOT_A_NAME keywords
  for (const phrase of NOT_A_NAME) {
    const re = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    clean = clean.replace(re, (m) => { notes.push(m.trim()); return ' '; });
  }

  return { clean: clean.replace(/\s+/g, ' ').trim(), notes };
}

function isLikelyNote(value) {
  if (!value) return false;
  const lower = value.toLowerCase().trim();
  if (/(\d{1,2})[./](\d{1,2})[./](\d{2,4})/.test(value)) return true;
  if (/(\d+)\s*[yY][iıİ]ll[iıİ][kK]/.test(value)) return true;
  if (value.startsWith('(')) return true;
  if (/^\d/.test(value)) return true;
  for (const kw of NOTE_KEYWORDS) { if (lower.includes(kw)) return true; }
  return false;
}

function isValidName(name) {
  if (!name || name.length < 2) return false;
  const lower = name.toLowerCase().trim();
  const words = lower.split(/\s+/);
  if (words.length === 1 && lower.length <= 3) return false;
  if (words.length === 1 && MONTHS_LOWER.includes(lower)) return false;
  if (/^\d+$/.test(name)) return false;
  if (/^\d+\s*(oca|şub|sub|mar|nis|may|haz|tem|ağu|agu|eyl|eki|kas|ara)$/i.test(lower)) return false;
  for (const w of NOT_A_NAME) { if (lower === w) return false; }
  return true;
}

// --- Main ---
const raw = fs.readFileSync(inputFile, 'utf-8').replace(/^\uFEFF/, '');
const lines = raw.split(/\r?\n/).filter(l => l.trim());

if (lines.length < 2) {
  console.error('Hata: Dosyada yeterli veri yok');
  process.exit(1);
}

const delimiter = detectDelimiter(lines[0]);
const headers = parseCsvLine(lines[0], delimiter).map(h => h.trim().toLowerCase());

// Detect contacts format
const isContacts = headers.includes('first name') && headers.includes('last name');

if (!isContacts) {
  console.error('Bu dosya rehber formatında değil (First Name / Last Name kolonları bulunamadı).');
  console.error('Standart formattaki dosyaları doğrudan siteden yükleyebilirsiniz.');
  process.exit(1);
}

// Find column indices
const colIdx = (name) => headers.indexOf(name);
const firstNameIdx = colIdx('first name');
const middleNameIdx = colIdx('middle name');
const lastNameIdx = colIdx('last name');

// Find phone column
const phoneColumnCandidates = [
  'phone 1 - value', 'phone 2 - value',
  'primary phone', 'mobile phone', 'phone', 'mobile',
];
let phoneIdx = -1;
for (const c of phoneColumnCandidates) {
  const idx = colIdx(c);
  if (idx >= 0) { phoneIdx = idx; break; }
}

// Find email column
const emailCandidates = [
  'e-mail 1 - value', 'e-mail 2 - value',
  'primary email', 'email', 'e-mail',
];
let emailIdx = -1;
for (const c of emailCandidates) {
  const idx = colIdx(c);
  if (idx >= 0) { emailIdx = idx; break; }
}

// Find org column
const orgCandidates = ['organization 1 - name', 'organization name', 'company'];
let orgIdx = -1;
for (const c of orgCandidates) {
  const idx = colIdx(c);
  if (idx >= 0) { orgIdx = idx; break; }
}

console.log(`\nDosya: ${inputFile}`);
console.log(`Toplam satır: ${lines.length - 1}`);
console.log(`Ayraç: ${delimiter === ',' ? 'virgül' : delimiter === ';' ? 'noktalı virgül' : 'tab'}`);
console.log(`Telefon kolonu: ${phoneIdx >= 0 ? headers[phoneIdx] : 'bulunamadı'}`);
console.log(`Email kolonu: ${emailIdx >= 0 ? headers[emailIdx] : 'bulunamadı'}`);
console.log('');

const results = [];
let skipped = 0;

for (let i = 1; i < lines.length; i++) {
  const values = parseCsvLine(lines[i], delimiter);

  const firstName = (values[firstNameIdx] || '').trim();
  const middleName = middleNameIdx >= 0 ? (values[middleNameIdx] || '').trim() : '';
  const lastName = lastNameIdx >= 0 ? (values[lastNameIdx] || '').trim() : '';

  if (!firstName && !middleName && !lastName) continue;

  // Detect if this is an e-imza entry
  const isEimza = /^e\s*[-–—.]?\s*[iİ]mza/i.test(firstName);

  let name;
  let renewalDate = '';
  const allNotes = [];

  if (isEimza) {
    // E-imza: orijinal ismi kullan, sadece tarihi ayır
    const rawFull = [firstName, middleName, lastName].filter(Boolean).join(' ');

    // Extract first date -> yenileme tarihi
    const dateMatch = rawFull.match(/(\d{1,2})[./](\d{1,2})[./](\d{2,4})/);
    if (dateMatch) {
      renewalDate = dateMatch[0];
    }

    // Use original as name (with E-imza prefix, as user wants)
    name = rawFull.replace(/\s+/g, ' ').trim();
  } else {
    // Non e-imza: clean normally
    const firstResult = cleanField(firstName);
    const middleResult = cleanField(middleName);
    const lastResult = cleanField(lastName);

    allNotes.push(...firstResult.notes, ...middleResult.notes, ...lastResult.notes);

    // Extract renewal date from notes if present
    const dateNote = allNotes.find(n => n.startsWith('Tarih: '));
    if (dateNote) {
      renewalDate = dateNote.replace('Tarih: ', '');
    }

    let cleanLast = lastResult.clean;
    if (cleanLast && isLikelyNote(cleanLast)) {
      allNotes.push(cleanLast);
      cleanLast = '';
    }

    name = [firstResult.clean, middleResult.clean, cleanLast]
      .filter(Boolean)
      .join(' ')
      .replace(/^[-–—\s]+|[-–—\s]+$/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!isValidName(name)) {
      skipped++;
      continue;
    }
  }

  if (!name || name.length < 1) {
    skipped++;
    continue;
  }

  // Remove "Tarih: ..." from notes since it's now in renewalDate
  const filteredNotes = isEimza ? [] : allNotes.filter(n => !n.startsWith('Tarih: '));

  // Phone - HAM OLARAK al
  let phone = phoneIdx >= 0 ? (values[phoneIdx] || '').trim() : '';
  phone = phone.replace(/^["']+|["']+$/g, '').trim();

  // Fix scientific notation (9.05378E+11 -> 905378000000 -> 0 537 800 00 00)
  // NOT: Bu dönüşümde son rakamlar kaybolur çünkü CSV zaten bozuk.
  const sciMatch = phone.match(/^(\d+[.,]\d+)[eE]\+(\d+)$/);
  if (sciMatch) {
    const num = parseFloat(phone.replace(',', '.'));
    if (!isNaN(num)) {
      phone = Math.round(num).toString();
    }
  }

  // Format Turkish phone numbers
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('90')) {
    const r = digits.substring(2);
    phone = `0${r.substring(0, 3)} ${r.substring(3, 6)} ${r.substring(6, 8)} ${r.substring(8, 10)}`;
  } else if (digits.length === 11 && digits.startsWith('0')) {
    phone = `${digits.substring(0, 4)} ${digits.substring(4, 7)} ${digits.substring(7, 9)} ${digits.substring(9, 11)}`;
  } else if (digits.length === 10 && digits.startsWith('5')) {
    phone = `0${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6, 8)} ${digits.substring(8, 10)}`;
  }

  // Email
  let email = emailIdx >= 0 ? (values[emailIdx] || '').trim() : '';
  email = email.replace(/^["']+|["']+$/g, '').trim();

  // Org
  if (orgIdx >= 0 && values[orgIdx]?.trim()) {
    allNotes.push(`Firma: ${values[orgIdx].trim()}`);
  }

  // Deduplicate notes (tarih notları artık renewalDate'te)
  const notes = [...new Set(filteredNotes.map(n => n.trim()).filter(Boolean))];

  // Original raw entry for reference
  const originalParts = [firstName, middleName, lastName].filter(Boolean);
  const original = originalParts.join(' | ');

  results.push({
    name,
    phone,
    email,
    notes: notes.join(', '),
    renewalDate,
    original,
  });
}

// --- Output ---
const outputLines = ['musteri_adi;telefon;email;notlar;yenileme_tarihi;orijinal_kayit'];
for (const r of results) {
  const esc = (v) => v.includes(';') ? `"${v}"` : v;
  outputLines.push(`${esc(r.name)};${esc(r.phone)};${esc(r.email)};${esc(r.notes)};${r.renewalDate};${esc(r.original)}`);
}

fs.writeFileSync(outputFile, '\uFEFF' + outputLines.join('\n'), 'utf-8');

console.log(`Sonuç:`);
console.log(`  Geçerli müşteri: ${results.length}`);
console.log(`  Atlanan (geçersiz isim): ${skipped}`);
console.log(`  Çıktı dosyası: ${outputFile}`);
console.log('');
console.log('Bu dosyayı siteden "Toplu Müşteri Yükle" ile yükleyebilirsiniz.');
