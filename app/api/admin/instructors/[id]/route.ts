import { NextRequest, NextResponse } from 'next/server';
import { turso } from '@/lib/turso';

// GET - Get single instructor by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await turso.execute({
      sql: 'SELECT * FROM instructors WHERE id = ?',
      args: [id],
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Instructor not found' },
        { status: 404 }
      );
    }

    const row = result.rows[0];
    const instructor = {
      id: row.id,
      full_name: row.full_name,
      abbreviations: JSON.parse(String(row.abbreviations || '[]')),
      created_at: row.created_at,
      updated_at: row.updated_at,
    };

    return NextResponse.json({ success: true, instructor });
  } catch (error) {
    console.error('Error fetching instructor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch instructor' },
      { status: 500 }
    );
  }
}
