import { NextRequest, NextResponse } from 'next/server';
import { turso } from '@/lib/turso';
import { randomUUID } from 'crypto';

// GET - List all instructors
export async function GET(request: NextRequest) {
  try {
    const result = await turso.execute(`
      SELECT * FROM instructors ORDER BY full_name ASC
    `);

    const instructors = result.rows.map((row: any) => ({
      id: row.id,
      full_name: row.full_name,
      abbreviations: JSON.parse(row.abbreviations as string),
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return NextResponse.json({ success: true, instructors });
  } catch (error) {
    console.error('Error fetching instructors:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch instructors' },
      { status: 500 }
    );
  }
}

// POST - Create new instructor
export async function POST(request: NextRequest) {
  try {
    const { full_name, abbreviations } = await request.json();

    if (!full_name || !Array.isArray(abbreviations) || abbreviations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Full name and at least one abbreviation required' },
        { status: 400 }
      );
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    await turso.execute({
      sql: `
        INSERT INTO instructors (id, full_name, abbreviations, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `,
      args: [id, full_name, JSON.stringify(abbreviations), now, now],
    });

    return NextResponse.json({
      success: true,
      instructor: {
        id,
        full_name,
        abbreviations,
        created_at: now,
        updated_at: now,
      },
    });
  } catch (error) {
    console.error('Error creating instructor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create instructor' },
      { status: 500 }
    );
  }
}

// PUT - Update instructor
export async function PUT(request: NextRequest) {
  try {
    const { id, full_name, abbreviations } = await request.json();

    if (!id || !full_name || !Array.isArray(abbreviations) || abbreviations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'ID, full name, and at least one abbreviation required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    await turso.execute({
      sql: `
        UPDATE instructors
        SET full_name = ?, abbreviations = ?, updated_at = ?
        WHERE id = ?
      `,
      args: [full_name, JSON.stringify(abbreviations), now, id],
    });

    return NextResponse.json({
      success: true,
      instructor: {
        id,
        full_name,
        abbreviations,
        updated_at: now,
      },
    });
  } catch (error) {
    console.error('Error updating instructor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update instructor' },
      { status: 500 }
    );
  }
}

// DELETE - Delete instructor
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID required' },
        { status: 400 }
      );
    }

    await turso.execute({
      sql: `DELETE FROM instructors WHERE id = ?`,
      args: [id],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting instructor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete instructor' },
      { status: 500 }
    );
  }
}
