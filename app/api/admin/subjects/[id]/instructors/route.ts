import { NextRequest, NextResponse } from 'next/server';
import { turso } from '@/lib/turso';
import { randomUUID } from 'crypto';

// GET - Get instructors for a subject
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: subjectId } = await params;

    const result = await turso.execute({
      sql: `
        SELECT i.id, i.full_name, i.abbreviations
        FROM instructors i
        INNER JOIN subject_instructors si ON i.id = si.instructor_id
        WHERE si.subject_id = ?
        ORDER BY i.full_name
      `,
      args: [subjectId],
    });

    const instructors = result.rows.map((row: any) => ({
      id: row.id,
      full_name: row.full_name,
      abbreviations: JSON.parse(row.abbreviations as string),
    }));

    return NextResponse.json({ success: true, instructors });
  } catch (error) {
    console.error('Error fetching subject instructors:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch instructors' },
      { status: 500 }
    );
  }
}

// POST - Add instructor to subject
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: subjectId } = await params;
    const { instructor_id } = await request.json();

    if (!instructor_id) {
      return NextResponse.json(
        { success: false, error: 'Instructor ID required' },
        { status: 400 }
      );
    }

    // Check if relation already exists
    const existing = await turso.execute({
      sql: 'SELECT id FROM subject_instructors WHERE subject_id = ? AND instructor_id = ?',
      args: [subjectId, instructor_id],
    });

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Instructor already assigned to this subject' },
        { status: 409 }
      );
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    await turso.execute({
      sql: `
        INSERT INTO subject_instructors (id, subject_id, instructor_id, created_at)
        VALUES (?, ?, ?, ?)
      `,
      args: [id, subjectId, instructor_id, now],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding instructor to subject:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add instructor' },
      { status: 500 }
    );
  }
}

// DELETE - Remove instructor from subject
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: subjectId } = await params;
    const { searchParams } = new URL(request.url);
    const instructorId = searchParams.get('instructor_id');

    if (!instructorId) {
      return NextResponse.json(
        { success: false, error: 'Instructor ID required' },
        { status: 400 }
      );
    }

    await turso.execute({
      sql: 'DELETE FROM subject_instructors WHERE subject_id = ? AND instructor_id = ?',
      args: [subjectId, instructorId],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing instructor from subject:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove instructor' },
      { status: 500 }
    );
  }
}
