import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes timeout (needed for large files with I and II stopień)

/**
 * POST /api/admin/force-update
 * Admin-only endpoint to force schedule update
 */
export async function POST() {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions);

    if (!session || !(session.user as any)?.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - admin access required' },
        { status: 401 }
      );
    }

    console.log('[Admin] Force update requested by', session.user?.email);

    // Call fetch endpoint with force=true and proper token
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const token = process.env.CRON_SECRET || '';

    const fetchUrl = `${baseUrl}/api/schedule/fetch?force=true&token=${token}`;

    const response = await fetch(fetchUrl);
    const result = await response.json();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Plan został wymuszony do aktualizacji',
        data: result.data,
      });
    } else {
      throw new Error(result.error || 'Failed to force update');
    }
  } catch (error) {
    console.error('[Admin] Force update error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
