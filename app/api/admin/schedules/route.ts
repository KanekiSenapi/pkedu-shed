import { NextResponse } from 'next/server';
import { turso } from '@/lib/turso';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/schedules
 * Get all schedules from database with entry counts
 */
export async function GET() {
  try {
    // Get all schedules
    const schedulesResult = await turso.execute({
      sql: 'SELECT * FROM schedules ORDER BY created_at DESC',
      args: [],
    });

    // Get entry counts for each schedule
    const schedules = await Promise.all(
      schedulesResult.rows.map(async (row: any) => {
        const entriesResult = await turso.execute({
          sql: 'SELECT COUNT(*) as count FROM schedule_entries WHERE schedule_id = ?',
          args: [row.id],
        });

        return {
          id: row.id,
          file_hash: row.file_hash,
          file_name: row.file_name,
          last_updated: row.last_updated,
          created_at: row.created_at,
          entries_count: Number(entriesResult.rows[0]?.count || 0),
        };
      })
    );

    // The first one (newest) is the active one
    const activeScheduleId = schedules.length > 0 ? schedules[0].id : null;

    return NextResponse.json({
      success: true,
      schedules,
      activeScheduleId,
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/schedules?id=...
 * Delete a specific schedule and its entries
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Schedule ID is required' },
        { status: 400 }
      );
    }

    // Check if this is the active (latest) schedule
    const latestResult = await turso.execute({
      sql: 'SELECT id FROM schedules ORDER BY created_at DESC LIMIT 1',
      args: [],
    });

    if (latestResult.rows.length > 0 && latestResult.rows[0].id === id) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete the active schedule' },
        { status: 400 }
      );
    }

    // Delete entries first
    await turso.execute({
      sql: 'DELETE FROM schedule_entries WHERE schedule_id = ?',
      args: [id],
    });

    // Delete changes
    await turso.execute({
      sql: 'DELETE FROM schedule_changes WHERE old_schedule_id = ? OR new_schedule_id = ?',
      args: [id, id],
    });

    // Delete schedule
    await turso.execute({
      sql: 'DELETE FROM schedules WHERE id = ?',
      args: [id],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting schedule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete schedule' },
      { status: 500 }
    );
  }
}
