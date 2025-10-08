import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { parserRegistry } from '@/lib/parsers/parser-registry';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/admin/parser-test
 * Test a parser against an uploaded Excel file
 * Returns detailed debug information
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - admin access required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const parserVersion = formData.get('parserVersion') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Get parser
    const parser = parserVersion
      ? parserRegistry.getParser(parserVersion)
      : parserRegistry.getDefaultParser();

    if (!parser) {
      return NextResponse.json(
        { success: false, error: `Parser version ${parserVersion} not found` },
        { status: 404 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`[Parser Test] Testing ${parser.name} v${parser.version} on file: ${file.name} (${buffer.length} bytes)`);

    // Parse with debug info
    const result = await parser.parse(buffer);

    console.log(`[Parser Test] Parsing completed in ${result.stats.processingTime}ms`);
    console.log(`[Parser Test] Stats:`, {
      totalEntries: result.stats.totalEntries,
      unknownInstructors: result.stats.unknownInstructors.length,
      unknownSubjects: result.stats.unknownSubjects.length,
    });

    return NextResponse.json({
      success: true,
      result: {
        ...result,
        // Don't send the full schedule to reduce payload size
        schedule: {
          sections: result.schedule.sections.map(s => ({
            kierunek: s.kierunek,
            stopien: s.stopien,
            rok: s.rok,
            semestr: s.semestr,
            tryb: s.tryb,
            groups: s.groups,
            entryCount: s.entries.length,
          })),
          lastUpdated: result.schedule.lastUpdated,
        },
      },
    });
  } catch (error) {
    console.error('[Parser Test] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/parser-test
 * Get list of available parsers
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin auth
    const session = await getServerSession(authOptions);
    if (!session || !(session.user as any)?.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - admin access required' },
        { status: 401 }
      );
    }

    const parsers = parserRegistry.getAllParsersMetadata();

    return NextResponse.json({
      success: true,
      parsers,
    });
  } catch (error) {
    console.error('[Parser Test] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
