import * as XLSX from 'xlsx';
import {
  ParsedSchedule,
  ScheduleSection,
  ScheduleEntry,
  StudyMode,
  DayOfWeek,
} from '@/types/schedule';
import {
  parseClassInfo,
  parseTimeRange,
  generateEntryId,
} from './schedule-processor';

/**
 * Parses an Excel file buffer and extracts all schedule data
 */
export function parseExcelSchedule(buffer: Buffer): ParsedSchedule {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  const sections: ScheduleSection[] = [];

  // Process each worksheet
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const sheetSections = parseWorksheet(worksheet);
    sections.push(...sheetSections);
  });

  return {
    sections,
    lastUpdated: new Date().toISOString(),
    fileHash: '', // Will be set by cache manager
  };
}

/**
 * Parses a single worksheet and extracts schedule sections
 */
function parseWorksheet(worksheet: XLSX.WorkSheet): ScheduleSection[] {
  const sections: ScheduleSection[] = [];

  // Convert sheet to JSON (array of arrays)
  const data: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    raw: false,
  });

  // Get merged cells info
  const merges = worksheet['!merges'] || [];

  console.log(`[Parser] Sheet has ${data.length} rows`);

  // Python używa wierszy 5 i 6 (0-indexed: 4 i 5)
  if (data.length < 7) {
    console.log('[Parser] Sheet too short');
    return [];
  }

  const degreeRow = data[4];  // Wiersz 5 (0-indexed) - informacje o stopniu
  const headerRow = data[5]; // Wiersz 6 (0-indexed)
  const groupRow = data[6];  // Wiersz 7 (0-indexed)


  // Znajdź wszystkie sekcje (ROK X sem Y)
  const sectionConfigs = findSections(degreeRow, headerRow, groupRow);

  console.log(`[Parser] Found ${sectionConfigs.length} sections:`, sectionConfigs);

  // Dla każdej sekcji parsuj entries
  sectionConfigs.forEach(config => {
    const entries = parseEntries(data, config, merges);

    if (entries.length > 0) {
      sections.push({
        kierunek: config.kierunek,
        stopien: config.stopien,
        rok: config.rok,
        semestr: config.semestr,
        tryb: config.tryb,
        groups: config.groups,
        entries,
      });

      console.log(`[Parser] Section ${config.kierunek} ${config.stopien} st. rok ${config.rok} sem ${config.semestr}: ${entries.length} entries, groups: ${config.groups.join(', ')}`);
    }
  });

  return sections;
}

interface SectionConfig {
  kierunek: string;
  stopien: string;
  rok: number;
  semestr: number;
  tryb: StudyMode;
  groups: string[];
  groupColumns: Record<string, number>; // grupa -> numer kolumny
}

/**
 * Finds all sections in header and group rows
 */
