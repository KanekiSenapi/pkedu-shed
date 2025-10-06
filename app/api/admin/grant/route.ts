import { NextResponse } from 'next/server';
import { turso } from '@/lib/turso';

/**
 * POST /api/admin/grant
 * Grant admin permissions to a user by email
 * Protected by ADMIN_TOKEN environment variable
 */
export async function POST(request: Request) {
  try {
    // Check authorization token
    const authHeader = request.headers.get('authorization');
    const adminToken = process.env.ADMIN_TOKEN;

    if (!adminToken) {
      return NextResponse.json(
        { success: false, error: 'Admin token not configured' },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${adminToken}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const userResult = await turso.execute({
      sql: 'SELECT id, email, is_admin FROM users WHERE email = ?',
      args: [email],
    });

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    if (user.is_admin === 1) {
      return NextResponse.json({
        success: true,
        message: 'User is already an admin',
        user: {
          id: user.id,
          email: user.email,
          is_admin: true,
        },
      });
    }

    // Grant admin permissions
    await turso.execute({
      sql: 'UPDATE users SET is_admin = 1, updated_at = CURRENT_TIMESTAMP WHERE email = ?',
      args: [email],
    });

    return NextResponse.json({
      success: true,
      message: 'Admin permissions granted successfully',
      user: {
        id: user.id,
        email: user.email,
        is_admin: true,
      },
    });
  } catch (error) {
    console.error('Error granting admin permissions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
