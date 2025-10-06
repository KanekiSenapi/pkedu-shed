import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getClassHomework,
  getUserHomework,
  createHomework,
  updateHomework,
  deleteHomework,
  toggleHomeworkCompleted,
} from '@/lib/class-homework';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const time = searchParams.get('time');
  const subject = searchParams.get('subject');
  const onlyIncomplete = searchParams.get('onlyIncomplete') === 'true';

  if (date && time && subject) {
    // Get homework for specific class
    const homework = await getClassHomework(session.user.id, date, time, subject);
    return NextResponse.json({ homework });
  } else {
    // Get all user homework
    const homework = await getUserHomework(session.user.id, onlyIncomplete);
    return NextResponse.json({ homework });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { date, time, subject, title, description, dueDate, priority } = body;

  if (!date || !time || !subject || !title) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const homework = await createHomework(
    session.user.id,
    date,
    time,
    subject,
    title,
    description || null,
    dueDate || null,
    priority || 'medium'
  );

  return NextResponse.json({ homework });
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { id, updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'Missing homework ID' }, { status: 400 });
  }

  await updateHomework(session.user.id, id, updates);
  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing homework ID' }, { status: 400 });
  }

  await toggleHomeworkCompleted(session.user.id, parseInt(id));
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing homework ID' }, { status: 400 });
  }

  await deleteHomework(session.user.id, parseInt(id));
  return NextResponse.json({ success: true });
}
