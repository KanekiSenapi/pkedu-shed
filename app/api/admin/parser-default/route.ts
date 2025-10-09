import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDefaultParserVersion, setDefaultParserVersion } from '@/lib/system-config';
import { parserRegistry } from '@/lib/parsers/parser-registry';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/parser-default
 * Get the system default parser version
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

    const version = await getDefaultParserVersion();

    return NextResponse.json({
      success: true,
      version,
    });
  } catch (error) {
    console.error('[Parser Default] Error:', error);
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
 * POST /api/admin/parser-default
 * Set the system default parser version
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

    const body = await request.json();
    const { version } = body;

    if (!version) {
      return NextResponse.json(
        { success: false, error: 'Parser version is required' },
        { status: 400 }
      );
    }

    // Verify parser exists
    const parser = parserRegistry.getParser(version);
    if (!parser) {
      return NextResponse.json(
        { success: false, error: `Parser version ${version} not found` },
        { status: 404 }
      );
    }

    await setDefaultParserVersion(version);

    console.log(`[Parser Default] Set default parser to: ${parser.name} v${version}`);

    return NextResponse.json({
      success: true,
      version,
      parser: parser.getMetadata(),
    });
  } catch (error) {
    console.error('[Parser Default] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
