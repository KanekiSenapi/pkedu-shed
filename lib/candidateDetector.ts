import { turso } from './turso';

export interface InstructorCandidate {
  abbreviation: string;
  occurrences: number;
  contexts: Array<{
    kierunek: string;
    stopien: string;
    rok: number;
    semestr: number;
    tryb: string;
  }>;
  sampleClasses: Array<{
    date: string;
    time: string;
    subject: string;
    group: string;
  }>;
  possibleMatch?: {
    id: string;
    full_name: string;
    abbreviations: string[];
  };
}

export interface SubjectCandidate {
  abbreviation: string;
  context: {
    kierunek: string;
    stopien: string;
    rok: number;
    semestr: number;
    tryb: string;
  };
  occurrences: number;
  sampleClasses: Array<{
    date: string;
    time: string;
    instructor: string;
    group: string;
  }>;
}

export interface RelationCandidate {
  subjectAbbr: string;
  instructorAbbr: string;
  subjectId: string | null;
  instructorId: string | null;
  subjectName: string | null;
  instructorName: string | null;
  occurrences: number;
  contexts: Array<{
    kierunek: string;
    stopien: string;
    rok: number;
    semestr: number;
    tryb: string;
  }>;
}

/**
 * Detect instructor abbreviations from schedule that don't exist in instructors table
 */
export async function detectInstructorCandidates(): Promise<InstructorCandidate[]> {
  try {
    // Get all existing instructors with full data
    const instructorsResult = await turso.execute('SELECT id, full_name, abbreviations FROM instructors');
    const existingAbbrs = new Set<string>();
    const instructorsMap = new Map<string, { id: string; full_name: string; abbreviations: string[] }>();

    instructorsResult.rows.forEach((row: any) => {
      const abbrs = JSON.parse(row.abbreviations || '[]');
      abbrs.forEach((abbr: string) => existingAbbrs.add(abbr));

      // Store instructor data for matching
      instructorsMap.set(row.id, {
        id: row.id,
        full_name: row.full_name,
        abbreviations: abbrs,
      });
    });

    // Get all ignored candidates
    const ignoredResult = await turso.execute({
      sql: "SELECT value FROM candidate_ignores WHERE type = 'instructor'",
      args: [],
    });
    const ignoredAbbrs = new Set<string>(ignoredResult.rows.map((r: any) => r.value));

    // Get unique instructors from schedule_entries with their contexts
    const scheduleResult = await turso.execute({
      sql: `
        SELECT
          instructor,
          kierunek,
          stopien,
          rok,
          semestr,
          tryb,
          COUNT(*) as count,
          MAX(date) as sample_date,
          MAX(time) as sample_time,
          MAX(subject) as sample_subject,
          MAX("group") as sample_group
        FROM schedule_entries
        WHERE instructor IS NOT NULL AND instructor != ''
        GROUP BY instructor, kierunek, stopien, rok, semestr, tryb
        ORDER BY count DESC
      `,
      args: [],
    });

    // Group by instructor abbreviation and filter out existing ones
    const candidatesMap = new Map<string, InstructorCandidate>();

    scheduleResult.rows.forEach((row: any) => {
      const abbr = row.instructor;

      // Skip if already exists in instructors or is ignored
      if (existingAbbrs.has(abbr) || ignoredAbbrs.has(abbr)) {
        return;
      }

      if (!candidatesMap.has(abbr)) {
        candidatesMap.set(abbr, {
          abbreviation: abbr,
          occurrences: 0,
          contexts: [],
          sampleClasses: [],
        });
      }

      const candidate = candidatesMap.get(abbr)!;
      candidate.occurrences += Number(row.count);

      // Add context if not already present
      const contextKey = `${row.kierunek}-${row.stopien}-${row.rok}-${row.semestr}-${row.tryb}`;
      if (!candidate.contexts.some(c =>
        `${c.kierunek}-${c.stopien}-${c.rok}-${c.semestr}-${c.tryb}` === contextKey
      )) {
        candidate.contexts.push({
          kierunek: row.kierunek,
          stopien: row.stopien,
          rok: row.rok,
          semestr: row.semestr,
          tryb: row.tryb,
        });
      }

      // Add sample class (limit to 3 per candidate)
      if (candidate.sampleClasses.length < 3) {
        candidate.sampleClasses.push({
          date: row.sample_date,
          time: row.sample_time,
          subject: row.sample_subject,
          group: row.sample_group,
        });
      }
    });

    // Find possible matches for each candidate
    const candidates = Array.from(candidatesMap.values());

    candidates.forEach(candidate => {
      const candidateLower = candidate.abbreviation.toLowerCase();

      // Check if candidate matches any existing instructor's full name
      for (const instructor of instructorsMap.values()) {
        const fullNameLower = instructor.full_name.toLowerCase();

        // Check if the candidate is contained in the full name
        // e.g., "Dominika Cywicka" is in "dr inż. Dominika Cywicka"
        if (fullNameLower.includes(candidateLower)) {
          candidate.possibleMatch = {
            id: instructor.id,
            full_name: instructor.full_name,
            abbreviations: instructor.abbreviations,
          };
          break; // Found a match, stop searching
        }
      }
    });

    return candidates.sort((a, b) => b.occurrences - a.occurrences);
  } catch (error) {
    console.error('Error detecting instructor candidates:', error);
    return [];
  }
}

