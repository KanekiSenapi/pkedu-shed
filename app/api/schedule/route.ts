import { NextResponse } from 'next/server';
import { loadScheduleFromDB } from '@/lib/schedule-db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/schedule
 * Public read-only endpoint - returns cached schedule from database
 */
export async function GET() {
  try {
    console.log('[API] Loading schedule from database cache...');
    const schedule = await loadScheduleFromDB();

    if (!schedule) {
      return NextResponse.json(
        {
          success: false,
          error: 'No schedule data available. Please wait for the next update.',
        },
        { status: 404 }
      );
    }

    console.log(`[API] Loaded schedule with ${schedule.sections.length} sections from cache`);

    return NextResponse.json({
      success: true,
      data: schedule,
      cached: true,
      timestamp: schedule.lastUpdated,
      sections: schedule.sections.length,
    });
  } catch (error) {
    console.error('[API] Error loading schedule:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
