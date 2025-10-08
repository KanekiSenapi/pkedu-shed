"use client";

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface Subject {
  id: string;
  name: string;
  kierunek: string;
  stopien: string;
  rok: number;
  semestr: number;
  tryb: string;
  created_at: string;
  updated_at: string;
}

export function SubjectManagement() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    kierunek: 'Informatyka',
    stopien: 'I',
    rok: 1,
    semestr: 1,
    tryb: 'stacjonarne',
  });

  // Filters
  const [filters, setFilters] = useState({
    kierunek: '',
    stopien: '',
    rok: '',
    semestr: '',
    tryb: '',
  });

  useEffect(() => {
    loadSubjects();
  }, [filters]);

  const loadSubjects = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.kierunek) params.append('kierunek', filters.kierunek);
      if (filters.stopien) params.append('stopien', filters.stopien);
      if (filters.rok) params.append('rok', filters.rok);
      if (filters.semestr) params.append('semestr', filters.semestr);
      if (filters.tryb) params.append('tryb', filters.tryb);

      const res = await fetch(`/api/admin/subjects?${params}`);
      const data = await res.json();
      if (data.success) {
        setSubjects(data.subjects);
      }
    } catch (error) {
      toast.error('Błąd ładowania przedmiotów');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error('Podaj nazwę przedmiotu');
      return;
    }

    try {
      const url = '/api/admin/subjects';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId
        ? { id: editingId, ...formData }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingId ? 'Zaktualizowano' : 'Dodano przedmiot');
        setFormData({
          name: '',
          kierunek: 'Informatyka',
          stopien: 'I',
          rok: 1,
          semestr: 1,
          tryb: 'stacjonarne',
        });
        setEditingId(null);
        loadSubjects();
      } else {
        toast.error(data.error || 'Błąd');
      }
    } catch (error) {
      toast.error('Błąd zapisu');
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingId(subject.id);
    setFormData({
      name: subject.name,
      kierunek: subject.kierunek,
      stopien: subject.stopien,
      rok: subject.rok,
      semestr: subject.semestr,
      tryb: subject.tryb || 'stacjonarne',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Usunąć przedmiot?')) return;

    try {
      const res = await fetch(`/api/admin/subjects?id=${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (data.success) {
        toast.success('Usunięto');
        loadSubjects();
      } else {
        toast.error(data.error || 'Błąd');
      }
    } catch (error) {
      toast.error('Błąd usuwania');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      name: '',
      kierunek: 'Informatyka',
      stopien: 'I',
      rok: 1,
      semestr: 1,
      tryb: 'stacjonarne',
    });
  };

  if (loading) {
    return <div className="text-center py-8">Ładowanie...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="bg-white border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {editingId ? 'Edytuj przedmiot' : 'Dodaj przedmiot'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nazwa przedmiotu
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-500"
                placeholder="Programowanie obiektowe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kierunek
              </label>
              <input
                type="text"
                value={formData.kierunek}
                onChange={(e) => setFormData({ ...formData, kierunek: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-500"
                placeholder="Informatyka"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stopień
              </label>
              <select
                value={formData.stopien}
                onChange={(e) => setFormData({ ...formData, stopien: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-500"
              >
                <option value="I">I stopień</option>
                <option value="II">II stopień</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rok
              </label>
              <select
                value={formData.rok}
                onChange={(e) => setFormData({ ...formData, rok: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-500"
              >
                {[1, 2, 3, 4, 5].map(r => (
                  <option key={r} value={r}>Rok {r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semestr
              </label>
              <select
                value={formData.semestr}
                onChange={(e) => setFormData({ ...formData, semestr: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-500"
              >
                <option value={1}>Semestr 1 (zimowy)</option>
                <option value={2}>Semestr 2 (letni)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tryb studiów
              </label>
              <select
                value={formData.tryb}
                onChange={(e) => setFormData({ ...formData, tryb: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-500"
              >
                <option value="stacjonarne">Stacjonarne</option>
                <option value="niestacjonarne">Niestacjonarne</option>
              </select>
            </div>
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

      {/* Filters */}
      <div className="bg-white border border-gray-200 p-4">
        <h3 className="text-sm font-bold text-gray-900 mb-3">Filtry</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <select
            value={filters.kierunek}
            onChange={(e) => setFilters({ ...filters, kierunek: e.target.value })}
            className="px-3 py-2 border border-gray-300 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
          >
            <option value="">Wszystkie kierunki</option>
            <option value="Informatyka">Informatyka</option>
          </select>

          <select
            value={filters.stopien}
            onChange={(e) => setFilters({ ...filters, stopien: e.target.value })}
            className="px-3 py-2 border border-gray-300 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
          >
            <option value="">Wszystkie stopnie</option>
            <option value="I">I stopień</option>
            <option value="II">II stopień</option>
          </select>

          <select
            value={filters.rok}
            onChange={(e) => setFilters({ ...filters, rok: e.target.value })}
            className="px-3 py-2 border border-gray-300 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
          >
            <option value="">Wszystkie lata</option>
            {[1, 2, 3, 4, 5].map(r => (
              <option key={r} value={r}>Rok {r}</option>
            ))}
          </select>

          <select
            value={filters.semestr}
            onChange={(e) => setFilters({ ...filters, semestr: e.target.value })}
            className="px-3 py-2 border border-gray-300 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
          >
            <option value="">Wszystkie semestry</option>
            <option value="1">Semestr 1</option>
            <option value="2">Semestr 2</option>
          </select>

          <select
            value={filters.tryb}
            onChange={(e) => setFilters({ ...filters, tryb: e.target.value })}
            className="px-3 py-2 border border-gray-300 text-sm text-gray-900 focus:outline-none focus:border-blue-500"
          >
            <option value="">Wszystkie tryby</option>
            <option value="stacjonarne">Stacjonarne</option>
            <option value="niestacjonarne">Niestacjonarne</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="bg-white border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            Lista przedmiotów ({subjects.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Przedmiot
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Kierunek
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Stopień
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Rok
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Semestr
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Tryb
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {subjects.map((subject) => (
                <tr key={subject.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {subject.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {subject.kierunek}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {subject.stopien} st.
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {subject.rok}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {subject.semestr}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {subject.tryb === 'niestacjonarne' ? 'Niestacj.' : 'Stacj.'}
                  </td>
                  <td className="px-4 py-3 text-sm text-right space-x-2">
                    <button
                      onClick={() => handleEdit(subject)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Edytuj
                    </button>
                    <button
                      onClick={() => handleDelete(subject.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Usuń
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {subjects.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Brak przedmiotów
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
