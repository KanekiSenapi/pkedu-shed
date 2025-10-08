import { ParsedSchedule, ScheduleSection } from '@/types/schedule';

/**
 * Information about how a specific cell was parsed
 */
export interface CellDebugInfo {
  row: number;
  col: number;
  rawValue: string;
  interpretation: {
    type: 'date' | 'time' | 'instructor' | 'subject' | 'group' | 'header' | 'empty' | 'unknown' | 'merged';
    parsedValue: any;
    confidence: number; // 0-1, how confident the parser is
    matchedEntity?: {
      id?: string;
      name: string;
      alias?: string;
      source?: 'database' | 'pattern' | 'heuristic';
    };
  };
  warnings: string[];
  errors: string[];
  context?: {
    section?: string;
    group?: string;
    date?: string;
  };
}

/**
 * Statistics about the parsing process
 */
export interface ParseStats {
  totalCells: number;
  parsedCells: number;
  emptyCells: number;
  errorCells: number;
  totalEntries: number;
  successfulParses: number;
  failedParses: number;
  unknownInstructors: Array<{
    value: string;
    occurrences: number;
    contexts: string[];
  }>;
  unknownSubjects: Array<{
    value: string;
    occurrences: number;
    contexts: string[];
  }>;
  processingTime: number; // milliseconds
}

/**
 * Result of parsing operation with debug info
 */
export interface ParseResult {
  schedule: ParsedSchedule;
  stats: ParseStats;
  debugInfo: CellDebugInfo[];
  parserVersion: string;
  parserName: string;
}

/**
 * Abstract base class for schedule parsers
 */
export abstract class ScheduleParser {
  abstract readonly version: string;
  abstract readonly name: string;
  abstract readonly description: string;

  /**
   * Parse Excel buffer and return schedule with debug information
   */
  abstract parse(buffer: Buffer): Promise<ParseResult>;

  /**
   * Validate if this parser can handle the given file
   */
  async canParse(buffer: Buffer): Promise<boolean> {
    // Default implementation - can be overridden
    return true;
  }

  /**
   * Get parser metadata
   */
  getMetadata() {
    return {
      version: this.version,
      name: this.name,
      description: this.description,
    };
  }
}

/**
 * Parser configuration options
 */
export interface ParserOptions {
  enableDebug?: boolean;
  loadFromDatabase?: boolean;
  strictMode?: boolean;
}
