import * as XLSX from 'xlsx';
import { ScheduleParser, ParseResult, CellDebugInfo, ParseStats } from './base-parser';
import {
  ParsedSchedule,
  ScheduleSection,
  ScheduleEntry,
  ClassInfo,
  ClassType,
  StudyMode,
  DayOfWeek,
} from '@/types/schedule';
import { parseTimeRange, generateEntryId } from '../schedule-processor';
import { turso } from '../turso';

interface InstructorEntity {
  id: string;
  full_name: string;
  abbreviations: string[];
}

interface SubjectEntity {
  id: string;
  name: string;
  abbreviations: string[];
  kierunek: string;
  stopien: string;
  rok: number;
  semestr: number;
  tryb: string;
}

/**
 * V3 Database-Aware Parser
 * Uses database instructors and subjects for exact matching
 * No fuzzy matching - must be exact alias or main name
 */
export class V3DatabaseAwareParser extends ScheduleParser {
  readonly version = '3.0';
  readonly name = 'DB-Aware Parser V3';
  readonly description = 'Parser using database for exact instructor/subject matching. Splits cells by TAB/4+ spaces/newline.';

  private instructorsByAlias = new Map<string, InstructorEntity>();
  private subjectsByAlias = new Map<string, SubjectEntity[]>(); // Can have multiple subjects with same alias in different contexts

