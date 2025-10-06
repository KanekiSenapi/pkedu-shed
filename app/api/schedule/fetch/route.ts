import { NextResponse } from 'next/server';
import { downloadSchedule } from '@/lib/scraper';
import { parseExcelSchedule } from '@/lib/excel-parser';
import { calculateHash } from '@/lib/cache-manager';
import {
  saveScheduleToDB,
  loadScheduleFromDB,
  getLatestScheduleHash,
} from '@/lib/schedule-db';

/**
 * GET /api/schedule/fetch
 * Downloads the schedule file from PK website, parses it, and saves to database
 * INTERNAL ONLY - requires authorization
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'niestacjonarne';
    const force = searchParams.get('force') === 'true';
    const authToken = searchParams.get('token');

    // Require auth token for force updates
    if (force && authToken !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - invalid token' },
        { status: 401 }
      );
    }

    // Check if we have fresh data in database
    if (!force) {
      const cachedSchedule = await loadScheduleFromDB();
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
    console.log('Downloading schedule file from PK website...');
    const downloadResult = await downloadSchedule(filter);

    // Calculate hash
    const fileHash = calculateHash(downloadResult.buffer);

    // Check if file has changed
    const storedHash = await getLatestScheduleHash();
    const hasChanges = storedHash !== fileHash;

    if (!force && !hasChanges) {
      console.log('File has not changed, using cached data');
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
    console.log('Parsing Excel file...');
    const schedule = parseExcelSchedule(downloadResult.buffer);
    schedule.fileHash = fileHash;

    // Save to database
    await saveScheduleToDB(schedule);

    console.log(`Successfully parsed and saved schedule with ${schedule.sections.length} sections`);

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
