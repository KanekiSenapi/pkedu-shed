import { NextResponse } from 'next/server';
import { turso } from '@/lib/turso';

export async function GET() {
  try {
    // Get sample instructor abbreviations from schedule
    const scheduleInstructors = await turso.execute({
      sql: `
        SELECT DISTINCT instructor
        FROM schedule_entries
        WHERE instructor IS NOT NULL AND instructor != ''
        LIMIT 20
      `,
      args: [],
    });

    // Get all instructors from DB with their aliases
    const dbInstructors = await turso.execute({
      sql: 'SELECT full_name, abbreviations FROM instructors',
      args: [],
    });

    // Check which schedule instructors are in DB
    const allAliases = new Set<string>();
    const allFullNames = new Set<string>();

    dbInstructors.rows.forEach((row: any) => {
      const aliases = JSON.parse(String(row.abbreviations || '[]'));
      aliases.forEach((alias: string) => allAliases.add(alias));
      allFullNames.add(String(row.full_name).toLowerCase());
    });

    const matchResults = scheduleInstructors.rows.map((row: any) => {
      const instructor = row.instructor;
      const foundAsAlias = allAliases.has(instructor);
      const foundAsName = allFullNames.has(instructor.toLowerCase());

      return {
        instructor,
        foundAsAlias,
        foundAsName,
        found: foundAsAlias || foundAsName,
      };
    });

    // Get sample subject names from schedule
    const scheduleSubjects = await turso.execute({
      sql: `
        SELECT DISTINCT subject
        FROM schedule_entries
        WHERE subject IS NOT NULL AND subject != ''
        LIMIT 20
      `,
      args: [],
    });

    // Get all subjects from DB
    const dbSubjects = await turso.execute({
      sql: 'SELECT name, abbreviations FROM subjects',
      args: [],
    });

    const allSubjectAliases = new Set<string>();
    const allSubjectNames = new Set<string>();

    dbSubjects.rows.forEach((row: any) => {
      const aliases = JSON.parse(String(row.abbreviations || '[]'));
      aliases.forEach((alias: string) => allSubjectAliases.add(alias));
      allSubjectNames.add(String(row.name).toLowerCase());
    });

    const subjectMatchResults = scheduleSubjects.rows.map((row: any) => {
      const subject = row.subject;
      const foundAsAlias = allSubjectAliases.has(subject);
      const foundAsName = allSubjectNames.has(subject.toLowerCase());

      return {
        subject,
        foundAsAlias,
        foundAsName,
        found: foundAsAlias || foundAsName,
      };
    });

    return NextResponse.json({
      success: true,
      instructorMatching: {
        total: matchResults.length,
        matched: matchResults.filter(r => r.found).length,
        notMatched: matchResults.filter(r => !r.found).length,
        details: matchResults,
      },
      subjectMatching: {
        total: subjectMatchResults.length,
        matched: subjectMatchResults.filter(r => r.found).length,
        notMatched: subjectMatchResults.filter(r => !r.found).length,
        details: subjectMatchResults,
      },
    });
  } catch (error) {
    console.error('Debug matching error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
