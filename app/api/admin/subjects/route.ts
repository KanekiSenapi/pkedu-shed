import { NextRequest, NextResponse } from 'next/server';
import { turso } from '@/lib/turso';
import { randomUUID } from 'crypto';

// GET - List all subjects (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const kierunek = searchParams.get('kierunek');
    const stopien = searchParams.get('stopien');
    const rok = searchParams.get('rok');
    const semestr = searchParams.get('semestr');

    let query = 'SELECT * FROM subjects WHERE 1=1';
    const args: any[] = [];

    if (kierunek) {
      query += ' AND kierunek = ?';
      args.push(kierunek);
    }
    if (stopien) {
      query += ' AND stopien = ?';
      args.push(stopien);
    }
    if (rok) {
      query += ' AND rok = ?';
      args.push(parseInt(rok));
    }
    if (semestr) {
      query += ' AND semestr = ?';
      args.push(parseInt(semestr));
    }

    query += ' ORDER BY kierunek, stopien, rok, semestr, name';

    const result = await turso.execute({ sql: query, args });

    const subjects = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      kierunek: row.kierunek,
      stopien: row.stopien,
      rok: row.rok,
      semestr: row.semestr,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));

    return NextResponse.json({ success: true, subjects });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subjects' },
      { status: 500 }
    );
  }
}

// POST - Create new subject
export async function POST(request: NextRequest) {
  try {
    const { name, kierunek, stopien, rok, semestr } = await request.json();

    if (!name || !kierunek || !stopien || rok === undefined || semestr === undefined) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    await turso.execute({
      sql: `
        INSERT INTO subjects (id, name, kierunek, stopien, rok, semestr, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [id, name, kierunek, stopien, rok, semestr, now, now],
    });

    return NextResponse.json({
      success: true,
      subject: {
        id,
        name,
        kierunek,
        stopien,
        rok,
        semestr,
        created_at: now,
        updated_at: now,
      },
    });
  } catch (error) {
    console.error('Error creating subject:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create subject' },
      { status: 500 }
    );
  }
}

// PUT - Update subject
export async function PUT(request: NextRequest) {
  try {
    const { id, name, kierunek, stopien, rok, semestr } = await request.json();

    if (!id || !name || !kierunek || !stopien || rok === undefined || semestr === undefined) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    await turso.execute({
      sql: `
        UPDATE subjects
        SET name = ?, kierunek = ?, stopien = ?, rok = ?, semestr = ?, updated_at = ?
        WHERE id = ?
      `,
      args: [name, kierunek, stopien, rok, semestr, now, id],
    });

    return NextResponse.json({
      success: true,
      subject: {
        id,
        name,
        kierunek,
        stopien,
        rok,
        semestr,
        updated_at: now,
      },
    });
  } catch (error) {
    console.error('Error updating subject:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update subject' },
      { status: 500 }
    );
  }
}

// DELETE - Delete subject
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
      sql: `DELETE FROM subjects WHERE id = ?`,
      args: [id],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subject:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete subject' },
      { status: 500 }
    );
  }
}
