import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { turso } from '@/lib/turso';

/**
 * PATCH /api/admin/users/[id]/role
 * Update user role (admin, starosta, user)
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || !(session.user as any).isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Brak uprawnień' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { role, starosta_rok, starosta_groups } = body;

    if (!role || !['user', 'starosta', 'admin'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Nieprawidłowa rola' },
        { status: 400 }
      );
    }

    // Validate starosta data
    if (role === 'starosta') {
      if (!starosta_rok || !starosta_groups || !Array.isArray(starosta_groups) || starosta_groups.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Starosta wymaga roku i grup' },
          { status: 400 }
        );
      }
    }

    const isAdmin = role === 'admin' ? 1 : 0;
    const starostaGroupsJson = role === 'starosta' ? JSON.stringify(starosta_groups) : null;
    const starostaRok = role === 'starosta' ? starosta_rok : null;

    await turso.execute({
      sql: `UPDATE users
            SET role = ?, is_admin = ?, starosta_rok = ?, starosta_groups = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?`,
      args: [role, isAdmin, starostaRok, starostaGroupsJson, id],
    });

    return NextResponse.json({
      success: true,
      message: 'Rola zaktualizowana',
    });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { success: false, error: 'Błąd serwera' },
      { status: 500 }
    );
  }
}
