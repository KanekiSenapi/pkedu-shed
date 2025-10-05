import { NextResponse } from 'next/server';
import { clearDatabase } from '@/lib/schedule-db';

export async function POST() {
  try {
    await clearDatabase();
    return NextResponse.json({ success: true, message: 'Database cleared' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
