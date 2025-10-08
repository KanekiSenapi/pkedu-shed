import { ScheduleParser } from './base-parser';
import { V1BasicParser } from './v1-basic-parser';
import { V3DatabaseAwareParser } from './v3-db-aware-parser';

/**
 * Registry of all available schedule parsers
 */
class ParserRegistry {
  private parsers: Map<string, ScheduleParser> = new Map();

  constructor() {
    this.registerDefaultParsers();
  }

  private registerDefaultParsers() {
    // Register V1 Basic Parser
    const v1Parser = new V1BasicParser();
    this.parsers.set(v1Parser.version, v1Parser);

    // Register V3 Database-Aware Parser
    const v3Parser = new V3DatabaseAwareParser();
    this.parsers.set(v3Parser.version, v3Parser);
  }

  /**
   * Register a new parser
   */
  register(parser: ScheduleParser) {
    this.parsers.set(parser.version, parser);
  }

  /**
   * Get parser by version
   */
  getParser(version: string): ScheduleParser | undefined {
    return this.parsers.get(version);
  }

  /**
   * Get all registered parsers
   */
  getAllParsers(): ScheduleParser[] {
    return Array.from(this.parsers.values());
  }

  /**
   * Get parser metadata for all parsers
   */
  getAllParsersMetadata() {
    return this.getAllParsers().map(p => p.getMetadata());
  }

  /**
   * Get default parser (latest version)
   */
  getDefaultParser(): ScheduleParser {
    const parsers = this.getAllParsers();
    // For now, return the first one. Later can implement version comparison
    return parsers[parsers.length - 1] || new V1BasicParser();
  }
}

// Export singleton instance
export const parserRegistry = new ParserRegistry();
