"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export interface ClassHomework {
  id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  created_at: string;
}

interface HomeworkListProps {
  date: string;
  time: string;
  subject: string;
}

export function HomeworkList({ date, time, subject }: HomeworkListProps) {
  const { data: session } = useSession();
  const [homework, setHomework] = useState<ClassHomework[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');

  useEffect(() => {
    if (session) {
      fetchHomework();
    }
  }, [date, time, subject, session]);

  const fetchHomework = async () => {
    try {
      const response = await fetch(
        `/api/homework?date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}&subject=${encodeURIComponent(subject)}`
      );
      if (response.ok) {
        const data = await response.json();
        setHomework(data.homework || []);
      }
    } catch (error) {
      console.error('Failed to fetch homework:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newTitle.trim()) return;

    try {
      const response = await fetch('/api/homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          time,
          subject,
          title: newTitle.trim(),
          description: newDescription.trim() || null,
          dueDate: newDueDate || null,
          priority: newPriority,
        }),
      });

      if (response.ok) {
        setNewTitle('');
        setNewDescription('');
        setNewDueDate('');
        setNewPriority('medium');
        setAdding(false);
        fetchHomework();
      }
    } catch (error) {
      console.error('Failed to add homework:', error);
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await fetch(`/api/homework?id=${id}`, {
        method: 'PATCH',
      });
      fetchHomework();
    } catch (error) {
      console.error('Failed to toggle homework:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Usunąć to zadanie?')) return;

    try {
      await fetch(`/api/homework?id=${id}`, {
        method: 'DELETE',
      });
      fetchHomework();
    } catch (error) {
      console.error('Failed to delete homework:', error);
    }
  };

  if (!session) {
    return null;
  }

  const priorityColors = {
    low: 'bg-gray-100 text-gray-700 border-gray-300',
    medium: 'bg-blue-100 text-blue-700 border-blue-300',
    high: 'bg-red-100 text-red-700 border-red-300',
  };

  const priorityLabels = {
    low: 'Niski',
    medium: 'Średni',
    high: 'Wysoki',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-gray-500 uppercase tracking-wide">Zadania</div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            + Dodaj zadanie
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-4 text-sm">Ładowanie...</div>
      ) : (
        <>
          {homework.length === 0 && !adding && (
            <div className="text-sm text-gray-500 text-center py-4">
              Brak zadań. Dodaj pierwsze zadanie!
            </div>
          )}

          {homework.length > 0 && (
            <div className="space-y-2 mb-3">
              {homework.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 border ${
                    item.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => handleToggle(item.id)}
                      className="mt-1 w-4 h-4 text-blue-600 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div
                        className={`font-medium text-sm ${
                          item.completed ? 'line-through text-gray-500' : 'text-gray-900'
                        }`}
                      >
                        {item.title}
                      </div>
                      {item.description && (
                        <div className="text-xs text-gray-600 mt-1">{item.description}</div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`text-xs px-2 py-0.5 border ${priorityColors[item.priority]}`}
                        >
                          {priorityLabels[item.priority]}
                        </span>
                        {item.due_date && (
                          <span className="text-xs text-gray-500">
                            📅 {new Date(item.due_date).toLocaleDateString('pl-PL')}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {adding && (
            <div className="border border-blue-200 p-3 bg-blue-50 space-y-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Tytuł zadania..."
                className="w-full p-2 border border-gray-300 text-sm focus:outline-none focus:border-blue-500"
                autoFocus
              />
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Opis (opcjonalnie)..."
                className="w-full p-2 border border-gray-300 text-sm min-h-[60px] focus:outline-none focus:border-blue-500"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Termin</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Priorytet</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as 'low' | 'medium' | 'high')}
                    className="w-full p-2 border border-gray-300 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="low">Niski</option>
                    <option value="medium">Średni</option>
                    <option value="high">Wysoki</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAdd}
                  disabled={!newTitle.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Dodaj
                </button>
                <button
                  onClick={() => {
                    setAdding(false);
                    setNewTitle('');
                    setNewDescription('');
                    setNewDueDate('');
                    setNewPriority('medium');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-300 transition-colors"
                >
                  Anuluj
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
