import { ClassInfo, ClassType } from '@/types/schedule';
import { mapSubjectName } from './subjects-map';

// Mapa skrótów przedmiotów do pełnych nazw (DEPRECATED - używaj mapSubjectName)
const SUBJECT_MAP: Record<string, string> = {
  'EDT': 'Eksploracja danych tekstowych',
  'SND': 'Sieci neuronowe i deep learning',
  'SNiDP': 'Sieci neuronowe i deep learning',
  'SR': 'Systemy rekomendacyjne',
  'ZPI': 'Zarządzanie projektem informatycznym',
  'ZTKiK': 'Zaawansowane technologie komunikacji i komputerów',
  'BD': 'Big Data',
  'BwST': 'Bezpieczeństwo w sieciach telekomunikacyjnych',
  'BAM': 'Bezpieczeństwo aplikacji mobilnych',
};

// Mapa skrótów prowadzących do pełnych nazwisk
const INSTRUCTOR_MAP: Record<string, string> = {
  'OB': 'dr Olaf Bar',
  'MB': 'dr hab. inż. Michał Bereta, prof. PK',
  'JB': 'dr inż. Jerzy Białas',
  'LB': 'dr hab. inż. Lesław Bieniasz, prof. PK',
  'PB': 'mgr inż. Piotr Biskup',
  'GB': 'mgr inż. Grzegorz Bogdał',
  'BB': 'dr Barbara Borowik',
  'TB': 'prof. zw.dr hab. inż. Tadeusz Burczyński',
  'DC': 'Dominika Cywicka',
  'SD': 'prof.dr hab. Stanisław Drożdż',
  'PD': 'dr Piotr Drygaś',
  'SF': 'dr hab.inż. Sergiy Fialko, prof. PK',
  'MG': 'mgr inż. Michał Gandor',
  'ŁG': 'mgr inż. Łukasz Gaża',
  'TG': 'dr inż. Tomasz Gąciarz',
  'DG': 'dr inż. Daniel Grzonka',
  'AJ': 'dr Agnieszka Jakóbik',
  'PJ': 'dr inż. Paweł Jarosz',
  'AJ-S': 'dr inż. Anna Jasińska-Suwada',
  'MJ': 'dr hab. inż. Maciej Jaworski, prof. PK',
  'JK': 'dr hab. Joanna Kołodziej, prof. PK',
  'FK': 'dr inż. Filip Krużel',
  'WK': 'dr inż. Wojciech Książek',
  'DK': 'mgr inż. Dominik Kulis',
  'RK': 'dr Radosław Kycia',
  'JL': 'dr hab. inż. Jacek Leśkow, prof. PK',
  'PŁ': 'dr inż. Piotr Łabędź',
  'ML': 'mgr inż. Maryna Łukaczyk',
  'AM': 'dr Adam Marszałek',
  'MNaw': 'mgr inż. Mateusz Nawrocki',
  'MNied': 'mgr inż. Michał Niedźwiecki',
  'MNiedz': 'mgr inż. Michał Niedźwiecki',
  'ANiem': 'dr Agnieszka Niemczynowicz',
  'AN': 'dr inż. Artur Niewiarowski',
  'MN': 'mgr inż. Mateusz Nytko',
  'HO': 'mgr inż. Hubert Orlicki',
  'JO': 'mgr inż. Jerzy Orlof',
  'PO': 'dr hab. inż. arch. Paweł Ozimek, prof. PK',
  'IP': 'prof. dr hab. Irina Perfiljeva',
  'AP': 'dr inż. Anna Plichta',
  'PPł': 'dr hab. inż. Paweł Pławiak, prof. PK',
  'WR': 'prof.dr hab. inż. Waldemar Rachowicz',
  'ARP': 'mgr inż. Aleksander Radwan-Pragłowski',
  'DR': 'mgr inż. Dominika Rola',
  'MR': 'mgr inż. Mirosław Roszkowski',
  'KS': 'dr inż. Krzysztof Skabek',
  'MS': 'dr hab. inż. Marek Stanuszek, prof. PK',
  'KSw': 'mgr inż. Krzysztof Swałdek',
  'PSz': 'mgr inż. Piotr Szuster',
  'FT': 'mgr inż. Filip Turza',
  'IU': 'dr Ilona Urbaniak',
  'MW': 'dr Marcin Wątorek',
  'AWid': 'mgr inż. Adrian Widłak',
  'AW': 'dr inż. Andrzej Wilczyński',
  'JW.': 'mgr inż. Jan Wojtas',
  'AWoź': 'mgr inż. Andrzej Woźniacki',
  'AWyrz': 'dr Adam Wyrzykowski',
  'Mzom': 'dr Maryam Zomorodi Moghaddam, prof. PK',
  'DŻ': 'dr inż. Dariusz Żelasko',
  'TL': 'dr Tomasz Ligocki',
};

