import { NextRequest, NextResponse } from 'next/server';
import { detectInstructorCandidates, detectSubjectCandidates, detectMissingRelations } from '@/lib/candidateDetector';
import { turso } from '@/lib/turso';
import { randomUUID } from 'crypto';

// GET - Detect and return all candidates
export async function GET(request: NextRequest) {
  try {
    // Run all detection functions in parallel
    const [instructors, subjects, relations] = await Promise.all([
      detectInstructorCandidates(),
      detectSubjectCandidates(),
      detectMissingRelations(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        instructors,
        subjects,
        relations,
        stats: {
          totalInstructors: instructors.length,
          totalSubjects: subjects.length,
          totalRelations: relations.length,
        },
      },
    });
  } catch (error) {
    console.error('Error getting candidates:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get candidates' },
      { status: 500 }
    );
  }
}

// POST - Add candidate to ignore list
export async function POST(request: NextRequest) {
  try {
    const { type, value, context, reason } = await request.json();

    if (!type || !value) {
      return NextResponse.json(
        { success: false, error: 'Type and value are required' },
        { status: 400 }
      );
    }

    if (!['instructor', 'subject', 'relation'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid type' },
        { status: 400 }
      );
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    await turso.execute({
      sql: `
        INSERT INTO candidate_ignores (id, type, value, context, reason, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      args: [id, type, value, context || null, reason || null, now],
    });

    return NextResponse.json({
      success: true,
      message: 'Candidate ignored successfully',
    });
  } catch (error) {
    console.error('Error ignoring candidate:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to ignore candidate' },
      { status: 500 }
    );
  }
}

// DELETE - Remove from ignore list
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
      sql: 'DELETE FROM candidate_ignores WHERE id = ?',
      args: [id],
    });

    return NextResponse.json({
      success: true,
      message: 'Ignore rule removed successfully',
    });
  } catch (error) {
    console.error('Error removing ignore rule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove ignore rule' },
      { status: 500 }
    );
  }
}
