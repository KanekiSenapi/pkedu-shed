import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { loadScheduleFromDB, getLatestScheduleHash } from '@/lib/schedule-db';
import { PARSER_VERSION } from '@/lib/excel-parser';

/**
 * GET /api/admin/system-info
 * Returns system information: parser version, file hash, file name
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = session.user as any;
    if (!user.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get latest schedule info
    const schedule = await loadScheduleFromDB();
    const hash = await getLatestScheduleHash();

    return NextResponse.json({
      success: true,
      parserVersion: PARSER_VERSION,
      fileHash: hash || null,
      fileName: schedule?.fileName || null,
      lastUpdated: schedule?.lastUpdated || null,
    });
  } catch (error) {
    console.error('Error getting system info:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
