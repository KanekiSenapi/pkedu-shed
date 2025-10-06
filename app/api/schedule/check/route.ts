import { NextResponse } from 'next/server';
import { loadScheduleFromDB, getLatestScheduleHash } from '@/lib/schedule-db';

/**
 * GET /api/schedule/check
 * Checks if client has the latest version of schedule data
 * Query params:
 * - clientHash: The file hash that client currently has
 * Returns: { hasUpdate: boolean, serverHash: string, lastUpdated: string }
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clientHash = searchParams.get('clientHash');

    console.log('[Check] Checking schedule version...');

    // Get server hash and schedule
    const serverHash = await getLatestScheduleHash();
    const schedule = await loadScheduleFromDB();

    if (!schedule || !serverHash) {
      return NextResponse.json({
        success: true,
        hasUpdate: true,
        serverHash: null,
        lastUpdated: null,
        message: 'No schedule data available on server',
      });
    }

    // Compare hashes
    const hasUpdate = clientHash !== serverHash;

    console.log(`[Check] Client hash: ${clientHash?.substring(0, 8)}... | Server hash: ${serverHash.substring(0, 8)}... | Update: ${hasUpdate}`);

    return NextResponse.json({
      success: true,
      hasUpdate,
      serverHash,
      lastUpdated: schedule.lastUpdated,
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
