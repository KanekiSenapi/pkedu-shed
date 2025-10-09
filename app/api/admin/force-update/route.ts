import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { downloadSchedule } from '@/lib/scraper';
import { calculateHash, createVersionedHash } from '@/lib/cache-manager';
import { saveScheduleToDB, loadScheduleFromDB } from '@/lib/schedule-db';
import { parserRegistry } from '@/lib/parsers/parser-registry';
import { getDefaultParserVersion } from '@/lib/system-config';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes timeout (needed for large files with I and II stopień)

/**
 * POST /api/admin/force-update
 * Admin-only endpoint to force schedule update
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

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

    // Download the schedule file
    const downloadStart = Date.now();
    console.log('[Force Update] Starting download from PK website...');
    const downloadResult = await downloadSchedule('niestacjonarne');
    console.log(`[Force Update] Download completed in ${Date.now() - downloadStart}ms (${downloadResult.buffer.length} bytes)`);

    // Calculate hash
    const hashStart = Date.now();
    const fileHash = calculateHash(downloadResult.buffer);
    console.log(`[Force Update] Hash calculated in ${Date.now() - hashStart}ms: ${fileHash.substring(0, 8)}...`);

    // Get parser to use
    const parserVersion = await getDefaultParserVersion();
    const parser = parserRegistry.getParser(parserVersion) || parserRegistry.getDefaultParser();

    console.log(`[Force Update] Using parser: ${parser.name} v${parser.version}`);

    // Parse the Excel file
    const parseStart = Date.now();
    console.log('[Force Update] Starting Excel parsing...');
    const parseResult = await parser.parse(downloadResult.buffer);
    const schedule = parseResult.schedule;
    schedule.fileHash = createVersionedHash(fileHash, parser.version);
    schedule.fileName = downloadResult.filename;
    console.log(`[Force Update] Parsing completed in ${Date.now() - parseStart}ms (${schedule.sections.length} sections)`);

    // Save to database
    const saveStart = Date.now();
    console.log('[Force Update] Starting database save...');
    await saveScheduleToDB(schedule);
    console.log(`[Force Update] Database save completed in ${Date.now() - saveStart}ms`);

    console.log(`[Force Update] TOTAL TIME: ${Date.now() - startTime}ms`);

    // Create notification for successful schedule update
    try {
      const notifUrl = new URL('/api/notifications', request.url);
      await fetch(notifUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'success',
          title: 'Plan zaktualizowany',
          message: 'Wymuszono aktualizację planu zajęć',
          token: process.env.CRON_SECRET,
        }),
      });
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
    }

    return NextResponse.json({
      success: true,
      message: 'Plan został wymuszony do aktualizacji',
      data: schedule,
      timestamp: schedule.lastUpdated,
      sections: schedule.sections.length,
    });
  } catch (error) {
    console.error('[Admin] Force update error:', error);

    // Create error notification
    try {
      const notifUrl = new URL('/api/notifications', request.url);
      await fetch(notifUrl.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'error',
          title: 'Błąd aktualizacji planu',
          message: error instanceof Error ? error.message : 'Nieznany błąd',
          token: process.env.CRON_SECRET,
        }),
      });
    } catch (notifError) {
      console.error('Failed to create error notification:', notifError);
    }

    // Try to load from database on error
    const cachedSchedule = await loadScheduleFromDB();
    if (cachedSchedule) {
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        warning: 'Using cached data due to fetch error',
        data: cachedSchedule,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