/**
 * Parses a cell content and extracts class information
 *
 * Tab-separated format:
 * [0] Subject (full name or abbreviation)
 * [1] Type (P = projekt, lab. = laboratorium, wykład = wykład)
 * [2] Instructor (full name or abbreviation)
 * [3] Location (room or "ZDALNIE")
 *
 * Examples:
 * "Eksploracja danych tekstowych\twykład\tdr Radosław Kycia\tZDALNIE"
 * "EDT\tP\tAN\ts. 114 GIL"
 * "Big Data\twykład\tTomasz Ligocki\tZDALNIE"
 */
export function parseClassInfo(cellContent: string): ClassInfo | null {
  if (!cellContent || cellContent.trim() === '' || cellContent.trim() === '---') {
    return null;
  }

  // Normalizacja: usuń ": - :" jeśli występuje
  let raw = cellContent.trim().replace(/:\s*-\s*:/g, '').trim();

  // Wykryj zmienioną godzinę na początku (np. "13:45-16:15  Przedmiot...")
  let overrideTime: { start: string; end: string } | null = null;
  const timeMatch = raw.match(/^(\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})\s+(.+)$/);
  if (timeMatch) {
    const timeRange = parseTimeRange(timeMatch[1]);
    if (timeRange) {
      overrideTime = timeRange;
      raw = timeMatch[2]; // Usuń godzinę z contentu
    }
  }

  // Try tab or multiple-space separated format (columnar data)
  // Excel często używa wielokrotnych spacji zamiast tabów
  if (raw.includes('\t') || raw.match(/\s{2,}/)) {
    const parts = raw.includes('\t')
      ? raw.split('\t').map(p => p.trim())
      : raw.split(/\s{2,}/).map(p => p.trim()).filter(p => p);

    if (parts.length >= 2) {
      // Usuń ": - :" z nazwy przedmiotu jeśli występuje
      let subjectRaw = (parts[0] || '').replace(/:\s*-\s*:/g, '').trim();
      const typeRaw = parts[1] || '';
      const instructorRaw = parts[2] || '';
      const locationRaw = parts[3] || '';

      // Expand subject abbreviation
      const subject = expandSubject(subjectRaw);

      // Parse type
      const type = parseType(typeRaw);

      // Expand instructor abbreviation
      const instructor = expandInstructor(instructorRaw);

      // Check if remote
      const is_remote = locationRaw.toUpperCase().includes('ZDALNIE') ||
                        locationRaw.toUpperCase().includes('ZDALNE');

      // Extract room (if not remote)
      const room = is_remote ? null : parseRoom(locationRaw);

      return {
        subject,
        type,
        instructor: instructor || null,
        room,
        is_remote,
        raw: cellContent.trim(),
        overrideTime: overrideTime || undefined,
      };
    }
  }

  // Fallback to old regex-based parsing for non-tab-separated data
  const is_remote = raw.toUpperCase().includes('ZDALNIE') || raw.toUpperCase().includes('ZDALNE');
  const type = detectClassType(raw);
  const instructor = extractInstructor(raw);
  const room = extractRoom(raw);
  const subject = extractSubject(raw, type, instructor, room, is_remote);

  return {
    subject,
    type,
    instructor,
    room: is_remote ? null : room,
    is_remote,
    raw: cellContent.trim(),
    overrideTime: overrideTime || undefined,
  };
}

