"use client";

import { useEffect, useState } from 'react';

interface ClassActionsProps {
  date: string;
  time: string;
  subject: string;
}

export function ClassActions({ date, time, subject }: ClassActionsProps) {
  const [attended, setAttended] = useState<boolean | null>(null);
  const [note, setNote] = useState('');
  const [existingNote, setExistingNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchData();
  }, [date, time, subject]);

  const fetchData = async () => {
    try {
      // Fetch attendance
      const attendanceRes = await fetch(
        `/api/attendance?date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}&subject=${encodeURIComponent(subject)}`
      );
      if (attendanceRes.ok) {
        const attendanceData = await attendanceRes.json();
        if (attendanceData.attendance) {
          setAttended(attendanceData.attendance.attended);
        }
      }

      // Fetch note
      const noteRes = await fetch(
        `/api/notes?date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}&subject=${encodeURIComponent(subject)}`
      );
      if (noteRes.ok) {
        const noteData = await noteRes.json();
        if (noteData.note) {
          setExistingNote(noteData.note.note);
          setNote(noteData.note.note);
        }
      }
    } catch (error) {
      console.error('Failed to fetch class data:', error);
    }
  };

  const handleAttendanceChange = async (newAttended: boolean) => {
    setAttended(newAttended);
    setSaving(true);

    try {
      await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, time, subject, attended: newAttended }),
      });
    } catch (error) {
      console.error('Failed to save attendance:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleNoteSave = async () => {
    if (!note.trim()) {
      return;
    }

    setSaving(true);

    try {
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, time, subject, note: note.trim() }),
      });

      setExistingNote(note.trim());
      setEditing(false);
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleNoteDelete = async () => {
    if (!existingNote) return;

    if (!confirm('Czy na pewno chcesz usunąć tę notatkę?')) return;

    setSaving(true);

    try {
      const noteRes = await fetch(
        `/api/notes?date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}&subject=${encodeURIComponent(subject)}`
      );
      if (noteRes.ok) {
        const noteData = await noteRes.json();
        if (noteData.note) {
          await fetch(`/api/notes?id=${noteData.note.id}`, {
            method: 'DELETE',
          });
          setExistingNote('');
          setNote('');
        }
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Attendance */}
      <div>
        <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Obecność</div>
        <div className="flex gap-2">
          <button
            onClick={() => handleAttendanceChange(true)}
            disabled={saving}
            className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
              attended === true
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            ✓ Byłem
          </button>
          <button
            onClick={() => handleAttendanceChange(false)}
            disabled={saving}
            className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
              attended === false
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            ✗ Nie byłem
          </button>
        </div>
      </div>

      {/* Notes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-gray-500 uppercase tracking-wide">Notatka</div>
          {existingNote && !editing && (
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(true)}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Edytuj
              </button>
              <button
                onClick={handleNoteDelete}
                className="text-xs text-red-600 hover:text-red-700"
                disabled={saving}
              >
                Usuń
              </button>
            </div>
          )}
        </div>

        {!existingNote || editing ? (
          <div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Dodaj notatkę do tych zajęć..."
              className="w-full p-3 border border-gray-300 text-sm min-h-[80px] focus:outline-none focus:border-blue-500"
              disabled={saving}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleNoteSave}
                disabled={saving || !note.trim()}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Zapisywanie...' : 'Zapisz notatkę'}
              </button>
              {editing && (
                <button
                  onClick={() => {
                    setNote(existingNote);
                    setEditing(false);
                  }}
                  disabled={saving}
                  className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300 transition-colors"
                >
                  Anuluj
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-3 bg-gray-50 border border-gray-200 text-sm text-gray-900 whitespace-pre-wrap">
            {existingNote}
          </div>
        )}
      </div>
    </div>
  );
}
