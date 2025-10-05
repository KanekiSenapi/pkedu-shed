import { NextResponse } from 'next/server';
import { downloadSchedule } from '@/lib/scraper';
import { calculateHash } from '@/lib/cache-manager';
import { getLatestScheduleHash } from '@/lib/schedule-db';

/**
 * GET /api/schedule/check
 * Checks if the schedule file has been updated on the PK website
 * Returns: { hasUpdate: boolean, currentHash: string, storedHash: string }
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'niestacjonarne';

    // Download the schedule file (just to get hash)
    console.log('Checking for updates...');
    const downloadResult = await downloadSchedule(filter);

    // Calculate current hash
    const currentHash = calculateHash(downloadResult.buffer);

    // Get stored hash from database
    const storedHash = await getLatestScheduleHash();

    const hasUpdate = !storedHash || currentHash !== storedHash;

    console.log(`Check complete: ${hasUpdate ? 'Update available' : 'No update'}`);

    return NextResponse.json({
      success: true,
      hasUpdate,
      currentHash,
      storedHash: storedHash || null,
    });
  } catch (error) {
    console.error('Error checking for updates:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
