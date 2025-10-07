import { NextResponse } from 'next/server';
import { getNotifications, addNotification, cleanupOldNotifications, deleteNotification } from '@/lib/db-notifications';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

// DELETE /api/notifications?id=X (admin only)
export async function DELETE(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Missing notification ID' },
        { status: 400 }
      );
    }

    await deleteNotification(parseInt(id));

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('[API] Failed to delete notification:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete notification',
      },
      { status: 500 }
    );
  }
}
