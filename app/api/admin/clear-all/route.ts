import { NextResponse } from 'next/server';
import { clearDatabase } from '@/lib/schedule-db';
import { clearAllNotifications } from '@/lib/db-notifications';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * POST /api/admin/clear-all
 * Clears all data from database (schedule + notifications)
 * Requires CRON_SECRET for authorization
 */
export async function POST(request: Request) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Admin] Clearing all data...');

    // Clear schedule data
    await clearDatabase();
    console.log('[Admin] Schedule data cleared');

    // Clear notifications
    await clearAllNotifications();
    console.log('[Admin] Notifications cleared');

    return NextResponse.json({
      success: true,
      message: 'All data cleared (schedule + notifications)',
    });
  } catch (error) {
    console.error('[Admin] Error clearing data:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
