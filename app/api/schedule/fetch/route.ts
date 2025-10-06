import { NextResponse } from 'next/server';
import { downloadSchedule } from '@/lib/scraper';
import { parseExcelSchedule } from '@/lib/excel-parser';
import { calculateHash } from '@/lib/cache-manager';
import {
  saveScheduleToDB,
  loadScheduleFromDB,
  getLatestScheduleHash,
} from '@/lib/schedule-db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds timeout

/**
 * GET /api/schedule/fetch
 * Downloads the schedule file from PK website, parses it, and saves to database
 * INTERNAL ONLY - requires authorization
 */
export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'niestacjonarne';
    const force = searchParams.get('force') === 'true';
    const authToken = searchParams.get('token');

    console.log(`[Fetch] START - force=${force}, filter=${filter}`);

    // Require auth token for force updates
    if (force && authToken !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - invalid token' },
        { status: 401 }
      );
    }

    // Check if we have fresh data in database
    if (!force) {
      const cacheCheckStart = Date.now();
      const cachedSchedule = await loadScheduleFromDB();
      console.log(`[Fetch] Cache check took ${Date.now() - cacheCheckStart}ms`);

      if (cachedSchedule) {
        // Check if cache is fresh (< 12 hours)
        const cacheDate = new Date(cachedSchedule.lastUpdated);
        const now = new Date();
        const hoursSinceUpdate = (now.getTime() - cacheDate.getTime()) / (1000 * 60 * 60);

        if (hoursSinceUpdate < 12) {
          console.log(`[Fetch] Cache is fresh (${hoursSinceUpdate.toFixed(1)}h old), skipping download`);
          return NextResponse.json({
            success: true,
            data: cachedSchedule,
            cached: true,
            timestamp: cachedSchedule.lastUpdated,
          });
        }

        console.log(`[Fetch] Cache is stale (${hoursSinceUpdate.toFixed(1)}h old), checking for updates...`);
      }
    }

    // Download the schedule file
    const downloadStart = Date.now();
    console.log('[Fetch] Starting download from PK website...');
    const downloadResult = await downloadSchedule(filter);
    console.log(`[Fetch] Download completed in ${Date.now() - downloadStart}ms (${downloadResult.buffer.length} bytes)`);

    // Calculate hash
    const hashStart = Date.now();
    const fileHash = calculateHash(downloadResult.buffer);
    console.log(`[Fetch] Hash calculated in ${Date.now() - hashStart}ms: ${fileHash.substring(0, 8)}...`);

    // Check if file has changed
    const hashCheckStart = Date.now();
    const storedHash = await getLatestScheduleHash();
    const hasChanges = storedHash !== fileHash;
    console.log(`[Fetch] Hash check took ${Date.now() - hashCheckStart}ms - hasChanges=${hasChanges}`);

    if (!force && !hasChanges) {
      console.log('[Fetch] File has not changed, using cached data');
      const cachedSchedule = await loadScheduleFromDB();
      if (cachedSchedule) {
        return NextResponse.json({
          success: true,
          data: cachedSchedule,
          cached: true,
          timestamp: cachedSchedule.lastUpdated,
        });
      }
    }

    // Parse the Excel file
    const parseStart = Date.now();
    console.log('[Fetch] Starting Excel parsing...');
    const schedule = parseExcelSchedule(downloadResult.buffer);
    schedule.fileHash = fileHash;
    console.log(`[Fetch] Parsing completed in ${Date.now() - parseStart}ms (${schedule.sections.length} sections)`);

    // Save to database
    const saveStart = Date.now();
    console.log('[Fetch] Starting database save...');
    await saveScheduleToDB(schedule);
    console.log(`[Fetch] Database save completed in ${Date.now() - saveStart}ms`);

    console.log(`[Fetch] TOTAL TIME: ${Date.now() - startTime}ms`);

    // Create notification for successful schedule update (only if there were changes)
    if (force && authToken && hasChanges) {
      try {
        const notifUrl = new URL('/api/notifications', request.url);
        await fetch(notifUrl.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'success',
            title: 'Plan zaktualizowany',
            message: 'Wykryto zmiany w planie zajęć',
            token: authToken,
          }),
        });
      } catch (notifError) {
        console.error('Failed to create notification:', notifError);
      }
    }

    return NextResponse.json({
      success: true,
      data: schedule,
      cached: false,
      timestamp: schedule.lastUpdated,
      sections: schedule.sections.length,
    });
  } catch (error) {
    console.error('Error fetching schedule:', error);

    // Create error notification
    const { searchParams } = new URL(request.url);
    const authToken = searchParams.get('token');
    const force = searchParams.get('force') === 'true';

    if (force && authToken) {
      try {
        const notifUrl = new URL('/api/notifications', request.url);
        await fetch(notifUrl.toString(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'error',
            title: 'Błąd aktualizacji planu',
            message: error instanceof Error ? error.message : 'Nieznany błąd',
            token: authToken,
          }),
        });
      } catch (notifError) {
        console.error('Failed to create error notification:', notifError);
      }
    }

    // Try to load from database on error
    const cachedSchedule = await loadScheduleFromDB();
    if (cachedSchedule) {
      return NextResponse.json({
        success: true,
        data: cachedSchedule,
        cached: true,
        timestamp: cachedSchedule.lastUpdated,
        warning: 'Using cached data due to fetch error',
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
