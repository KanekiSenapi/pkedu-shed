import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { turso } from '@/lib/turso';

/**
 * GET /api/admin/bug-reports/[id]
 * Get single bug report with notes
 */
export async function GET(
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

    // Get bug report
    const reportResult = await turso.execute({
      sql: `SELECT * FROM bug_reports WHERE id = ?`,
      args: [params.id],
    });

    if (reportResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Zgłoszenie nie znalezione' },
        { status: 404 }
      );
    }

    const report = reportResult.rows[0];

    // Get notes
    const notesResult = await turso.execute({
      sql: `
        SELECT brn.*, u.email as admin_email, u.name as admin_name
        FROM bug_report_notes brn
        JOIN users u ON brn.admin_id = u.id
        WHERE brn.report_id = ?
        ORDER BY brn.created_at DESC
      `,
      args: [params.id],
    });

    const notes = notesResult.rows.map(row => ({
      id: Number(row.id),
      report_id: Number(row.report_id),
      admin_id: row.admin_id,
      admin_email: row.admin_email,
      admin_name: row.admin_name,
      note: row.note,
      created_at: row.created_at,
    }));

    return NextResponse.json({
      success: true,
      report: {
        id: Number(report.id),
        type: report.type,
        title: report.title,
        description: report.description,
        url: report.url,
        user_info: report.user_info,
        contact_email: report.contact_email,
        user_agent: report.user_agent,
        status: report.status,
        created_at: report.created_at,
      },
      notes,
    });
  } catch (error) {
    console.error('Error fetching bug report:', error);
    return NextResponse.json(
      { success: false, error: 'Błąd podczas pobierania zgłoszenia' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/bug-reports/[id]
 * Update bug report status
 */
export async function PATCH(
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
    const { status } = body;

    if (!status || !['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Nieprawidłowy status' },
        { status: 400 }
      );
    }

    await turso.execute({
      sql: `UPDATE bug_reports SET status = ? WHERE id = ?`,
      args: [status, params.id],
    });

    return NextResponse.json({
      success: true,
      message: 'Status zaktualizowany',
    });
  } catch (error) {
    console.error('Error updating bug report:', error);
    return NextResponse.json(
      { success: false, error: 'Błąd podczas aktualizacji zgłoszenia' },
      { status: 500 }
    );
  }
}
