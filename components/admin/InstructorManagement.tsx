"use client";

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface Instructor {
  id: string;
  full_name: string;
  abbreviations: string[];
  created_at: string;
  updated_at: string;
}

export function InstructorManagement() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    abbreviations: '',
  });

  useEffect(() => {
    loadInstructors();
  }, []);

  const loadInstructors = async () => {
    try {
      const res = await fetch('/api/admin/instructors');
      const data = await res.json();
      if (data.success) {
        setInstructors(data.instructors);
      }
    } catch (error) {
      toast.error('Błąd ładowania wykładowców');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const abbreviationsArray = formData.abbreviations
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (!formData.full_name || abbreviationsArray.length === 0) {
      toast.error('Podaj imię i nazwisko oraz przynajmniej jeden skrót');
      return;
    }

    try {
      const url = '/api/admin/instructors';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId
        ? { id: editingId, full_name: formData.full_name, abbreviations: abbreviationsArray }
        : { full_name: formData.full_name, abbreviations: abbreviationsArray };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingId ? 'Zaktualizowano' : 'Dodano wykładowcę');
        setFormData({ full_name: '', abbreviations: '' });
        setEditingId(null);
        loadInstructors();
      } else {
        toast.error(data.error || 'Błąd');
      }
    } catch (error) {
      toast.error('Błąd zapisu');
    }
  };

  const handleEdit = (instructor: Instructor) => {
    setEditingId(instructor.id);
    setFormData({
      full_name: instructor.full_name,
      abbreviations: instructor.abbreviations.join(', '),
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Usunąć wykładowcę?')) return;

    try {
      const res = await fetch(`/api/admin/instructors?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Usunięto');
        loadInstructors();
      } else {
        toast.error(data.error || 'Błąd');
      }
    } catch (error) {
      toast.error('Błąd usuwania');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ full_name: '', abbreviations: '' });
  };

  if (loading) {
    return <div className="text-center py-8">Ładowanie...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="bg-white border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {editingId ? 'Edytuj wykładowcę' : 'Dodaj wykładowcę'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imię i nazwisko
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-500"
              placeholder="Dr Jan Kowalski"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skróty (oddzielone przecinkami)
            </label>
            <input
              type="text"
              value={formData.abbreviations}
              onChange={(e) => setFormData({ ...formData, abbreviations: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-500"
              placeholder="JK, J.Kowalski, dr J.K."
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Może być wiele skrótów, np: JK, J.Kowalski, dr J.K.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              {editingId ? 'Zapisz' : 'Dodaj'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="px-4 py-2 bg-gray-300 text-gray-700 hover:bg-gray-400 transition-colors"
              >
                Anuluj
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List */}
      <div className="bg-white border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            Lista wykładowców ({instructors.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Imię i nazwisko
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Skróty
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {instructors.map((instructor) => (
                <tr key={instructor.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {instructor.full_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {instructor.abbreviations.join(', ')}
                  </td>
                  <td className="px-4 py-3 text-sm text-right space-x-2">
                    <button
                      onClick={() => handleEdit(instructor)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Edytuj
                    </button>
                    <button
                      onClick={() => handleDelete(instructor.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Usuń
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {instructors.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Brak wykładowców
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
