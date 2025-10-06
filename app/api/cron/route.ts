import { NextResponse } from 'next/server';
import { clearAllNotifications } from '@/lib/db-notifications';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/cron
 * Cron job endpoint - updates schedule from PK Excel file
 * Should be called by Vercel Cron once per day
 *
 * Query params:
 * - clear=true: Clear all old data (schedule + notifications) before fetching new data
 *
 * Examples:
 * - https://pk.kiedy.app/api/cron (update schedule)
 * - https://pk.kiedy.app/api/cron?clear=true (clear all data + update schedule)
 *
 * Setup in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 */
export async function GET(request: Request) {
  try {
    // Verify authorization (Vercel Cron sends special header)
    const authHeader = request.headers.get('authorization');

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cron] Starting schedule update...');

    // Check if we should clear old data first
    const url = new URL(request.url);
    const shouldClear = url.searchParams.get('clear') === 'true';

    if (shouldClear) {
      console.log('[Cron] Clearing old data (schedule + notifications)...');
      const clearUrl = new URL('/api/admin/clear-db', request.url);
      await fetch(clearUrl.toString(), { method: 'POST' });
      await clearAllNotifications();
    }

    // Call internal fetch endpoint with force=true and token
    const fetchUrl = new URL('/api/schedule/fetch', request.url);
    fetchUrl.searchParams.set('force', 'true');
    fetchUrl.searchParams.set('token', process.env.CRON_SECRET || '');

    const response = await fetch(fetchUrl.toString());
    const result = await response.json();

    if (result.success) {
      console.log('[Cron] Schedule updated successfully');
      return NextResponse.json({
        success: true,
        message: 'Schedule updated successfully',
        sections: result.sections,
        timestamp: result.timestamp,
      });
    } else {
      throw new Error(result.error || 'Failed to update schedule');
    }
  } catch (error) {
    console.error('[Cron] Error updating schedule:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