function findSections(degreeRow: any[], headerRow: any[], groupRow: any[]): SectionConfig[] {
  const configs: SectionConfig[] = [];

  // Krok 1: Znajdź zakresy kolumn dla I i II stopnia w wierszu z informacjami o stopniu
  const stopienRanges: Array<{ stopien: string; startCol: number; endCol: number }> = [];

  for (let idx = 0; idx < degreeRow.length; idx++) {
    const degreeCell = String(degreeRow[idx] || '').toUpperCase();
    const stopienMatch = degreeCell.match(/([IVX]+)\s*STOPIE[NŃ]/);

    if (stopienMatch) {
      const stopien = stopienMatch[1];
      const startCol = idx;

      // Znajdź koniec tego zakresu (następny stopień lub koniec wiersza)
      let endCol = degreeRow.length;
      for (let j = idx + 1; j < degreeRow.length; j++) {
        const nextCell = String(degreeRow[j] || '').toUpperCase();
        if (nextCell.match(/([IVX]+)\s*STOPIE[NŃ]/)) {
          endCol = j;
          break;
        }
      }

      stopienRanges.push({ stopien, startCol, endCol });
      console.log(`[Parser] Found ${stopien} stopień range: cols ${startCol}-${endCol}`);
    }
  }

  // Krok 2: Iteruj po kolumnach i szukaj nagłówków sekcji
  for (let idx = 0; idx < headerRow.length; idx++) {
    const headerCell = String(headerRow[idx] || '').toUpperCase();

    // Szukamy "ROK X sem Y" lub "ROK X SEM Y"
    const rokMatch = headerCell.match(/ROK\s+([IVX]+|\d+)/);
    const semMatch = headerCell.match(/SEM\s*(\d+)/);

    if (rokMatch && semMatch) {
      let rok = romanToNumber(rokMatch[1]);
      const semestr = parseInt(semMatch[1], 10);

      // Wykryj kierunek
      const kierunek = extractKierunek(headerCell) || 'Informatyka';

      // Wykryj stopień na podstawie zakresu kolumn
      let stopien = 'I'; // default
      for (const range of stopienRanges) {
        if (idx >= range.startCol && idx < range.endCol) {
          stopien = range.stopien;
          break;
        }
      }

      // Jeśli nie znaleziono w zakresach, użyj starej logiki
      if (!stopienRanges.length) {
        const stopienMatch = headerCell.match(/([IVX]+)\s*STOPIE[NŃ]/);
        stopien = stopienMatch ? stopienMatch[1] : detectStopienFromSemester(semestr);
      }

      // Wykryj tryb
      const tryb: StudyMode = headerCell.includes('NIESTACJONARN')
        ? 'niestacjonarne'
        : 'stacjonarne';

      // Teraz szukaj grup w POBLISKICH kolumnach (offset 0-15)
      // ale tylko w zakresie tego samego stopnia
      const groupColumns: Record<string, number> = {};
      const groups: string[] = [];

      // Znajdź maksymalny zakres kolumn dla tego stopnia
      const currentRange = stopienRanges.find(r => idx >= r.startCol && idx < r.endCol);
      const maxSearchCol = currentRange ? currentRange.endCol : headerRow.length;

      for (let offset = 0; offset < 15; offset++) {
        const checkIdx = idx + offset;
        // Sprawdź czy nie przekraczamy zakresu stopnia
        if (checkIdx >= maxSearchCol) break;

        if (checkIdx < groupRow.length) {
          const groupCell = String(groupRow[checkIdx] || '').trim();

          // Wykryj grupę (DS1, DS2, CY1, 11, 21, itp.)
          // Pasuje do: DS1, CY2, 11, 12, 21, 22 etc.
          if (/^([A-Z]{1,3}\d+|\d{1,2})$/.test(groupCell)) {
            // Sprawdź czy ta grupa nie jest już przypisana do innej sekcji
            const alreadyUsed = configs.some(c => c.groupColumns[groupCell] === checkIdx);
            if (!alreadyUsed && !groupColumns[groupCell]) {
              groupColumns[groupCell] = checkIdx;
              groups.push(groupCell);
            }
          }
        }
      }

      if (groups.length > 0) {
        configs.push({
          kierunek,
          stopien,
          rok,
          semestr,
          tryb,
          groups,
          groupColumns,
        });

        console.log(`[Parser] Found section: ${kierunek} ${stopien} st. rok ${rok} sem ${semestr} (${tryb}), groups at:`, groupColumns);
      }
    }
  }

  return configs;
}

/**
 * Helper to check if cell is in a merged range
 */
function isCellMerged(rowIdx: number, colIdx: number, merges: XLSX.Range[]): XLSX.Range | null {
  for (const merge of merges) {
    if (
      rowIdx >= merge.s.r &&
      rowIdx <= merge.e.r &&
      colIdx >= merge.s.c &&
      colIdx <= merge.e.c
    ) {
      return merge;
    }
  }
  return null;
}

/**
 * Parses schedule entries from data rows for a specific section
 */
