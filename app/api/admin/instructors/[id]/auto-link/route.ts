import { NextRequest, NextResponse } from 'next/server';
import { findMatchingRelationsForInstructor } from '@/lib/candidateDetector';
import { turso } from '@/lib/turso';
import { randomUUID } from 'crypto';

// POST - Auto-link instructor to subjects based on schedule data
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const instructorId = params.id;

    if (!instructorId) {
      return NextResponse.json(
        { success: false, error: 'Instructor ID required' },
        { status: 400 }
      );
    }

    // Find matching relations
    const matchingRelations = await findMatchingRelationsForInstructor(instructorId);

    if (matchingRelations.length === 0) {
      return NextResponse.json({
        success: true,
        linked: 0,
        message: 'No matching subjects found',
      });
    }

    // Create relations
    let successCount = 0;
    let errorCount = 0;
    const now = new Date().toISOString();

    for (const relation of matchingRelations) {
      try {
        const relationId = randomUUID();

        await turso.execute({
          sql: `
            INSERT INTO subject_instructors (id, subject_id, instructor_id, created_at)
            VALUES (?, ?, ?, ?)
          `,
          args: [relationId, relation.subjectId, instructorId, now],
        });

        successCount++;
      } catch (error) {
        console.error('Error creating relation:', error);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      linked: successCount,
      errors: errorCount,
      relations: matchingRelations.map(r => ({
        subjectName: r.subjectName,
        occurrences: r.occurrences,
      })),
    });
  } catch (error) {
    console.error('Error auto-linking instructor:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to auto-link instructor' },
      { status: 500 }
    );
  }
}
