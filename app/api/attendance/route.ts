import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getClassAttendance,
  markAttendance,
  getUserAttendance,
  getAttendanceStats,
  getAttendanceBySubject,
} from '@/lib/class-attendance';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const time = searchParams.get('time');
  const subject = searchParams.get('subject');
  const stats = searchParams.get('stats');
  const bySubject = searchParams.get('bySubject');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (stats === 'true') {
    // Get attendance statistics
    const attendanceStats = await getAttendanceStats(
      session.user.id,
      startDate || undefined,
      endDate || undefined
    );
    return NextResponse.json({ stats: attendanceStats });
  }

  if (bySubject === 'true') {
    // Get attendance by subject
    const subjectStats = await getAttendanceBySubject(session.user.id);
    const statsObj: Record<string, any> = {};
    for (const [subject, stats] of subjectStats.entries()) {
      statsObj[subject] = stats;
    }
    return NextResponse.json({ bySubject: statsObj });
  }

  if (date && time && subject) {
    // Get specific attendance
    const attendance = await getClassAttendance(session.user.id, date, time, subject);
    return NextResponse.json({ attendance });
  } else {
    // Get all user attendance
    const attendance = await getUserAttendance(session.user.id);
    return NextResponse.json({ attendance });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { date, time, subject, attended } = body;

  if (!date || !time || !subject || attended === undefined) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const attendance = await markAttendance(session.user.id, date, time, subject, attended);
  return NextResponse.json({ attendance });
}