function parseEntries(
  data: any[][],
  config: SectionConfig,
  merges: XLSX.Range[]
): ScheduleEntry[] {
  const entries: ScheduleEntry[] = [];

  const DATE_COL = 0;
  const TIME_COL = 1;
  const DAY_COL = 17; // Python używa 17 dla dnia tygodnia

  let currentDate: string | null = null;
  let currentDay: string | null = null;

  // Start from row 7 (Python też zaczyna od 7)
  for (let rowIdx = 7; rowIdx < data.length; rowIdx++) {
    const row = data[rowIdx];

    try {
      const dateCell = row[DATE_COL];
      const timeCell = row[TIME_COL];
      const dayCell = row[DAY_COL];

      // Update current date
      if (dateCell && String(dateCell).trim()) {
        currentDate = parseDateCell(dateCell);
      }

      // Update current day
      if (dayCell && String(dayCell).trim() && !['DS1', 'DS2'].includes(String(dayCell).trim())) {
        currentDay = String(dayCell).trim().toLowerCase();
      }

      // Parse time
      if (!timeCell || !String(timeCell).trim()) {
        continue;
      }

      const timeRange = parseTimeRange(String(timeCell));
      if (!timeRange || !currentDate || !currentDay) {
        continue;
      }

      // Parse classes using merge information
      const processedMerges = new Set<string>(); // Track which merges we've already processed

      config.groups.forEach(group => {
        const colIdx = config.groupColumns[group];
        const cellContent = row[colIdx];
        const cellStr = String(cellContent || '').trim();

        // Check if this cell is part of a merged range
        const mergeRange = isCellMerged(rowIdx, colIdx, merges);

        if (mergeRange) {
          // Create a unique key for this merge
          const mergeKey = `${rowIdx}-${mergeRange.s.c}-${mergeRange.e.c}`;

          // Skip if we've already processed this merge
          if (processedMerges.has(mergeKey)) {
            return;
          }
          processedMerges.add(mergeKey);

          // Find all groups in this merge range
          const mergedGroups: string[] = [];
          config.groups.forEach(g => {
            const gCol = config.groupColumns[g];
            if (gCol >= mergeRange.s.c && gCol <= mergeRange.e.c) {
              mergedGroups.push(g);
            }
          });

          // Get content from the first cell of the merge
          const mergeContent = String(row[mergeRange.s.c] || '').trim();

          if (mergeContent && mergeContent !== '---') {
            const classInfo = parseClassInfo(mergeContent);

            if (classInfo) {
              const groupLabel = mergedGroups.join(', ');

              const entry: ScheduleEntry = {
                id: generateEntryId(currentDate!, `${timeRange.start}-${timeRange.end}`, groupLabel, classInfo.subject),
                date: currentDate!,
                day: currentDay! as DayOfWeek,
                time: `${timeRange.start}-${timeRange.end}`,
                start_time: timeRange.start,
                end_time: timeRange.end,
                group: groupLabel,
                class_info: classInfo,
                kierunek: config.kierunek,
                stopien: config.stopien,
                rok: config.rok,
                semestr: config.semestr,
                tryb: config.tryb,
              };

              entries.push(entry);
            }
          }
        } else {
          // Not merged - process normally
          if (cellContent && cellStr !== '' && cellStr !== '---') {
            const classInfo = parseClassInfo(cellStr);

            if (classInfo) {
              const entry: ScheduleEntry = {
                id: generateEntryId(currentDate!, `${timeRange.start}-${timeRange.end}`, group, classInfo.subject),
                date: currentDate!,
                day: currentDay! as DayOfWeek,
                time: `${timeRange.start}-${timeRange.end}`,
                start_time: timeRange.start,
                end_time: timeRange.end,
                group,
                class_info: classInfo,
                kierunek: config.kierunek,
                stopien: config.stopien,
                rok: config.rok,
                semestr: config.semestr,
                tryb: config.tryb,
              };

              entries.push(entry);
            }
          }
        }
      });

    } catch (err) {
      // Skip problematic rows
      continue;
    }
  }

  return entries;
}

/**
 * Parses date cell (Excel serial or string)
 */
function parseDateCell(value: any): string | null {
  if (!value) return null;

  // If it's a number (Excel serial date)
  if (typeof value === 'number') {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      const year = date.y;
      const month = String(date.m).padStart(2, '0');
      const day = String(date.d).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  // If it's already a string date
  if (typeof value === 'string') {
    // Try parsing ISO format
    const isoMatch = value.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return value;
    }

    // Try parsing other formats
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  return null;
}

/**
 * Converts Roman numerals to numbers
 */
function romanToNumber(roman: string): number {
  const romanMap: Record<string, number> = {
    I: 1,
    II: 2,
    III: 3,
    IV: 4,
    V: 5,
    VI: 6,
    VII: 7,
    VIII: 8,
  };

  return romanMap[roman] || parseInt(roman, 10) || 0;
}

/**
 * Extracts kierunek (field of study) from header text
 */
function extractKierunek(headerText: string): string | null {
  const kierunki = [
    'INFORMATYKA',
    'ELEKTRONIKA',
    'TELEKOMUNIKACJA',
    'AUTOMATYKA',
    'ROBOTYKA',
  ];

  for (const kierunek of kierunki) {
    if (headerText.includes(kierunek)) {
      return kierunek.charAt(0) + kierunek.slice(1).toLowerCase();
    }
  }

  return null;
}

/**
 * Detects stopień based on semester number
 */
function detectStopienFromSemester(semestr: number): string {
  return semestr <= 6 ? 'I' : 'II';
}
