import { NextResponse } from 'next/server';
import { turso } from '@/lib/turso';

export async function GET() {
  try {
    // Check schedule entries
    const scheduleCount = await turso.execute(
      'SELECT COUNT(*) as count FROM schedule_entries WHERE subject IS NOT NULL AND instructor IS NOT NULL'
    );

    // Check subjects
    const subjectsCount = await turso.execute('SELECT COUNT(*) as count FROM subjects');

    // Check instructors
    const instructorsCount = await turso.execute('SELECT COUNT(*) as count FROM instructors');

    // Check existing relations
    const relationsCount = await turso.execute('SELECT COUNT(*) as count FROM subject_instructors');

    // Get sample schedule entries
    const sampleSchedule = await turso.execute({
      sql: `
        SELECT subject, instructor, kierunek, stopien, rok, semestr, tryb
        FROM schedule_entries
        WHERE subject IS NOT NULL AND instructor IS NOT NULL
        LIMIT 10
      `,
      args: [],
    });

    // Get sample subjects
    const sampleSubjects = await turso.execute({
      sql: 'SELECT name, abbreviations FROM subjects LIMIT 5',
      args: [],
    });

    // Get sample instructors
    const sampleInstructors = await turso.execute({
      sql: 'SELECT full_name, abbreviations FROM instructors LIMIT 5',
      args: [],
    });

    return NextResponse.json({
      success: true,
      counts: {
        scheduleEntries: scheduleCount.rows[0].count,
        subjects: subjectsCount.rows[0].count,
        instructors: instructorsCount.rows[0].count,
        relations: relationsCount.rows[0].count,
      },
      samples: {
        schedule: sampleSchedule.rows.map(r => ({
          subject: r.subject,
          instructor: r.instructor,
          context: `${r.kierunek} ${r.stopien}st. R${r.rok} S${r.semestr} ${r.tryb}`,
        })),
        subjects: sampleSubjects.rows.map(r => ({
          name: r.name,
          aliases: JSON.parse(String(r.abbreviations || '[]')),
        })),
        instructors: sampleInstructors.rows.map(r => ({
          name: r.full_name,
          aliases: JSON.parse(String(r.abbreviations || '[]')),
        })),
      },
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
