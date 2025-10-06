import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getClassNote, saveClassNote, deleteClassNote, getUserNotes } from '@/lib/class-notes';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const time = searchParams.get('time');
  const subject = searchParams.get('subject');

  if (date && time && subject) {
    // Get specific note
    const note = await getClassNote(session.user.id, date, time, subject);
    return NextResponse.json({ note });
  } else {
    // Get all user notes
    const notes = await getUserNotes(session.user.id);
    return NextResponse.json({ notes });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { date, time, subject, note } = body;

  if (!date || !time || !subject || !note) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const savedNote = await saveClassNote(session.user.id, date, time, subject, note);
  return NextResponse.json({ note: savedNote });
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const noteId = searchParams.get('id');

  if (!noteId) {
    return NextResponse.json({ error: 'Missing note ID' }, { status: 400 });
  }

  await deleteClassNote(session.user.id, parseInt(noteId));
  return NextResponse.json({ success: true });
}
