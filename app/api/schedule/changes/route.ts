import { NextResponse } from 'next/server';
import { getLatestChangesSummary, getScheduleChanges } from '@/lib/schedule-db';

/**
 * GET /api/schedule/changes
 * Get schedule changes summary or detailed changes
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('scheduleId');

    if (scheduleId) {
      // Get changes for specific schedule
      const changes = await getScheduleChanges(scheduleId);

      return NextResponse.json({
        success: true,
        scheduleId,
        count: changes.length,
        changes,
      });
    } else {
      // Get summary of latest changes
      const summary = await getLatestChangesSummary();

      return NextResponse.json({
        success: true,
        summary,
      });
    }
  } catch (error) {
    console.error('Error fetching changes:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
