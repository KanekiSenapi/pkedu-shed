import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { turso } from '@/lib/turso';

/**
 * GET /api/admin/login-stats
 * Get login statistics for all users
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Brak uprawnień' },
        { status: 403 }
      );
    }

    // Get recent logins with user info
    const result = await turso.execute({
      sql: `
        SELECT ll.*, u.email, u.name
        FROM login_logs ll
        JOIN users u ON ll.user_id = u.id
        ORDER BY ll.login_at DESC
        LIMIT 100
      `,
      args: [],
    });

    const logins = result.rows.map(row => ({
      id: Number(row.id),
      user_id: row.user_id,
      user_email: row.email,
      user_name: row.name,
      login_at: row.login_at,
      user_agent: row.user_agent,
    }));

    // Get stats per user
    const statsResult = await turso.execute({
      sql: `
        SELECT
          u.id,
          u.email,
          u.name,
          COUNT(ll.id) as login_count,
          MAX(ll.login_at) as last_login
        FROM users u
        LEFT JOIN login_logs ll ON u.id = ll.user_id
        GROUP BY u.id, u.email, u.name
        HAVING login_count > 0
        ORDER BY login_count DESC
      `,
      args: [],
    });

    const stats = statsResult.rows.map(row => ({
      user_id: row.id,
      user_email: row.email,
      user_name: row.name,
      login_count: Number(row.login_count),
      last_login: row.last_login,
    }));

    return NextResponse.json({
      success: true,
      recent_logins: logins,
      stats,
    });
  } catch (error) {
    console.error('Error fetching login stats:', error);
    return NextResponse.json(
      { success: false, error: 'Błąd serwera' },
      { status: 500 }
    );
  }
}
