import * as XLSX from 'xlsx';
import { ScheduleParser, ParseResult, CellDebugInfo, ParseStats } from './base-parser';
import { parseExcelSchedule } from '../excel-parser';

/**
 * V1 Basic Parser - wraps the original excel-parser with debug capabilities
 * This parser uses the existing parseExcelSchedule function but adds debug tracking
 */
export class V1BasicParser extends ScheduleParser {
  readonly version = '1.0';
  readonly name = 'Basic Parser V1';
  readonly description = 'Original parser with basic debug information. Uses pattern matching and heuristics.';

  async parse(buffer: Buffer): Promise<ParseResult> {
    const startTime = Date.now();
    const debugInfo: CellDebugInfo[] = [];
    const unknownInstructors = new Map<string, { occurrences: number; contexts: string[] }>();
    const unknownSubjects = new Map<string, { occurrences: number; contexts: string[] }>();

    // Read workbook for debug info
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });

    // Collect cell-level debug info
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const data: any[][] = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        raw: false,
      });

      // Track all cells
      data.forEach((row, rowIdx) => {
        row.forEach((cellValue, colIdx) => {
          if (cellValue && String(cellValue).trim()) {
            // Determine cell type based on position and content
            const cellType = this.determineCellType(rowIdx, colIdx, cellValue, data);

            debugInfo.push({
              row: rowIdx,
              col: colIdx,
              rawValue: String(cellValue),
              interpretation: {
                type: cellType,
                parsedValue: cellValue,
                confidence: this.estimateConfidence(cellType, cellValue),
              },
              warnings: [],
              errors: [],
            });
          }
        });
      });
    });

    // Use existing parser
    const schedule = parseExcelSchedule(buffer);

    // Collect unknown entities
    schedule.sections.forEach((section) => {
      section.entries.forEach((entry) => {
        const contextStr = `${section.kierunek} ${section.stopien}st. R${section.rok} S${section.semestr}`;

        // Track instructors (simplified - in reality would need DB check)
        if (entry.class_info.instructor) {
          const key = entry.class_info.instructor;
          if (!unknownInstructors.has(key)) {
            unknownInstructors.set(key, { occurrences: 0, contexts: [] });
          }
          const data = unknownInstructors.get(key)!;
          data.occurrences++;
          if (!data.contexts.includes(contextStr)) {
            data.contexts.push(contextStr);
          }
        }

        // Track subjects (simplified)
        if (entry.class_info.subject) {
          const key = entry.class_info.subject;
          if (!unknownSubjects.has(key)) {
            unknownSubjects.set(key, { occurrences: 0, contexts: [] });
          }
          const data = unknownSubjects.get(key)!;
          data.occurrences++;
          if (!data.contexts.includes(contextStr)) {
            data.contexts.push(contextStr);
          }
        }
      });
    });

    const totalEntries = schedule.sections.reduce((acc, s) => acc + s.entries.length, 0);

    const stats: ParseStats = {
      totalCells: debugInfo.length,
      parsedCells: debugInfo.filter(d => d.interpretation.type !== 'unknown').length,
      emptyCells: 0, // Will be calculated differently
      errorCells: debugInfo.filter(d => d.errors.length > 0).length,
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

    return {
      schedule,
      stats,
      debugInfo,
      parserVersion: this.version,
      parserName: this.name,
    };
  }

  private determineCellType(
    row: number,
    col: number,
    value: any,
    data: any[][]
  ): CellDebugInfo['interpretation']['type'] {
    const strValue = String(value).trim();

    // Header rows (0-6)
    if (row < 7) {
      return 'header';
    }

    // Date column (0)
    if (col === 0) {
      if (this.isDateLike(strValue)) {
        return 'date';
      }
    }

    // Time column (1)
    if (col === 1) {
      if (this.isTimeLike(strValue)) {
        return 'time';
      }
    }

    // Day column (17)
    if (col === 17) {
      return 'header';
    }

    // Group indicators
    if (/^([A-Z]{1,3}\d+|\d{1,2})$/.test(strValue)) {
      return 'group';
    }

    // Empty
    if (!strValue || strValue === '---') {
      return 'empty';
    }

    // Likely class content (has instructor patterns)
    if (strValue.includes('dr') || strValue.includes('mgr') || strValue.includes('prof')) {
      return 'instructor';
    }

    // Unknown
    return 'unknown';
  }

  private isDateLike(value: string): boolean {
    // Check for date patterns
    return /\d{4}-\d{2}-\d{2}/.test(value) || /^\d+$/.test(value);
  }

  private isTimeLike(value: string): boolean {
    // Check for time patterns
    return /\d{1,2}:\d{2}/.test(value) || /^\d{1,2}\.\d{2}/.test(value);
  }

  private estimateConfidence(
    type: CellDebugInfo['interpretation']['type'],
    value: any
  ): number {
    // Simple confidence estimation
    switch (type) {
      case 'date':
      case 'time':
        return 0.95;
      case 'header':
        return 0.9;
      case 'group':
        return 0.85;
      case 'instructor':
        return 0.7;
      case 'subject':
        return 0.7;
      case 'empty':
        return 1.0;
      case 'unknown':
        return 0.3;
      default:
        return 0.5;
    }
  }
}