/**
 * Expand subject abbreviation to full name
 */
function expandSubject(subjectRaw: string): string {
  if (!subjectRaw) return '';

  // Usuń standalone " P" z końca (typ zajęć - projekt)
  let cleaned = subjectRaw.trim().replace(/\s+P\s*$/g, '').trim();

  // Check if it's an abbreviation in SUBJECT_MAP
  if (SUBJECT_MAP[cleaned]) {
    return SUBJECT_MAP[cleaned];
  }

  // Otherwise use mapSubjectName for comprehensive mapping
  const mapped = mapSubjectName(cleaned);
  return mapped || cleaned;
}

/**
 * Parse type from type column
 */
function parseType(typeRaw: string): ClassType {
  if (!typeRaw) return null;

  const lower = typeRaw.toLowerCase().trim();

  if (lower === 'p' || lower.includes('projekt')) {
    return 'projekt';
  }
  if (lower === 'wykład' || lower.includes('wykład')) {
    return 'wykład';
  }
  if (lower === 'lab.' || lower === 'lab' || lower.includes('laborator')) {
    return 'laboratorium';
  }
  if (lower.includes('ćwiczenia') || lower.includes('cwiczenia')) {
    return 'ćwiczenia';
  }

  return null;
}

/**
 * Expand instructor abbreviation to full name
 */
function expandInstructor(instructorRaw: string): string | null {
  if (!instructorRaw) return null;

  const trimmed = instructorRaw.trim();

  // Check if it's an abbreviation in INSTRUCTOR_MAP
  if (INSTRUCTOR_MAP[trimmed]) {
    return INSTRUCTOR_MAP[trimmed];
  }

  // Check if it already contains a title (dr, mgr, prof.) - then it's already full name
  const titles = ['dr hab. inż.', 'dr hab.', 'dr inż.', 'mgr inż.', 'prof.', 'dr', 'mgr'];
  for (const title of titles) {
    if (trimmed.includes(title)) {
      return trimmed; // Already full name with title
    }
  }

  // Check if it's a name without title (like "Tomasz Ligocki")
  // Search in INSTRUCTOR_MAP values
  const instructorFullNames = Object.values(INSTRUCTOR_MAP);
  for (const fullName of instructorFullNames) {
    // Extract name only (without titles)
    let nameOnly = fullName;
    for (const title of titles) {
      nameOnly = nameOnly.replace(title, '').trim();
    }
    nameOnly = nameOnly.replace(/,?\s*prof\.\s*PK\s*$/i, '').trim();

    // Check if matches
    if (nameOnly.toLowerCase() === trimmed.toLowerCase()) {
      return fullName; // Return full name with title
    }
  }

  // Return as-is if not found
  return trimmed || null;
}

/**
 * Parse room from location column
 */
function parseRoom(locationRaw: string): string | null {
  if (!locationRaw || locationRaw.toUpperCase().includes('ZDALNIE')) {
    return null;
  }

  const trimmed = locationRaw.trim();

  // Format: "s. 114 GIL" -> "sala 114 GIL"
  const roomMatch = trimmed.match(/s\.\s*(\d+[A-Za-z]?\s*[A-Z]*)/i);
  if (roomMatch) {
    return `sala ${roomMatch[1].trim()}`;
  }

  // Already formatted as "sala 114"
  if (trimmed.toLowerCase().startsWith('sala')) {
    return trimmed;
  }

  // Just a number/code
  if (trimmed.match(/^\d+/)) {
    return `sala ${trimmed}`;
  }

  return trimmed || null;
}

/**
 * Detects the type of class from the cell content
 */
