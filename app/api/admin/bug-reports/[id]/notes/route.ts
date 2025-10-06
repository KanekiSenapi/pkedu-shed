import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { turso } from '@/lib/turso';

/**
 * POST /api/admin/bug-reports/[id]/notes
 * Add note to bug report
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const body = await request.json();
    const { note } = body;

    if (!note || !note.trim()) {
      return NextResponse.json(
        { success: false, error: 'Notatka nie może być pusta' },
        { status: 400 }
      );
    }

    const result = await turso.execute({
      sql: `INSERT INTO bug_report_notes (report_id, admin_id, note) VALUES (?, ?, ?)`,
      args: [params.id, session.user.id, note.trim()],
    });

    return NextResponse.json({
      success: true,
      note_id: Number(result.lastInsertRowid),
      message: 'Notatka dodana',
    });
  } catch (error) {
    console.error('Error adding note:', error);
    return NextResponse.json(
      { success: false, error: 'Błąd podczas dodawania notatki' },
      { status: 500 }
    );
  }
}
