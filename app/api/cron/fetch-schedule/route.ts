import { NextResponse } from 'next/server';
import { downloadSchedule } from '@/lib/scraper';
import { parseExcelSchedule } from '@/lib/excel-parser';
import { calculateHash } from '@/lib/cache-manager';
import {
  saveScheduleToDB,
  getLatestScheduleHash,
  scheduleExistsForHash,
} from '@/lib/schedule-db';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/cron/fetch-schedule
 * Cron job to automatically fetch and update schedule
 * Can be called by Vercel Cron or manually
 */
export async function GET(request: Request) {
  try {
    // Optional: Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[CRON] Starting scheduled fetch...');

    // Download schedule
    const downloadResult = await downloadSchedule('niestacjonarne');
    const fileHash = calculateHash(downloadResult.buffer);

    // Check if we already have this version
    const exists = await scheduleExistsForHash(fileHash);
    if (exists) {
      console.log('[CRON] Schedule is up to date');
      return NextResponse.json({
        success: true,
        message: 'Schedule is up to date',
        hash: fileHash,
      });
    }

    // Parse and save new schedule
    console.log('[CRON] New schedule detected, parsing...');
    const schedule = parseExcelSchedule(downloadResult.buffer);
    schedule.fileHash = fileHash;

    await saveScheduleToDB(schedule);

    // Send notifications to subscribed users
    await notifySubscribedUsers(fileHash);

    console.log('[CRON] Schedule updated successfully');

    return NextResponse.json({
      success: true,
      message: 'Schedule updated successfully',
      hash: fileHash,
      sections: schedule.sections.length,
    });
  } catch (error) {
    console.error('[CRON] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Sends notifications to all users with active subscriptions
 */
async function notifySubscribedUsers(scheduleHash: string): Promise<void> {
  // Get all users with active subscriptions
  const subscriptions = await prisma.userSubscription.findMany({
    where: { active: true },
    include: { user: true },
  });

  // Create notifications for each subscribed user
  const notifications = subscriptions.map((sub) => ({
    userId: sub.userId,
    type: 'schedule_update',
    title: 'Plan zajęć został zaktualizowany',
    message: 'Dostępna jest nowa wersja planu zajęć. Sprawdź zmiany!',
    scheduleHash,
  }));

  if (notifications.length > 0) {
    await prisma.notification.createMany({
      data: notifications,
    });

    console.log(`[CRON] Created ${notifications.length} notifications`);

    // TODO: Send email notifications here
    // await sendEmailNotifications(subscriptions);
  }
}
