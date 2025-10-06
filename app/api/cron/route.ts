import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Max timeout for schedule update

/**
 * GET /api/cron
 * Cron job endpoint - updates schedule from PK Excel file
 * Should be called by Vercel Cron once per day
 *
 * To clear old data before updating:
 * 1. Call POST /api/admin/clear-all (optional)
 * 2. Then call GET /api/cron
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

    // Call internal fetch endpoint with force=true and token
    const fetchUrl = new URL('/api/schedule/fetch', request.url);
    fetchUrl.searchParams.set('force', 'true');
    fetchUrl.searchParams.set('token', process.env.CRON_SECRET || '');

    // Make the request and wait for it
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
      console.error('[Cron] Update failed:', result.error);
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
