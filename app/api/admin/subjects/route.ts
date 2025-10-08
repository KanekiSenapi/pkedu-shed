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
    const tryb = searchParams.get('tryb');

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
    if (tryb) {
      query += ' AND tryb = ?';
      args.push(tryb);
    }

    query += ' ORDER BY kierunek, stopien, rok, semestr, tryb, name';

    const result = await turso.execute({ sql: query, args });

    // Get instructor counts for all subjects
    const instructorCounts = await turso.execute({
      sql: 'SELECT subject_id, COUNT(*) as count FROM subject_instructors GROUP BY subject_id',
      args: [],
    });

    const countMap = new Map<string, number>();
    instructorCounts.rows.forEach((row: any) => {
      countMap.set(row.subject_id, Number(row.count));
    });

    const subjects = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      abbreviations: JSON.parse(row.abbreviations || '[]'),
      kierunek: row.kierunek,
      stopien: row.stopien,
      rok: row.rok,
      semestr: row.semestr,
      tryb: row.tryb || 'stacjonarne',
      created_at: row.created_at,
      updated_at: row.updated_at,
      instructorCount: countMap.get(row.id) || 0,
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
    const { name, abbreviations, kierunek, stopien, rok, semestr, tryb } = await request.json();

    if (!name || !kierunek || !stopien || rok === undefined || semestr === undefined || !tryb) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(abbreviations) || abbreviations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one abbreviation is required' },
        { status: 400 }
      );
    }

    // Check for duplicate subjects with same name and context
    const existingResult = await turso.execute({
      sql: `
        SELECT id, name, abbreviations FROM subjects
        WHERE kierunek = ? AND stopien = ? AND rok = ? AND semestr = ? AND tryb = ?
      `,
      args: [kierunek, stopien, rok, semestr, tryb],
    });

    for (const row of existingResult.rows) {
      // Check if name matches (case-insensitive)
      if (String(row.name).toLowerCase() === name.toLowerCase()) {
        return NextResponse.json(
          {
            success: false,
            error: `Przedmiot "${name}" już istnieje w tym kontekście (${kierunek} ${stopien}st. R${rok} S${semestr} ${tryb})`
          },
          { status: 400 }
        );
      }

      // Check if any abbreviation matches
      const existingAbbrs = JSON.parse(String(row.abbreviations || '[]'));
      const matchingAbbr = abbreviations.find(abbr =>
        existingAbbrs.some((existing: string) => existing.toLowerCase() === abbr.toLowerCase())
      );

      if (matchingAbbr) {
        return NextResponse.json(
          {
            success: false,
            error: `Alias "${matchingAbbr}" już istnieje dla przedmiotu "${row.name}" w tym kontekście`
          },
          { status: 400 }
        );
      }
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    await turso.execute({
      sql: `
        INSERT INTO subjects (id, name, abbreviations, kierunek, stopien, rok, semestr, tryb, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [id, name, JSON.stringify(abbreviations), kierunek, stopien, rok, semestr, tryb, now, now],
    });

    return NextResponse.json({
      success: true,
      subject: {
        id,
        name,
        abbreviations,
        kierunek,
        stopien,
        rok,
        semestr,
        tryb,
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
    const { id, name, abbreviations, kierunek, stopien, rok, semestr, tryb } = await request.json();

    if (!id || !name || !kierunek || !stopien || rok === undefined || semestr === undefined || !tryb) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(abbreviations) || abbreviations.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one abbreviation is required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    await turso.execute({
      sql: `
        UPDATE subjects
        SET name = ?, abbreviations = ?, kierunek = ?, stopien = ?, rok = ?, semestr = ?, tryb = ?, updated_at = ?
        WHERE id = ?
      `,
      args: [name, JSON.stringify(abbreviations), kierunek, stopien, rok, semestr, tryb, now, id],
    });

    return NextResponse.json({
      success: true,
      subject: {
        id,
        name,
        abbreviations,
        kierunek,
        stopien,
        rok,
        semestr,
        tryb,
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