/**
 * Detect subject abbreviations from schedule that don't exist in subjects table
 */
export async function detectSubjectCandidates(): Promise<SubjectCandidate[]> {
  try {
    // Get all existing subjects with their abbreviations and context
    const subjectsResult = await turso.execute(
      'SELECT abbreviations, kierunek, stopien, rok, semestr, tryb FROM subjects'
    );

    // Build a set of existing abbreviations per context
    const existingSubjects = new Set<string>();
    subjectsResult.rows.forEach((row: any) => {
      const abbrs = JSON.parse(row.abbreviations || '[]');
      const context = `${row.kierunek}-${row.stopien}-${row.rok}-${row.semestr}-${row.tryb}`;
      abbrs.forEach((abbr: string) => {
        existingSubjects.add(`${abbr}:::${context}`);
      });
    });

    // Get ignored candidates
    const ignoredResult = await turso.execute({
      sql: "SELECT value, context FROM candidate_ignores WHERE type = 'subject'",
      args: [],
    });
    const ignoredSubjects = new Set<string>();
    ignoredResult.rows.forEach((r: any) => {
      ignoredSubjects.add(`${r.value}:::${r.context || ''}`);
    });

    // Get unique subjects from schedule_entries
    const scheduleResult = await turso.execute({
      sql: `
        SELECT
          subject,
          kierunek,
          stopien,
          rok,
          semestr,
          tryb,
          COUNT(*) as count,
          MAX(date) as sample_date,
          MAX(time) as sample_time,
          MAX(instructor) as sample_instructor,
          MAX("group") as sample_group
        FROM schedule_entries
        WHERE subject IS NOT NULL AND subject != ''
        GROUP BY subject, kierunek, stopien, rok, semestr, tryb
        ORDER BY count DESC
      `,
      args: [],
    });

    const candidates: SubjectCandidate[] = [];

    scheduleResult.rows.forEach((row: any) => {
      const abbr = row.subject;
      const context = `${row.kierunek}-${row.stopien}-${row.rok}-${row.semestr}-${row.tryb}`;
      const key = `${abbr}:::${context}`;

      // Skip if already exists or is ignored
      if (existingSubjects.has(key) || ignoredSubjects.has(key)) {
        return;
      }

      candidates.push({
        abbreviation: abbr,
        context: {
          kierunek: row.kierunek,
          stopien: row.stopien,
          rok: row.rok,
          semestr: row.semestr,
          tryb: row.tryb,
        },
        occurrences: Number(row.count),
        sampleClasses: [{
          date: row.sample_date,
          time: row.sample_time,
          instructor: row.sample_instructor,
          group: row.sample_group,
        }],
      });
    });

    return candidates.sort((a, b) => b.occurrences - a.occurrences);
  } catch (error) {
    console.error('Error detecting subject candidates:', error);
    return [];
  }
}

/**
 * Detect missing subject-instructor relations
 */