function detectClassType(content: string): ClassType {
  const lower = content.toLowerCase();

  if (lower.includes('wykład')) {
    return 'wykład';
  }

  if (lower.includes('lab.') || lower.includes('laborator')) {
    return 'laboratorium';
  }

  // Check for standalone "P" (projekt)
  const words = content.split(/\s+/);
  if (words.some(word => word === 'P')) {
    return 'projekt';
  }

  if (lower.includes('ćwiczenia') || lower.includes('cwiczenia')) {
    return 'ćwiczenia';
  }

  return null;
}

/**
 * Extracts instructor abbreviation and expands it to full name
 * Format: "... wykład RK ZDALNIE" -> "dr Radosław Kycia"
 */
function extractInstructor(content: string): string | null {
  // Usuń śmieci żeby nie przeszkadzało
  let cleanContent = content
    .replace(/ZDALNIE?/gi, '')
    .replace(/s\.\s*\d+[A-Za-z]?\s*[A-Z]{2,}/gi, '')
    .replace(/s\.\s*\d+[A-Za-z]?/gi, '')
    .replace(/sala\s+\d+[A-Za-z]?\s*[A-Z]{0,}/gi, '')
    .replace(/\$?[Gg][wpkWPK]\d+/g, '')
    .trim();

  // Usuń typ zajęć (z word boundaries żeby nie usuwać fragmentów słów)
  const typeKeywords = ['wykład', 'laboratorium', 'lab\\.', 'ćwiczenia', 'cwiczenia', '\\sP\\s'];
  for (const keyword of typeKeywords) {
    cleanContent = cleanContent.replace(new RegExp(`\\b${keyword}\\b`, 'gi'), ' ');
  }

  // Usuń nazwy przedmiotów (sprawdzaj skróty i pełne nazwy)
  const subjectAbbreviations = Object.keys(SUBJECT_MAP);
  for (const abbr of subjectAbbreviations) {
    const regex = new RegExp(`\\b${abbr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    cleanContent = cleanContent.replace(regex, ' ');
  }
  const subjectFullNames = Object.values(SUBJECT_MAP);
  for (const name of subjectFullNames) {
    cleanContent = cleanContent.replace(new RegExp(name, 'gi'), ' ');
  }

  cleanContent = cleanContent.trim();

  // Szukaj skrótów prowadzących (sortuj od najdłuższych do najkrótszych)
  const abbreviations = Object.keys(INSTRUCTOR_MAP).sort((a, b) => b.length - a.length);

  for (const abbr of abbreviations) {
    // Szukaj skrótu jako osobnego słowa (z word boundaries)
    const regex = new RegExp(`\\b${abbr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    if (regex.test(cleanContent)) {
      return INSTRUCTOR_MAP[abbr];
    }
  }

  // Fallback: szukaj pełnego tytułu
  const titles = [
    'dr hab. inż.',
    'dr hab.',
    'dr inż.',
    'mgr inż.',
    'prof. PK',
    'prof. dr hab.',
    'prof. zw.dr hab. inż.',
    'prof.dr hab. inż.',
    'prof.dr hab.',
    'prof.',
    'dr',
    'mgr',
  ];

  // Szukaj tytułu w tekście i zwróć fragment od tytułu do końca (nazwisko)
  for (const title of titles) {
    const titleIndex = cleanContent.indexOf(title);
    if (titleIndex !== -1) {
      // Zwróć tytuł + nazwisko (do końca linii lub przecinka/ZDALNIE)
      let instructorPart = cleanContent.substring(titleIndex);

      // Przytnij do końca nazwiska (przed ZDALNIE, s., liczbami itp.)
      instructorPart = instructorPart
        .replace(/\s+ZDALNIE?.*/gi, '')
        .replace(/\s+s\.\s*\d+.*/gi, '')
        .replace(/\s+\d+.*/g, '')
        .replace(/,.*$/g, '') // Usuń wszystko po przecinku
        .trim();

      // Weź tylko pierwsze 3-5 słów (tytuł + imię + nazwisko + ewentualnie prof. PK)
      const words = instructorPart.split(/\s+/);
      instructorPart = words.slice(0, Math.min(5, words.length)).join(' ');

      if (instructorPart.length > title.length) {
        return instructorPart;
      }
    }
  }

  // Fallback 2: szukaj pełnego imienia i nazwiska z mapy (bez tytułu)
  // Stwórz mapę: nazwisko -> pełne dane
  const nameMap: Record<string, string> = {};
  Object.values(INSTRUCTOR_MAP).forEach(fullName => {
    // Wyciągnij samo imię i nazwisko (usuń tytuł)
    let nameOnly = fullName;
    for (const title of titles) {
      nameOnly = nameOnly.replace(title, '').trim();
    }
    // Usuń "prof. PK" z końca jeśli jest
    nameOnly = nameOnly.replace(/,?\s*prof\.\s*PK\s*$/i, '').trim();

    if (nameOnly) {
      nameMap[nameOnly.toLowerCase()] = fullName;
    }
  });

  // Sprawdź czy czysty content zawiera któreś z imion i nazwisk
  const cleanLower = cleanContent.toLowerCase();
  for (const [nameOnly, fullName] of Object.entries(nameMap)) {
    if (cleanLower.includes(nameOnly)) {
      return fullName;
    }
  }

  return null;
}

/**
 * Extracts clean subject name by removing type, instructor, and location info
 * Also expands subject abbreviations (EDT -> Eksploracja danych tekstowych)
 */
function extractSubject(
  raw: string,
  type: ClassType,
  instructor: string | null,
  room: string | null,
  isRemote: boolean
): string {
  let subject = raw;

  // Najpierw rozwiń skróty przedmiotów (sortuj od najdłuższych)
  const subjectAbbreviations = Object.keys(SUBJECT_MAP).sort((a, b) => b.length - a.length);
  for (const abbr of subjectAbbreviations) {
    const regex = new RegExp(`\\b${abbr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    if (regex.test(subject)) {
      return SUBJECT_MAP[abbr]; // Zwróć od razu pełną nazwę
    }
  }

  // Jeśli nie znaleziono skrótu, wyczyść nazwę z metadanych

  // Usuń typ zajęć (z word boundaries żeby nie usuwać fragmentów słów)
  const typeKeywords = ['wykład', 'laboratorium', 'lab\\.', 'ćwiczenia', 'cwiczenia', '\\sP\\s'];
  for (const keyword of typeKeywords) {
    subject = subject.replace(new RegExp(`\\b${keyword}\\b`, 'gi'), ' ');
  }

  // Usuń kody zajęć (Gw01, Gp02, GK02, $p02, $w01 itp.)
  subject = subject.replace(/\$?[Gg][wpkWPK]\d+/g, ' ');

  // Usuń skróty prowadzących
  const instructorAbbreviations = Object.keys(INSTRUCTOR_MAP);
  for (const abbr of instructorAbbreviations) {
    const regex = new RegExp(`\\b${abbr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    subject = subject.replace(regex, ' ');
  }

  // Usuń pełne tytuły i nazwiska prowadzących
  const titles = [
    'dr hab. inż.',
    'dr hab.',
    'dr inż.',
    'mgr inż.',
    'prof. PK',
    'prof. dr hab.',
    'prof. zw.dr hab. inż.',
    'prof.dr hab. inż.',
    'prof.dr hab.',
    'prof.',
    'dr',
    'mgr',
  ];

  // Znajdź PIERWSZY tytuł w tekście (najmniejszy index)
  let firstTitleIndex = -1;
  for (const title of titles) {
    const titleIndex = subject.indexOf(title);
    if (titleIndex !== -1) {
      if (firstTitleIndex === -1 || titleIndex < firstTitleIndex) {
        firstTitleIndex = titleIndex;
      }
    }
  }

  if (firstTitleIndex !== -1) {
    // Usuń wszystko od pierwszego tytułu do końca
    subject = subject.substring(0, firstTitleIndex).trim();
  }

  // Usuń imiona i nazwiska prowadzących (bez tytułów) z INSTRUCTOR_MAP
  // Np. "Big Data Tomasz Ligocki" -> "Big Data"
  const instructorFullNames = Object.values(INSTRUCTOR_MAP);
  for (const fullName of instructorFullNames) {
    // Usuń tytuły i zostaw samo imię i nazwisko
    let nameOnly = fullName;
    for (const title of titles) {
      nameOnly = nameOnly.replace(title, '').trim();
    }
    // Usuń też ", prof. PK" i podobne
    nameOnly = nameOnly.replace(/,?\s*prof\.\s*PK\s*$/i, '').trim();

    if (nameOnly && nameOnly.length > 3) {
      const nameRegex = new RegExp(`\\b${nameOnly.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      subject = subject.replace(nameRegex, ' ');
    }
  }

  // Usuń "ZDALNIE"
  subject = subject.replace(/ZDALNIE?/gi, ' ');

  // Usuń numery sal (z nazwą budynku lub bez)
  subject = subject.replace(/s\.\s*\d+[A-Za-z]?\s*[A-Z]{2,}/gi, ' ');
  subject = subject.replace(/s\.\s*\d+[A-Za-z]?/gi, ' ');
  subject = subject.replace(/sala\s+\d+[A-Za-z]?\s*[A-Z]{0,}/gi, ' ');

  // Usuń liczby i przecinki
  subject = subject.replace(/\d+/g, ' ');
  subject = subject.replace(/,/g, ' ');

  // Usuń wielokrotne spacje i trim
  subject = subject.replace(/\s+/g, ' ').trim();

  // Map subject name using the comprehensive subjects map (with fallback)
  const mappedSubject = mapSubjectName(subject);

  return mappedSubject || subject || raw;
}

/**
 * Extracts room number from the cell content
 * Format: "s. 114 GIL" -> "sala 114 GIL"
 */
function extractRoom(content: string): string | null {
  // Format: "s. 114 GIL" (z nazwą budynku)
  const roomMatch = content.match(/s\.\s*(\d+[A-Za-z]?\s*[A-Z]{2,})/i);

  if (roomMatch) {
    return `sala ${roomMatch[1].trim()}`;
  }

  // Format: "s. 114" (bez nazwy budynku)
  const roomMatch2 = content.match(/s\.\s*(\d+[A-Za-z]?)/i);

  if (roomMatch2) {
    return `sala ${roomMatch2[1]}`;
  }

  // Alternative format: "sala XXX"
  const roomMatch3 = content.match(/sala\s+(\d+[A-Za-z]?\s*[A-Z]{0,})/i);

  if (roomMatch3) {
    return `sala ${roomMatch3[1].trim()}`;
  }

  return null;
}

/**
 * Parses time range from cell content
 * Format: "HH:MM-HH:MM" or "H:MM-HH:MM"
 */
export function parseTimeRange(timeStr: string): { start: string; end: string } | null {
  if (!timeStr) return null;

  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/);

  if (!match) return null;

  const [, startHour, startMin, endHour, endMin] = match;

  const start = `${startHour.padStart(2, '0')}:${startMin}`;
  const end = `${endHour.padStart(2, '0')}:${endMin}`;

  return { start, end };
}

/**
 * Checks if a given day is a weekend (Saturday or Sunday)
 */
export function isWeekend(day: string): boolean {
  const lower = day.toLowerCase();
  return lower.includes('sobota') || lower.includes('niedziela');
}

/**
 * Generates a unique ID for a schedule entry
 */
export function generateEntryId(
  date: string,
  time: string,
  group: string,
  subject: string
): string {
  const normalized = `${date}-${time}-${group}-${subject}`.toLowerCase().replace(/\s+/g, '-');
  return Buffer.from(normalized).toString('base64');
}
