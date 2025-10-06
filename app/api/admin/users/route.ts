import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { turso } from '@/lib/turso';

/**
 * GET /api/admin/users
 * Get all users (admin only)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Nie jesteś zalogowany' },
        { status: 401 }
      );
    }

    const isAdmin = (session.user as any).isAdmin;
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Brak uprawnień administratora' },
        { status: 403 }
      );
    }

    const result = await turso.execute({
      sql: `SELECT id, email, name, is_admin, created_at FROM users ORDER BY created_at DESC`,
      args: [],
    });

    const users = result.rows.map(row => ({
      id: row.id,
      email: row.email,
      name: row.name,
      is_admin: row.is_admin === 1,
      created_at: row.created_at,
    }));

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Błąd podczas pobierania użytkowników' },
      { status: 500 }
    );
  }
}
