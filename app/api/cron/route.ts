import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 10; // Short timeout - just triggers background job

/**
 * GET /api/cron
 * Cron job endpoint - triggers schedule update from PK Excel file
 * Should be called by Vercel Cron once per day
 *
 * Returns 202 Accepted immediately and processes update in background
 * This prevents timeout issues as the actual update can take 60+ seconds
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

    console.log('[Cron] Starting schedule update (fire and forget)...');

    // Call internal fetch endpoint with force=true and token
    const fetchUrl = new URL('/api/schedule/fetch', request.url);
    fetchUrl.searchParams.set('force', 'true');
    fetchUrl.searchParams.set('token', process.env.CRON_SECRET || '');

    // Fire and forget - don't wait for response
    fetch(fetchUrl.toString())
      .then(async (response) => {
        const result = await response.json();
        if (result.success) {
          console.log('[Cron] Schedule updated successfully in background');
        } else {
          console.error('[Cron] Background update failed:', result.error);
        }
      })
      .catch((error) => {
        console.error('[Cron] Background update error:', error);
      });

    // Return immediately with 202 Accepted
    return NextResponse.json(
      {
        success: true,
        message: 'Schedule update started in background',
        status: 'processing',
      },
      { status: 202 }
    );
  } catch (error) {
    console.error('[Cron] Error starting update:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
