import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { turso } from '@/lib/turso';

/**
 * GET /api/admin/bug-reports
 * Get all bug reports (admin only)
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
      sql: `SELECT * FROM bug_reports ORDER BY created_at DESC`,
      args: [],
    });

    const reports = result.rows.map(row => ({
      id: Number(row.id),
      type: row.type,
      title: row.title,
      description: row.description,
      url: row.url,
      user_info: row.user_info,
      contact_email: row.contact_email,
      user_agent: row.user_agent,
      status: row.status,
      created_at: row.created_at,
    }));

    return NextResponse.json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error('Error fetching bug reports:', error);
    return NextResponse.json(
      { success: false, error: 'Błąd podczas pobierania zgłoszeń' },
      { status: 500 }
    );
  }
}
