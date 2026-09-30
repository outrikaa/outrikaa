// Smart column detection for lead CSV imports.
// Handles arbitrary headers: case, spaces, typos, mixed delimiters,
// email hidden inside other columns, "Full Name" splitting, content sniffing.

export const LEAD_FIELDS = [
  'first_name',
  'last_name',
  'email',
  'phone',
  'company',
  'job_title',
  'website',
  'linkedin_url',
  'location',
  'industry',
  'company_size',
  'source',
] as const;

export type LeadField = (typeof LEAD_FIELDS)[number];
export type DetectedField = LeadField | 'full_name';

const EMPTY_MARKERS = new Set(['', '-', '--', 'n/a', 'na', 'null', 'none', 'undefined', '?', '#n/a', 'nil']);

const EMAIL_RE = /[^\s<>,;"']+@[^\s<>,;"']+\.[A-Za-z]{2,}/;
const EMAIL_LIKE_RE = /\S+@\S+\.\S+/;
const PHONE_RE = /^\+?[\d\s()\-.]{7,}$/;

export function normalizeHeader(header: string): string {
  return header
    .replace(/^\uFEFF/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[\s_\-./#()]+/g, '');
}

function cleanCell(value: string): string {
  const v = (value ?? '').trim();
  return EMPTY_MARKERS.has(v.toLowerCase()) ? '' : v;
}

function extractEmail(value: string): string {
  const m = value.match(EMAIL_RE);
  return (m ? m[0] : value).trim().toLowerCase();
}

function looksLikePhone(value: string): boolean {
  return PHONE_RE.test(value) && value.replace(/\D/g, '').length >= 7;
}

function ratio(values: string[], test: (v: string) => boolean): number {
  const nonEmpty = values.filter((v) => v !== '');
  if (nonEmpty.length === 0) return 0;
  return nonEmpty.filter(test).length / nonEmpty.length;
}

// Ordered: first match wins (specific before generic).
// full_name must precede first/last_name — "fullname" contains "lname".
const HEADER_RULES: Array<{ field: DetectedField; test: (h: string) => boolean }> = [
  { field: 'email', test: (h) => h.includes('mail') || h === 'email' || h === 'gmail' || h === 'correo' || h === 'e mail' },
  {
    field: 'full_name',
    test: (h) =>
      h === 'name' || h === 'fullname' || h.includes('fullname') || h.includes('contactname') ||
      h.includes('personname') || h.includes('leadname') || h.includes('customername') ||
      h === 'contact' || h === 'person' || h === 'customer' || h === 'contactperson',
  },
  { field: 'first_name', test: (h) => h.includes('firstname') || h.includes('fname') || h.includes('givenname') || h.includes('forename') || h === 'first' },
  { field: 'last_name', test: (h) => h.includes('lastname') || h.includes('lname') || h.includes('surname') || h.includes('familyname') || h === 'last' },
  {
    field: 'phone',
    test: (h) =>
      h.includes('phone') || h.includes('mobile') || h.includes('whatsapp') ||
      h.includes('contactno') || h.includes('mobileno') || h === 'tel' || h.includes('telephone'),
  },
  {
    field: 'job_title',
    test: (h) =>
      h.includes('jobtitle') || h.includes('designation') || h.includes('position') ||
      h === 'title' || h === 'role' || h.includes('jobrole') || h.includes('job'),
  },
  {
    field: 'company_size',
    test: (h) => h.includes('companysize') || h.includes('employee') || h.includes('headcount') || h === 'size' || h.includes('staffcount'),
  },
  {
    field: 'company',
    test: (h) =>
      h.includes('company') || h.includes('organiz') || h.includes('organis') || h.includes('orgname') ||
      h === 'org' || h.includes('business') || h === 'firm' || h.includes('employer') || h.includes('agency'),
  },
  { field: 'linkedin_url', test: (h) => h.includes('linkedin') || h.includes('liurl') },
  { field: 'website', test: (h) => h.includes('website') || h.includes('webpage') || h === 'url' || h === 'site' || h.includes('homepage') || h === 'domain' || h === 'web' },
  { field: 'location', test: (h) => h.includes('location') || h.includes('address') || h === 'city' || h === 'country' || h === 'region' || h.includes('area') || h === 'state' },
  { field: 'industry', test: (h) => h.includes('industry') || h.includes('sector') || h.includes('niche') || h.includes('vertical') },
  { field: 'source', test: (h) => h === 'source' || h === 'channel' || h === 'origin' || h.includes('leadsource') },
];

function headerField(header: string): DetectedField | null {
  const h = normalizeHeader(header);
  if (!h) return null;
  for (const rule of HEADER_RULES) {
    if (rule.test(h)) return rule.field;
  }
  return null;
}

/**
 * Auto-detect lead columns from headers + a sample of rows.
 * Content sniffing wins when the header is ambiguous or missing
 * (e.g. "Contact" column full of emails -> email).
 */
export function autoDetectColumns(headers: string[], sampleRows: string[][]): Record<string, DetectedField> {
  const mapping: Record<string, DetectedField> = {};
  const assigned = new Set<DetectedField>();

  const columns = headers.map((_, i) =>
    sampleRows.slice(0, 25).map((row) => cleanCell(row[i] ?? ''))
  );

  // Pass 1: confident header matches.
  headers.forEach((header, i) => {
    const field = headerField(header);
    if (field && !assigned.has(field)) {
      mapping[String(i)] = field;
      assigned.add(field);
    }
  });

  // Pass 2: content sniffing for email (and phone) in unmapped columns.
  headers.forEach((header, i) => {
    const key = String(i);
    if (mapping[key]) return;
    const values = columns[i];
    const emailRatio = ratio(values, (v) => EMAIL_LIKE_RE.test(v));
    if (emailRatio >= 0.5 && !assigned.has('email')) {
      mapping[key] = 'email';
      assigned.add('email');
      return;
    }
    const headerGuess = headerField(header);
    if (headerGuess === 'email' && !assigned.has('email') && emailRatio > 0) {
      mapping[key] = 'email';
      assigned.add('email');
      return;
    }
    const phoneRatio = ratio(values, looksLikePhone);
    if (phoneRatio >= 0.6 && !assigned.has('phone')) {
      mapping[key] = 'phone';
      assigned.add('phone');
      return;
    }
    if (headerGuess === 'full_name' && emailRatio >= 0.5 && !assigned.has('email')) {
      mapping[key] = 'email';
      assigned.add('email');
    }
  });

  // Pass 3: ambiguous "name"-ish header that actually holds emails, or vice versa.
  Object.keys(mapping).forEach((key) => {
    const field = mapping[key];
    const values = columns[Number(key)];
    if (field === 'full_name' && ratio(values, (v) => EMAIL_LIKE_RE.test(v)) >= 0.6 && !assigned.has('email')) {
      mapping[key] = 'email';
      assigned.add('email');
    }
    if (field === 'email' && ratio(values, (v) => EMAIL_LIKE_RE.test(v)) < 0.2) {
      delete mapping[key];
      assigned.delete('email');
      const guess = headerField(headers[Number(key)]);
      if (guess && guess !== 'email' && !assigned.has(guess)) {
        mapping[key] = guess;
        assigned.add(guess);
      }
    }
  });

  return mapping;
}

/** Split "Jane Marie Doe" -> { first: "Jane", last: "Marie Doe" } */
export function splitFullName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: '', last: '' };
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
}

/**
 * Turn a raw CSV row + column mapping into a clean lead object.
 * Handles full-name splitting, email extraction from messy cells and
 * empty-marker cleanup.
 */
export function rowToLead(
  row: string[],
  mapping: Record<string, string>
): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const [idx, field] of Object.entries(mapping)) {
    if (!field) continue;
    const raw = cleanCell(row[Number(idx)] ?? '');
    if (field === 'full_name') {
      const { first, last } = splitFullName(raw);
      if (first) obj.first_name = first;
      if (last) obj.last_name = last;
      continue;
    }
    if (field === 'email') {
      const email = extractEmail(raw);
      if (email) obj.email = email;
      continue;
    }
    obj[field] = raw;
  }
  return obj;
}