  async parse(buffer: Buffer): Promise<ParseResult> {
    const startTime = Date.now();
    const debugInfo: CellDebugInfo[] = [];
    const unknownInstructors = new Map<string, { occurrences: number; contexts: string[] }>();
    const unknownSubjects = new Map<string, { occurrences: number; contexts: string[] }>();

    // Load database entities
    console.log('[V3] Loading database entities...');
    await this.loadDatabaseEntities();
    console.log(`[V3] Loaded ${this.instructorsByAlias.size} instructor aliases, ${this.subjectsByAlias.size} subject aliases`);

    // Read workbook
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });

    const sections: ScheduleSection[] = [];
    let totalCells = 0;
    let parsedCells = 0;
    let errorCells = 0;

    // Process each sheet
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const data: any[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        raw: false,
      });

      const merges = worksheet['!merges'] || [];

      if (data.length < 7) {
        console.log(`[V3] Sheet ${sheetName} too short, skipping`);
        return;
      }

      const degreeRow = data[4];
      const headerRow = data[5];
      const groupRow = data[6];

      // Find sections
      const sectionConfigs = this.findSections(degreeRow, headerRow, groupRow);
      console.log(`[V3] Sheet ${sheetName}: Found ${sectionConfigs.length} sections`);

      // Parse entries for each section
      sectionConfigs.forEach(config => {
        const { entries, cellDebugInfo } = this.parseEntries(
          data,
          config,
          merges,
          unknownInstructors,
          unknownSubjects
        );

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
        }

        debugInfo.push(...cellDebugInfo);
        totalCells += cellDebugInfo.length;
        parsedCells += cellDebugInfo.filter(d => d.interpretation.type !== 'unknown' && d.interpretation.type !== 'empty').length;
        errorCells += cellDebugInfo.filter(d => d.errors.length > 0).length;
      });
    });

    const schedule: ParsedSchedule = {
      sections,
      lastUpdated: new Date().toISOString(),
      fileHash: '',
    };

    const totalEntries = sections.reduce((acc, s) => acc + s.entries.length, 0);

    const stats: ParseStats = {
      totalCells,
      parsedCells,
      emptyCells: totalCells - parsedCells - errorCells,
      errorCells,
      totalEntries,
      successfulParses: totalEntries,
      failedParses: 0,
      unknownInstructors: Array.from(unknownInstructors.entries()).map(([value, data]) => ({
        value,
        ...data,
      })),
      unknownSubjects: Array.from(unknownSubjects.entries()).map(([value, data]) => ({
        value,
        ...data,
      })),
      processingTime: Date.now() - startTime,
    };

    console.log(`[V3] Parsing complete: ${totalEntries} entries, ${stats.unknownInstructors.length} unknown instructors, ${stats.unknownSubjects.length} unknown subjects`);

    return {
      schedule,
      stats,
      debugInfo,
      parserVersion: this.version,
      parserName: this.name,
    };
  }

  private async loadDatabaseEntities() {
    // Load instructors
    const instructorsResult = await turso.execute('SELECT id, full_name, abbreviations FROM instructors');
    instructorsResult.rows.forEach((row: any) => {
      const instructor: InstructorEntity = {
        id: row.id,
        full_name: row.full_name,
        abbreviations: JSON.parse(row.abbreviations || '[]'),
      };

      // Index by full name (case-insensitive)
      this.instructorsByAlias.set(instructor.full_name.toLowerCase(), instructor);

      // Index by each abbreviation (case-insensitive)
      instructor.abbreviations.forEach(abbr => {
        this.instructorsByAlias.set(abbr.toLowerCase(), instructor);
      });
    });

    // Load subjects
    const subjectsResult = await turso.execute('SELECT id, name, abbreviations, kierunek, stopien, rok, semestr, tryb FROM subjects');
    subjectsResult.rows.forEach((row: any) => {
      const subject: SubjectEntity = {
        id: row.id,
        name: row.name,
        abbreviations: JSON.parse(row.abbreviations || '[]'),
        kierunek: row.kierunek,
        stopien: row.stopien,
        rok: row.rok,
        semestr: row.semestr,
        tryb: row.tryb,
      };

      // Index by name (case-insensitive)
      const nameLower = subject.name.toLowerCase();
      if (!this.subjectsByAlias.has(nameLower)) {
        this.subjectsByAlias.set(nameLower, []);
      }
      this.subjectsByAlias.get(nameLower)!.push(subject);

      // Index by each abbreviation (case-insensitive)
      subject.abbreviations.forEach(abbr => {
        const abbrLower = abbr.toLowerCase();
        if (!this.subjectsByAlias.has(abbrLower)) {
          this.subjectsByAlias.set(abbrLower, []);
        }
        this.subjectsByAlias.get(abbrLower)!.push(subject);
      });
    });
  }

  private findSections(degreeRow: any[], headerRow: any[], groupRow: any[]) {
    const sectionConfigs: Array<{
      kierunek: string;
      stopien: string;
      rok: number;
      semestr: number;
      tryb: StudyMode;
      groups: string[];
      groupColumns: Record<string, number>;
    }> = [];

    // Find degree ranges
    const stopienRanges: Array<{ stopien: string; startCol: number; endCol: number }> = [];

    for (let idx = 0; idx < degreeRow.length; idx++) {
      const degreeCell = String(degreeRow[idx] || '').toUpperCase();
      const stopienMatch = degreeCell.match(/([IVX]+)\s*STOPIE[NŃ]/);

      if (stopienMatch) {
        const stopien = stopienMatch[1];
        const startCol = idx;

        let endCol = degreeRow.length;
        for (let j = idx + 1; j < degreeRow.length; j++) {
          const nextCell = String(degreeRow[j] || '').toUpperCase();
          if (nextCell.match(/([IVX]+)\s*STOPIE[NŃ]/)) {
            endCol = j;
            break;
          }
        }

        stopienRanges.push({ stopien, startCol, endCol });
      }
    }

    // Find sections in header row
    for (let idx = 0; idx < headerRow.length; idx++) {
      const headerCell = String(headerRow[idx] || '').toUpperCase();

      const rokMatch = headerCell.match(/ROK\s+([IVX]+|\d+)/);
      const semMatch = headerCell.match(/SEM\s*(\d+)?/);

      if (rokMatch && semMatch) {
        let rok = this.romanToNumber(rokMatch[1]);

        // If semester number is missing, infer from year (ROK I = sem 1, ROK II = sem 3, etc)
        let semestr: number;
        if (semMatch[1]) {
          semestr = parseInt(semMatch[1], 10);
        } else {
          // Default: ROK I → sem 1, ROK II → sem 3, ROK III → sem 5, ROK IV → sem 7
          semestr = (rok - 1) * 2 + 1;
        }

        const kierunek = this.extractKierunek(headerCell) || 'Informatyka';

        let stopien = 'I';
        for (const range of stopienRanges) {
          if (idx >= range.startCol && idx < range.endCol) {
            stopien = range.stopien;
            break;
          }
        }

        const tryb: StudyMode = headerCell.includes('NIESTACJONARN')
          ? 'niestacjonarne'
          : 'stacjonarne';

        // Find groups
        const groupColumns: Record<string, number> = {};
        const groups: string[] = [];

        const currentRange = stopienRanges.find(r => idx >= r.startCol && idx < r.endCol);
        const maxSearchCol = currentRange ? currentRange.endCol : headerRow.length;

        for (let offset = 0; offset < 15; offset++) {
          const checkIdx = idx + offset;
          if (checkIdx >= maxSearchCol) break;

          if (checkIdx < groupRow.length) {
            const groupCell = String(groupRow[checkIdx] || '').trim();

            if (/^([A-Z]{1,3}\d+|\d{1,2})$/.test(groupCell)) {
              const alreadyUsed = sectionConfigs.some(c => c.groupColumns[groupCell] === checkIdx);

              // Filter groups by year: first digit should match rok
              // Example: ROK I (rok=1) should only take groups 11, 12 (first digit = 1)
              let matchesYear = true;
              if (/^\d{1,2}$/.test(groupCell)) {
                const firstDigit = parseInt(groupCell[0], 10);
                matchesYear = firstDigit === rok;
              }

              if (!alreadyUsed && !groupColumns[groupCell] && matchesYear) {
                groupColumns[groupCell] = checkIdx;
                groups.push(groupCell);
              }
            }
          }
        }

        if (groups.length > 0) {
          sectionConfigs.push({
            kierunek,
            stopien,
            rok,
            semestr,
            tryb,
            groups,
            groupColumns,
          });
        }
      }
    }

    return sectionConfigs;
  }

  private parseEntries(
    data: any[][],
    config: any,
    merges: XLSX.Range[],
    unknownInstructors: Map<string, { occurrences: number; contexts: string[] }>,
    unknownSubjects: Map<string, { occurrences: number; contexts: string[] }>
  ): { entries: ScheduleEntry[]; cellDebugInfo: CellDebugInfo[] } {
    const entries: ScheduleEntry[] = [];
    const cellDebugInfo: CellDebugInfo[] = [];

    const DATE_COL = 0;
    const TIME_COL = 1;
    const DAY_COL = 17;

    let currentDate: string | null = null;
    let currentDay: string | null = null;

    for (let rowIdx = 7; rowIdx < data.length; rowIdx++) {
      const row = data[rowIdx];

      try {
        const dateCell = row[DATE_COL];
        const timeCell = row[TIME_COL];
        const dayCell = row[DAY_COL];

        // Update date
        if (dateCell && String(dateCell).trim()) {
          const newDate = this.parseDateCell(dateCell);
          if (newDate) {
            currentDate = newDate;
          }
        }

        // Update day
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

        // Parse classes for each group
        const processedMerges = new Set<string>();

        config.groups.forEach((group: string) => {
          const colIdx = config.groupColumns[group];
          const cellContent = row[colIdx];
          const cellStr = String(cellContent || '').trim();

          // Check merged cells
          const mergeRange = this.isCellMerged(rowIdx, colIdx, merges);

          if (mergeRange) {
            const mergeKey = `${rowIdx}-${mergeRange.s.c}-${mergeRange.e.c}`;
            if (processedMerges.has(mergeKey)) {
              return;
            }
            processedMerges.add(mergeKey);

            const mergedGroups: string[] = [];
            config.groups.forEach((g: string) => {
              const gCol = config.groupColumns[g];
              if (gCol >= mergeRange.s.c && gCol <= mergeRange.e.c) {
                mergedGroups.push(g);
              }
            });

            const mergeContent = String(row[mergeRange.s.c] || '').trim();

            if (mergeContent && mergeContent !== '---' && currentDate) {
              const { classInfo, debugInfo } = this.parseClassInfo(
                mergeContent,
                config,
                currentDate,
                mergedGroups.join(', '),
                unknownInstructors,
                unknownSubjects
              );

              cellDebugInfo.push({
                row: rowIdx,
                col: mergeRange.s.c,
                rawValue: mergeContent,
                ...debugInfo,
              });

              if (classInfo) {
                const actualTime = classInfo.overrideTime || timeRange;

                const entry: ScheduleEntry = {
                  id: generateEntryId(),
                  date: currentDate!,
                  day: currentDay! as DayOfWeek,
                  time: `${actualTime.start}-${actualTime.end}`,
                  start_time: actualTime.start,
                  end_time: actualTime.end,
                  group: mergedGroups.join(', '),
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
            // Not merged
            if (cellContent && cellStr !== '' && cellStr !== '---' && currentDate) {
              const { classInfo, debugInfo } = this.parseClassInfo(
                cellStr,
                config,
                currentDate,
                group,
                unknownInstructors,
                unknownSubjects
              );

              cellDebugInfo.push({
                row: rowIdx,
                col: colIdx,
                rawValue: cellStr,
                ...debugInfo,
              });

              if (classInfo) {
                const actualTime = classInfo.overrideTime || timeRange;

                const entry: ScheduleEntry = {
                  id: generateEntryId(),
                  date: currentDate!,
                  day: currentDay! as DayOfWeek,
                  time: `${actualTime.start}-${actualTime.end}`,
                  start_time: actualTime.start,
                  end_time: actualTime.end,
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
        continue;
      }
    }

    return { entries, cellDebugInfo };
  }

  private parseClassInfo(
    cellContent: string,
    config: any,
    currentDate: string,
    group: string,
    unknownInstructors: Map<string, { occurrences: number; contexts: string[] }>,
    unknownSubjects: Map<string, { occurrences: number; contexts: string[] }>
  ): {
    classInfo: ClassInfo | null;
    debugInfo: Pick<CellDebugInfo, 'interpretation' | 'warnings' | 'errors' | 'context'>;
  } {
    const warnings: string[] = [];
    const errors: string[] = [];
    const contextStr = `${config.kierunek} ${config.stopien}st. R${config.rok} S${config.semestr}`;

    if (!cellContent || cellContent.trim() === '' || cellContent.trim() === '---') {
      return {
        classInfo: null,
        debugInfo: {
          interpretation: {
            type: 'empty',
            parsedValue: null,
            confidence: 1.0,
          },
          warnings: [],
          errors: [],
        },
      };
    }

    // Strategy: Find class type keyword as separator
    // LEFT of type = subject (+ optional time)
    // RIGHT of type = instructor and room

    let overrideTime: { start: string; end: string } | undefined;
    let subjectText = '';
    let typeText = '';
    let instructorText = '';
    let roomText = '';
    let is_remote_flag = false;

    // Class type keywords to search for
    const typeKeywords = [
      'wykład',
      'wykłady',
      'ćwiczenia',
      'ćwiczenie',
      'laboratorium',
      'lab',
      'projekt',
      'projekty',
      'seminarium'
    ];

    // Try to find class type keyword in content
    let typeKeyword: string | null = null;
    let typeIndex = -1;

    for (const keyword of typeKeywords) {
      // Use lookahead/lookbehind or space boundaries instead of \b (doesn't work well with polish chars)
      const regex = new RegExp(`(^|\\s)${keyword}($|\\s|\\.)`, 'i');
      const match = cellContent.match(regex);
      if (match && match.index !== undefined) {
        typeKeyword = match[0].trim().replace(/\.$/, ''); // Remove trailing dot if present
        // Adjust index to skip leading space if present
        typeIndex = match.index + (match[1] ? match[1].length : 0);
        break;
      }
    }

    if (typeKeyword && typeIndex >= 0) {
      // Split by type keyword
      let leftPart = cellContent.substring(0, typeIndex).trim();
      let rightPart = cellContent.substring(typeIndex + typeKeyword.length).trim();

      typeText = typeKeyword;

      // Clean up rightPart: remove leading dots, spaces, etc
      rightPart = rightPart.replace(/^[\.\s]+/, '').trim();

      // Parse LEFT part: [optional time] subject
      // BUT: if leftPart is empty and rightPart has content in first line,
      // it means type was on same line as subject (e.g., "Analiza matematyczna ćwiczenia")
      // In this case, we need to look at the line before type keyword in original content

      if (!leftPart || leftPart.length === 0) {
        // Type keyword was at the beginning, or subject+type are together
        // Look at the full line containing the type
        const lines = cellContent.split(/\n/);
        const firstLine = lines[0];

        // Extract subject from first line (everything before type keyword)
        const typeInLineMatch = firstLine.match(new RegExp(`^(.+?)\\s*${typeKeyword}`, 'i'));
        if (typeInLineMatch) {
          subjectText = typeInLineMatch[1].trim();

          // Check for time in subject
          const timeMatch = subjectText.match(/^(\d{1,2}:\d{2}-\d{1,2}:\d{2})\s+(.+)$/);
          if (timeMatch) {
            const parsedTime = parseTimeRange(timeMatch[1]);
            if (parsedTime) {
              overrideTime = parsedTime;
              subjectText = timeMatch[2].trim();
            }
          }

          // RightPart should be rest of lines after first
          if (lines.length > 1) {
            rightPart = lines.slice(1).join('\n').trim();
            rightPart = rightPart.replace(/^[\.\s]+/, '').trim();
          }
        } else {
          subjectText = leftPart;
        }
      } else {
        // Normal case: leftPart has content
        const timeMatch = leftPart.match(/^(\d{1,2}:\d{2}-\d{1,2}:\d{2})\s+(.+)$/);
        if (timeMatch) {
          const parsedTime = parseTimeRange(timeMatch[1]);
          if (parsedTime) {
            overrideTime = parsedTime;
            subjectText = timeMatch[2].trim();
          } else {
            subjectText = leftPart;
          }
        } else {
          subjectText = leftPart;
        }
      }

      // Parse RIGHT part: instructor and room
      // Check if ZDALNIE/ZDALNE first
      const remoteMatch = rightPart.match(/\b(zdalnie?)\b/i);
      is_remote_flag = !!remoteMatch;

      // Remove ZDALNIE from right part
      let cleanedRightPart = rightPart;
      if (remoteMatch) {
        cleanedRightPart = rightPart.replace(/\b(zdalnie?)\b/gi, '').trim();
      }

      // Extract rooms (pattern: "s. XXX" where s. is at word boundary)
      const roomMatches = cleanedRightPart.match(/\bs\.\s*[^\s,]+(\s+[A-Z]+)?/gi) || [];
      roomText = roomMatches.join(', ');

      // Remove rooms from text to get instructors
      let instructorsOnly = cleanedRightPart;
      roomMatches.forEach(room => {
        instructorsOnly = instructorsOnly.replace(room, '');
      });

      // Clean up instructor text
      instructorText = instructorsOnly
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/,\s*,/g, ','); // Remove double commas

      // Filter out group/level codes (B2, C1, A1, etc - single letter + number)
      instructorText = instructorText
        .split(',')
        .map(part => {
          // Remove patterns like "B2", "C1" that are not part of names
          return part.replace(/\s+[A-Z]\d+\b/g, '').trim();
        })
        .filter(p => p.length > 0)
        .join(', ');

    } else {
      // Fallback: no type keyword found
      // Use old logic: split by TAB/4+ spaces/newline
      const parts = cellContent
        .split(/\t|\n|    +/)
        .map(p => p.trim())
        .filter(p => p.length > 0);

      if (parts.length === 0) {
        return {
          classInfo: null,
          debugInfo: {
            interpretation: {
              type: 'empty',
              parsedValue: null,
              confidence: 1.0,
            },
            warnings: [],
            errors: [],
          },
        };
      }

      // Check if first part is time
      let partIdx = 0;
      if (parts[0].match(/^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/)) {
        const timeMatch = parseTimeRange(parts[0]);
        if (timeMatch) {
          overrideTime = timeMatch;
          partIdx = 1;
        }
      }

      // Edge case: subject followed directly by instructors (no type)
      // Example: "J. angielski mgr A. Zając B2, mgr A. Gunia-Tracz C1..."
      if (partIdx < parts.length) {
        subjectText = parts[partIdx++];
        typeText = ''; // No type found

        // Rest is instructors and rooms mixed
        const remaining = parts.slice(partIdx).join(' ');

        // Check if ZDALNIE/ZDALNE
        const remoteMatch = remaining.match(/\b(zdalnie?)\b/i);
        is_remote_flag = !!remoteMatch;

        let cleanedRemaining = remaining;
        if (remoteMatch) {
          cleanedRemaining = remaining.replace(/\b(zdalnie?)\b/gi, '').trim();
        }

        // Extract rooms (pattern: "s. XXX" where s. is at word boundary)
        const roomMatches = cleanedRemaining.match(/\bs\.\s*[^\s,]+(\s+[A-Z]+)?/gi) || [];
        roomText = roomMatches.join(', ');

        // Remove rooms from remaining to get instructors
        let instructorsPart = cleanedRemaining;
        roomMatches.forEach(room => {
          instructorsPart = instructorsPart.replace(room, '');
        });

        // Clean up and remove group/level codes
        instructorText = instructorsPart
          .trim()
          .replace(/\s+/g, ' ')
          .replace(/,\s*,/g, ',');

        // Filter out group/level codes (B2, C1, etc)
        instructorText = instructorText
          .split(',')
          .map(part => {
            return part.replace(/\s+[A-Z]\d+\b/g, '').trim();
          })
          .filter(p => p.length > 0)
          .join(', ');
      }
    }

    // Match subject
    let matchedSubject: SubjectEntity | null = null;
    let subjectConfidence = 0;

    if (subjectText) {
      const candidates = this.subjectsByAlias.get(subjectText.toLowerCase()) || [];

      // Filter by context
      const contextMatches = candidates.filter(s =>
        s.kierunek === config.kierunek &&
        s.stopien === config.stopien &&
        s.rok === config.rok &&
        s.semestr === config.semestr
      );

      if (contextMatches.length > 0) {
        matchedSubject = contextMatches[0];
        subjectConfidence = 1.0;
      } else if (candidates.length > 0) {
        // Found in DB but wrong context
        matchedSubject = candidates[0];
        subjectConfidence = 0.5;
        warnings.push(`Subject found but context mismatch: ${contextStr}`);
      } else {
        // Not found
        subjectConfidence = 0;

        if (!unknownSubjects.has(subjectText)) {
          unknownSubjects.set(subjectText, { occurrences: 0, contexts: [] });
        }
        const data = unknownSubjects.get(subjectText)!;
        data.occurrences++;
        if (!data.contexts.includes(contextStr)) {
          data.contexts.push(contextStr);
        }

        warnings.push(`Unknown subject: ${subjectText}`);
      }
    }

    // Match instructors (can be multiple: "A, B" or "A / B")
    // BUT: "dr X, prof. PK" is ONE person (prof. PK is a title)
    // First, normalize titles that follow commas
    let normalizedInstructorText = instructorText
      .replace(/,\s*(prof\.?\s*PK)/gi, ' $1')  // "X, prof. PK" -> "X prof. PK"
      .replace(/,\s*(dr\s+hab\.?)/gi, ' $1')   // "X, dr hab." -> "X dr hab."
      .replace(/,\s*(prof\.?)/gi, ' $1');       // "X, prof." -> "X prof."

    const instructorParts = normalizedInstructorText
      .split(/[,\/]/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const matchedInstructors: InstructorEntity[] = [];
    let instructorConfidence = 0;

    instructorParts.forEach(instrPart => {
      const instructor = this.instructorsByAlias.get(instrPart.toLowerCase());
      if (instructor) {
        matchedInstructors.push(instructor);
        instructorConfidence = 1.0;
      } else {
        if (!unknownInstructors.has(instrPart)) {
          unknownInstructors.set(instrPart, { occurrences: 0, contexts: [] });
        }
        const data = unknownInstructors.get(instrPart)!;
        data.occurrences++;
        if (!data.contexts.includes(contextStr)) {
          data.contexts.push(contextStr);
        }

        warnings.push(`Unknown instructor: ${instrPart}`);
      }
    });

    // Determine class type
    const type = this.parseClassType(typeText);

    // Determine if remote (check both is_remote_flag if it exists, and roomText)
    const is_remote = (typeof is_remote_flag !== 'undefined' ? is_remote_flag : false) ||
                      roomText.toUpperCase().includes('ZDALNIE') ||
                      roomText.toUpperCase().includes('ZDALNE');

    // Build ClassInfo
    const classInfo: ClassInfo = {
      subject: matchedSubject ? matchedSubject.name : subjectText,
      type,
      instructor: matchedInstructors.length > 0
        ? matchedInstructors.map(i => i.full_name).join(', ')
        : instructorText || null,
      room: is_remote ? null : (roomText || null),
      is_remote,
      raw: cellContent,
      overrideTime,
    };

    const avgConfidence = (subjectConfidence + instructorConfidence) / 2;

    return {
      classInfo,
      debugInfo: {
        interpretation: {
          type: 'subject',
          parsedValue: classInfo,
          confidence: avgConfidence,
          matchedEntity: matchedSubject
            ? {
                id: matchedSubject.id,
                name: matchedSubject.name,
                alias: subjectText,
                source: 'database',
              }
            : undefined,
        },
        warnings,
        errors,
        context: {
          section: contextStr,
          group,
          date: currentDate,
        },
      },
    };
  }

  private parseClassType(typeText: string): ClassType | null {
    if (!typeText) return null;

    const typeLower = typeText.toLowerCase().trim();

    if (typeLower.includes('wykład')) return 'wykład';
    if (typeLower.includes('lab')) return 'laboratorium';
    if (typeLower.includes('ćwicz')) return 'ćwiczenia';
    if (typeLower.includes('projekt')) return 'projekt';
    if (typeLower === 'p') return 'projekt';
    if (typeLower === 'w') return 'wykład';
    if (typeLower === 'l') return 'laboratorium';
    if (typeLower === 'ć') return 'ćwiczenia';

    return null;
  }

  private parseDateCell(value: any): string | null {
    if (!value) return null;

    if (typeof value === 'number') {
      const date = XLSX.SSF.parse_date_code(value);
      if (date) {
        const year = date.y;
        const month = String(date.m).padStart(2, '0');
        const day = String(date.d).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }

    if (typeof value === 'string') {
      const isoMatch = value.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (isoMatch) {
        return value;
      }

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

  private romanToNumber(roman: string): number {
    const romanMap: Record<string, number> = {
      I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8,
    };
    return romanMap[roman] || parseInt(roman, 10) || 0;
  }

  private extractKierunek(headerText: string): string | null {
    const kierunki = [
      'INFORMATYKA', 'ELEKTRONIKA', 'TELEKOMUNIKACJA',
      'AUTOMATYKA', 'ROBOTYKA',
    ];

    for (const kierunek of kierunki) {
      if (headerText.includes(kierunek)) {
        return kierunek.charAt(0) + kierunek.slice(1).toLowerCase();
      }
    }

    return null;
  }

  private isCellMerged(rowIdx: number, colIdx: number, merges: XLSX.Range[]): XLSX.Range | null {
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
}
