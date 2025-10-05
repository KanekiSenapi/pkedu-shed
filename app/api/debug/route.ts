import { NextResponse } from 'next/server';
import { turso, initDatabase } from '@/lib/turso';

export async function GET() {
  try {
    await initDatabase();

    const scheduleResult = await turso.execute({
      sql: 'SELECT * FROM schedules ORDER BY created_at DESC LIMIT 1',
      args: [],
    });

    const totalResult = await turso.execute({
      sql: 'SELECT COUNT(*) as count FROM schedule_entries',
      args: [],
    });

    const sectionsResult = await turso.execute({
      sql: `SELECT kierunek, stopien, rok, semestr, tryb, COUNT(*) as entry_count
            FROM schedule_entries
            GROUP BY kierunek, stopien, rok, semestr, tryb`,
      args: [],
    });

    return NextResponse.json({
      schedule: scheduleResult.rows.length > 0
        ? {
            fileHash: scheduleResult.rows[0].file_hash,
            lastUpdated: scheduleResult.rows[0].last_updated,
          }
        : null,
      sections: sectionsResult.rows,
      totalEntries: totalResult.rows[0].count,
    });
  } catch (error) {
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
