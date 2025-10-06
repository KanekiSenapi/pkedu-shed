import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { saveUserPreferencesToDB, loadUserPreferencesFromDB } from '@/lib/auth-db';

/**
 * GET /api/preferences
 * Load user preferences from database
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Nie jesteś zalogowany' },
        { status: 401 }
      );
    }

    const preferences = await loadUserPreferencesFromDB(session.user.id);

    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('Error loading preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Błąd podczas wczytywania preferencji' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/preferences
 * Save user preferences to database
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Nie jesteś zalogowany' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { preferences } = body;

    if (!preferences) {
      return NextResponse.json(
        { success: false, error: 'Brak preferencji do zapisania' },
        { status: 400 }
      );
    }

    await saveUserPreferencesToDB(session.user.id, preferences);

    return NextResponse.json({
      success: true,
      message: 'Preferencje zostały zapisane',
    });
  } catch (error) {
    console.error('Error saving preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Błąd podczas zapisywania preferencji' },
      { status: 500 }
    );
  }
}
