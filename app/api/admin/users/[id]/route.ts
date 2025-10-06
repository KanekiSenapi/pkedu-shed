import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { turso } from '@/lib/turso';
import { getUserById } from '@/lib/auth-db';

/**
 * GET /api/admin/users/[id]
 * Get user details with preferences
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Brak uprawnień' },
        { status: 403 }
      );
    }

    const user = await getUserById(id);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Użytkownik nie znaleziony' },
        { status: 404 }
      );
    }

    // Get preferences
    const prefsResult = await turso.execute({
      sql: 'SELECT preferences_json FROM user_preferences WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1',
      args: [id],
    });

    const preferences = prefsResult.rows.length > 0
      ? JSON.parse(prefsResult.rows[0].preferences_json as string)
      : null;

    // Get login stats
    const loginStatsResult = await turso.execute({
      sql: `SELECT COUNT(*) as count, MAX(login_at) as last_login FROM login_logs WHERE user_id = ?`,
      args: [id],
    });

    const loginStats = loginStatsResult.rows[0];

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        starosta_groups: user.starosta_groups || [],
      },
      preferences,
      login_stats: {
        count: Number(loginStats.count),
        last_login: loginStats.last_login,
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Błąd serwera' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Delete user (cascade deletes preferences, login logs)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Brak uprawnień' },
        { status: 403 }
      );
    }

    // Don't allow deleting yourself
    if (session.user.id === id) {
      return NextResponse.json(
        { success: false, error: 'Nie możesz usunąć samego siebie' },
        { status: 400 }
      );
    }

    await turso.execute({
      sql: 'DELETE FROM users WHERE id = ?',
      args: [id],
    });

    return NextResponse.json({
      success: true,
      message: 'Użytkownik usunięty',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Błąd serwera' },
      { status: 500 }
    );
  }
}
