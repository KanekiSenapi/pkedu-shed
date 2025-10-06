import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { turso } from '@/lib/turso';

/**
 * POST /api/admin/notifications
 * Create notification (global or targeted)
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Brak uprawnień' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, title, message, target_rok, target_groups } = body;

    if (!type || !title || !message) {
      return NextResponse.json(
        { success: false, error: 'Typ, tytuł i treść są wymagane' },
        { status: 400 }
      );
    }

    if (!['info', 'success', 'warning', 'error'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Nieprawidłowy typ' },
        { status: 400 }
      );
    }

    // If targeted, validate target data
    const isTargeted = target_rok || (target_groups && target_groups.length > 0);

    const result = await turso.execute({
      sql: `INSERT INTO notifications (type, title, message, target_rok, target_groups)
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        type,
        title,
        message,
        target_rok || null,
        target_groups && target_groups.length > 0 ? JSON.stringify(target_groups) : null,
      ],
    });

    return NextResponse.json({
      success: true,
      notification_id: Number(result.lastInsertRowid),
      message: isTargeted ? 'Powiadomienie targetowane utworzone' : 'Powiadomienie globalne utworzone',
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { success: false, error: 'Błąd serwera' },
      { status: 500 }
    );
  }
}