export async function detectMissingRelations(): Promise<RelationCandidate[]> {
  try {
    // Get all existing relations
    const relationsResult = await turso.execute(
      'SELECT subject_id, instructor_id FROM subject_instructors'
    );
    const existingRelations = new Set<string>();
    relationsResult.rows.forEach((row: any) => {
      existingRelations.add(`${row.subject_id}:::${row.instructor_id}`);
    });

    // Get all subjects and instructors
    const subjectsResult = await turso.execute(
      'SELECT id, name, abbreviations, kierunek, stopien, rok, semestr, tryb FROM subjects'
    );
    const instructorsResult = await turso.execute(
      'SELECT id, full_name, abbreviations FROM instructors'
    );

    // Build maps for quick lookup
    const subjectsByAbbr = new Map<string, any[]>();
    subjectsResult.rows.forEach((row: any) => {
      const abbrs = JSON.parse(row.abbreviations || '[]');
      abbrs.forEach((abbr: string) => {
        if (!subjectsByAbbr.has(abbr)) {
          subjectsByAbbr.set(abbr, []);
        }
        subjectsByAbbr.get(abbr)!.push(row);
      });
    });

    const instructorsByAbbr = new Map<string, any>();
    instructorsResult.rows.forEach((row: any) => {
      const abbrs = JSON.parse(row.abbreviations || '[]');
      abbrs.forEach((abbr: string) => {
        instructorsByAbbr.set(abbr, row);
      });
    });

    // Get ignored relation candidates
    const ignoredResult = await turso.execute({
      sql: "SELECT value FROM candidate_ignores WHERE type = 'relation'",
      args: [],
    });
    const ignoredRelations = new Set<string>(ignoredResult.rows.map((r: any) => r.value));

    // Get unique subject-instructor pairs from schedule
    const scheduleResult = await turso.execute({
      sql: `
        SELECT
          subject,
          instructor,
          kierunek,
          stopien,
          rok,
          semestr,
          tryb,
          COUNT(*) as count
        FROM schedule_entries
        WHERE subject IS NOT NULL AND subject != ''
          AND instructor IS NOT NULL AND instructor != ''
        GROUP BY subject, instructor, kierunek, stopien, rok, semestr, tryb
        ORDER BY count DESC
      `,
      args: [],
    });

    const candidatesMap = new Map<string, RelationCandidate>();

    scheduleResult.rows.forEach((row: any) => {
      const subjectAbbr = row.subject;
      const instructorAbbr = row.instructor;
      const relationKey = `${subjectAbbr}:::${instructorAbbr}`;

      // Skip if ignored
      if (ignoredRelations.has(relationKey)) {
        return;
      }

      // Find matching subject in context
      const matchingSubjects = subjectsByAbbr.get(subjectAbbr)?.filter((s: any) =>
        s.kierunek === row.kierunek &&
        s.stopien === row.stopien &&
        s.rok === row.rok &&
        s.semestr === row.semestr &&
        s.tryb === row.tryb
      ) || [];

      // Find matching instructor
      const matchingInstructor = instructorsByAbbr.get(instructorAbbr);

      // Only include if BOTH exist in database but relation is missing
      if (matchingSubjects.length > 0 && matchingInstructor) {
        matchingSubjects.forEach((subject: any) => {
          const relKey = `${subject.id}:::${matchingInstructor.id}`;

          // Skip if relation already exists
          if (existingRelations.has(relKey)) {
            return;
          }

          const candidateKey = `${subjectAbbr}-${instructorAbbr}-${subject.id}`;

          if (!candidatesMap.has(candidateKey)) {
            candidatesMap.set(candidateKey, {
              subjectAbbr,
              instructorAbbr,
              subjectId: subject.id,
              instructorId: matchingInstructor.id,
              subjectName: subject.name,
              instructorName: matchingInstructor.full_name,
              occurrences: 0,
              contexts: [],
            });
          }

          const candidate = candidatesMap.get(candidateKey)!;
          candidate.occurrences += Number(row.count);

          // Add context
          const contextKey = `${row.kierunek}-${row.stopien}-${row.rok}-${row.semestr}-${row.tryb}`;
          if (!candidate.contexts.some(c =>
            `${c.kierunek}-${c.stopien}-${c.rok}-${c.semestr}-${c.tryb}` === contextKey
          )) {
            candidate.contexts.push({
              kierunek: row.kierunek,
              stopien: row.stopien,
              rok: row.rok,
              semestr: row.semestr,
              tryb: row.tryb,
            });
          }
        });
      }
    });

    return Array.from(candidatesMap.values()).sort((a, b) => b.occurrences - a.occurrences);
  } catch (error) {
    console.error('Error detecting missing relations:', error);
    return [];
  }
}
