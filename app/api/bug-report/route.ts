import { NextResponse } from 'next/server';
import { turso } from '@/lib/turso';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, title, description, url, userInfo, contactEmail } = body;

    // Validation
    if (!type || !title || !description) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user agent from headers
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    // Insert bug report
    const result = await turso.execute({
      sql: `
        INSERT INTO bug_reports (type, title, description, url, user_info, contact_email, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        type,
        title,
        description,
        url || null,
        userInfo || null,
        contactEmail || null,
        userAgent,
      ],
    });

    return NextResponse.json({
      success: true,
      id: result.lastInsertRowid,
      message: 'Zgłoszenie zostało wysłane. Dziękujemy!',
    });
  } catch (error) {
    console.error('Error creating bug report:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
