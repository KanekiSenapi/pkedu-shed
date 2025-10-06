import { NextResponse } from 'next/server';
import { loadScheduleFromDB } from '@/lib/schedule-db';

/**
 * GET /api/schedule/check
 * Checks if the schedule data is recent (lightweight check)
 * Returns: { hasUpdate: boolean, lastUpdated: string }
 */
export async function GET() {
  try {
    console.log('[Check] Checking schedule freshness...');

    // Load from database
    const schedule = await loadScheduleFromDB();

    if (!schedule) {
      return NextResponse.json({
        success: true,
        hasUpdate: true,
        lastUpdated: null,
        message: 'No schedule data available',
      });
    }

    // Check if data is fresh (< 24 hours)
    const lastUpdated = new Date(schedule.lastUpdated);
    const now = new Date();
    const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);

    const hasUpdate = hoursSinceUpdate > 24;

    console.log(`[Check] Data is ${hoursSinceUpdate.toFixed(1)}h old - ${hasUpdate ? 'stale' : 'fresh'}`);

    return NextResponse.json({
      success: true,
      hasUpdate,
      lastUpdated: schedule.lastUpdated,
      hoursSinceUpdate: Math.round(hoursSinceUpdate),
    });
  } catch (error) {
    console.error('[Check] Error checking for updates:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
