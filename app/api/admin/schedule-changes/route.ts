import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { turso } from '@/lib/turso';

/**
 * GET /api/admin/schedule-changes
 * Get schedule change history
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Brak uprawnień' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const changeType = searchParams.get('type');

    let sql = `
      SELECT * FROM schedule_changes
      ${changeType ? 'WHERE change_type = ?' : ''}
      ORDER BY created_at DESC
      LIMIT ?
    `;

    const args = changeType ? [changeType, limit] : [limit];

    const result = await turso.execute({
      sql,
      args,
    });

    const changes = result.rows.map(row => ({
      id: row.id,
      old_schedule_id: row.old_schedule_id,
      new_schedule_id: row.new_schedule_id,
      change_type: row.change_type,
      entry_id: row.entry_id,
      field_name: row.field_name,
      old_value: row.old_value,
      new_value: row.new_value,
      date: row.date,
      group: row.group,
      subject: row.subject,
      created_at: row.created_at,
    }));

    return NextResponse.json({
      success: true,
      changes,
    });
  } catch (error) {
    console.error('Error fetching schedule changes:', error);
    return NextResponse.json(
      { success: false, error: 'Błąd serwera' },
      { status: 500 }
    );
  }
}
