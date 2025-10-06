import { NextResponse } from 'next/server';
import { getNotifications, addNotification, cleanupOldNotifications } from '@/lib/db-notifications';

// GET /api/notifications
export async function GET() {
  try {
    const notifications = await getNotifications(50);

    return NextResponse.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error('[API] Failed to fetch notifications:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch notifications',
      },
      { status: 500 }
    );
  }
}

// POST /api/notifications (internal use)
export async function POST(request: Request) {
  try {
    const { type, title, message, token } = await request.json();

    // Protect this endpoint
    if (token !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const notification = await addNotification(type, title, message);

    // Cleanup old notifications
    await cleanupOldNotifications(100);

    return NextResponse.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error('[API] Failed to create notification:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create notification',
      },
      { status: 500 }
    );
  }
}
