"use client";

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface Subject {
  id: string;
  name: string;
  abbreviations: string[];
  kierunek: string;
  stopien: string;
  rok: number;
  semestr: number;
  tryb: string;
  created_at: string;
  updated_at: string;
  instructorCount?: number;
}

interface Instructor {
  id: string;
  full_name: string;
  abbreviations: string[];
}

export function SubjectManagement() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    abbreviations: '',
    kierunek: 'Informatyka',
    stopien: 'I',
    rok: 1,
    semestr: 1,
    tryb: 'stacjonarne',
  });

  // Instructor management
  const [allInstructors, setAllInstructors] = useState<Instructor[]>([]);
  const [managingInstructorsForSubject, setManagingInstructorsForSubject] = useState<string | null>(null);
  const [subjectInstructors, setSubjectInstructors] = useState<Instructor[]>([]);
  const [selectedInstructorsToAdd, setSelectedInstructorsToAdd] = useState<Set<string>>(new Set());
  const [instructorSearchQuery, setInstructorSearchQuery] = useState('');

  // Multi-select for subjects
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());

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
    loadAllInstructors();
  }, [filters]);

  const loadAllInstructors = async () => {
    try {
      const res = await fetch('/api/admin/instructors');
      const data = await res.json();
      if (data.success) {
        setAllInstructors(data.instructors);
      }
    } catch (error) {
      console.error('Error loading instructors:', error);
    }
  };

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

    const abbreviationsArray = formData.abbreviations
      .split('|')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (!formData.name) {
      toast.error('Podaj nazwę przedmiotu');
      return;
    }

    if (abbreviationsArray.length === 0) {
      toast.error('Podaj przynajmniej jeden alias');
      return;
    }

    try {
      const url = '/api/admin/subjects';
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId
        ? { id: editingId, ...formData, abbreviations: abbreviationsArray }
        : { ...formData, abbreviations: abbreviationsArray };

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
          abbreviations: '',
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
      abbreviations: subject.abbreviations.join(' | '),
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
      abbreviations: '',
      kierunek: 'Informatyka',
      stopien: 'I',
      rok: 1,
      semestr: 1,
      tryb: 'stacjonarne',
    });
  };

  const loadSubjectInstructors = async (subjectId: string) => {
    try {
      const res = await fetch(`/api/admin/subjects/${subjectId}/instructors`);
      const data = await res.json();
      if (data.success) {
        setSubjectInstructors(data.instructors);
      }
    } catch (error) {
      toast.error('Błąd ładowania wykładowców');
    }
  };

  const handleManageInstructors = async (subjectId: string) => {
    setManagingInstructorsForSubject(subjectId);
    await loadSubjectInstructors(subjectId);
  };

  const handleAddInstructorsToSubject = async () => {
    if (selectedInstructorsToAdd.size === 0 || !managingInstructorsForSubject) return;

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const instructorId of selectedInstructorsToAdd) {
        try {
          const res = await fetch(`/api/admin/subjects/${managingInstructorsForSubject}/instructors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ instructor_id: instructorId }),
          });

          const data = await res.json();
          if (data.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Dodano ${successCount} wykładowców`);
      }
      if (errorCount > 0) {
        toast.error(`Błędów: ${errorCount}`);
      }

      setSelectedInstructorsToAdd(new Set());
      setInstructorSearchQuery('');
      await loadSubjectInstructors(managingInstructorsForSubject);
    } catch (error) {
      toast.error('Błąd dodawania');
    }
  };

  const handleToggleInstructorSelection = (instructorId: string) => {
    const newSelected = new Set(selectedInstructorsToAdd);
    if (newSelected.has(instructorId)) {
      newSelected.delete(instructorId);
    } else {
      newSelected.add(instructorId);
    }
    setSelectedInstructorsToAdd(newSelected);
  };

  const handleRemoveInstructorFromSubject = async (instructorId: string) => {
    if (!managingInstructorsForSubject) return;
    if (!confirm('Usunąć wykładowcę z tego przedmiotu?')) return;

    try {
      const res = await fetch(
        `/api/admin/subjects/${managingInstructorsForSubject}/instructors?instructor_id=${instructorId}`,
        { method: 'DELETE' }
      );

      const data = await res.json();
      if (data.success) {
        toast.success('Usunięto');
        await loadSubjectInstructors(managingInstructorsForSubject);
      } else {
        toast.error(data.error || 'Błąd');
      }
    } catch (error) {
      toast.error('Błąd usuwania');
    }
  };

  const toggleSubjectSelection = (subjectId: string) => {
    const newSelected = new Set(selectedSubjects);
    if (newSelected.has(subjectId)) {
      newSelected.delete(subjectId);
    } else {
      newSelected.add(subjectId);
    }
    setSelectedSubjects(newSelected);
  };

  const handleBulkChangeTryb = async (newTryb: 'stacjonarne' | 'niestacjonarne') => {
    if (selectedSubjects.size === 0) return;
    if (!confirm(`Zmienić tryb dla ${selectedSubjects.size} przedmiotów na ${newTryb}?`)) return;

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const subjectId of selectedSubjects) {
        const subject = subjects.find(s => s.id === subjectId);
        if (!subject) continue;

        const res = await fetch('/api/admin/subjects', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: subject.id,
            name: subject.name,
            abbreviations: subject.abbreviations,
            kierunek: subject.kierunek,
            stopien: subject.stopien,
            rok: subject.rok,
            semestr: subject.semestr,
            tryb: newTryb,
          }),
        });

        const data = await res.json();
        if (data.success) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Zmieniono tryb dla ${successCount} przedmiotów`);
        setSelectedSubjects(new Set());
        loadSubjects();
      }

      if (errorCount > 0) {
        toast.error(`Błąd przy ${errorCount} przedmiotach`);
      }
    } catch (error) {
      console.error('Error changing tryb:', error);
      toast.error('Błąd podczas zmiany trybu');
    }
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aliansy (oddzielone |)
              </label>
              <input
                type="text"
                value={formData.abbreviations}
                onChange={(e) => setFormData({ ...formData, abbreviations: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-500"
                placeholder="PO | ProgOb | Prog.Obiekt."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Może być wiele aliansów używanych w planie zajęć
              </p>
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
                onChange={(e) => {
                  const newRok = parseInt(e.target.value);
                  setFormData({
                    ...formData,
                    rok: newRok,
                    // Auto-adjust semester to match new year (rok 1 = sem 1, rok 2 = sem 3, etc.)
                    semestr: (newRok - 1) * 2 + 1
                  });
                }}
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
                <option value={(formData.rok - 1) * 2 + 1}>
                  Semestr {(formData.rok - 1) * 2 + 1} (zimowy)
                </option>
                <option value={(formData.rok - 1) * 2 + 2}>
                  Semestr {(formData.rok - 1) * 2 + 2} (letni)
                </option>
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
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(s => (
              <option key={s} value={s}>
                Semestr {s} {s % 2 === 1 ? '(zimowy)' : '(letni)'}
              </option>
            ))}
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">
              Lista przedmiotów ({subjects.length})
            </h2>
            {selectedSubjects.size > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  Zaznaczono: {selectedSubjects.size}
                </span>
                <button
                  onClick={() => handleBulkChangeTryb('stacjonarne')}
                  className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm"
                >
                  Zmień na stacjonarne
                </button>
                <button
                  onClick={() => handleBulkChangeTryb('niestacjonarne')}
                  className="px-3 py-1.5 bg-purple-600 text-white hover:bg-purple-700 transition-colors text-sm"
                >
                  Zmień na niestacjonarne
                </button>
                <button
                  onClick={() => setSelectedSubjects(new Set())}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Anuluj
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={subjects.length > 0 && subjects.every(s => selectedSubjects.has(s.id))}
                    onChange={() => {
                      const allSelected = subjects.every(s => selectedSubjects.has(s.id));
                      const newSelected = new Set(selectedSubjects);

                      subjects.forEach(s => {
                        if (allSelected) {
                          newSelected.delete(s.id);
                        } else {
                          newSelected.add(s.id);
                        }
                      });

                      setSelectedSubjects(newSelected);
                    }}
                    className="w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Przedmiot
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Aliansy
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
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Wykładowcy
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                  Akcje
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {subjects.map((subject) => (
                <tr key={subject.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedSubjects.has(subject.id)}
                      onChange={() => toggleSubjectSelection(subject.id)}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {subject.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {subject.abbreviations.join(' | ')}
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
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 text-xs">
                        {subject.instructorCount || 0}
                      </span>
                      <button
                        onClick={() => handleManageInstructors(subject.id)}
                        className="text-purple-600 hover:text-purple-700 text-xs"
                      >
                        Zarządzaj
                      </button>
                    </div>
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

      {/* Instructor Management Modal */}
      {managingInstructorsForSubject && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-lg">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Wykładowcy przedmiotu
                </h2>
                <button
                  onClick={() => {
                    setManagingInstructorsForSubject(null);
                    setSubjectInstructors([]);
                    setSelectedInstructorsToAdd(new Set());
                    setInstructorSearchQuery('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* Add instructors */}
              <div className="mb-6 p-4 bg-gray-50 border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dodaj wykładowców
                </label>

                {/* Search input */}
                <input
                  type="text"
                  value={instructorSearchQuery}
                  onChange={(e) => setInstructorSearchQuery(e.target.value)}
                  placeholder="Szukaj wykładowcy..."
                  className="w-full px-3 py-2 border border-gray-300 text-sm text-gray-900 focus:outline-none focus:border-blue-500 mb-3"
                />

                {/* Instructors list with checkboxes */}
                <div className="border border-gray-200 bg-white max-h-64 overflow-y-auto mb-3">
                  {(() => {
                    const filteredInstructors = allInstructors
                      .filter(i => !subjectInstructors.find(si => si.id === i.id))
                      .filter(i =>
                        instructorSearchQuery === '' ||
                        i.full_name.toLowerCase().includes(instructorSearchQuery.toLowerCase()) ||
                        i.abbreviations.some(abbr => abbr.toLowerCase().includes(instructorSearchQuery.toLowerCase()))
                      );

                    if (filteredInstructors.length === 0) {
                      return (
                        <div className="p-4 text-sm text-gray-500 text-center">
                          {instructorSearchQuery ? 'Nie znaleziono wykładowców' : 'Wszyscy wykładowcy już przypisani'}
                        </div>
                      );
                    }

                    return filteredInstructors.map(instructor => (
                      <label
                        key={instructor.id}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 border-b border-gray-200 last:border-b-0 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedInstructorsToAdd.has(instructor.id)}
                          onChange={() => handleToggleInstructorSelection(instructor.id)}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <div className="flex-1">
                          <div className="text-sm text-gray-900">{instructor.full_name}</div>
                          <div className="text-xs text-gray-500">
                            {instructor.abbreviations.join(' | ')}
                          </div>
                        </div>
                      </label>
                    ));
                  })()}
                </div>

                <button
                  onClick={handleAddInstructorsToSubject}
                  disabled={selectedInstructorsToAdd.size === 0}
                  className="w-full px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                >
                  Dodaj zaznaczonych ({selectedInstructorsToAdd.size})
                </button>
              </div>

              {/* List of assigned instructors */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">
                  Przypisani wykładowcy ({subjectInstructors.length})
                </h3>
                {subjectInstructors.length === 0 ? (
                  <p className="text-sm text-gray-500 py-4">
                    Brak przypisanych wykładowców
                  </p>
                ) : (
                  <div className="space-y-2">
                    {subjectInstructors.map(instructor => (
                      <div
                        key={instructor.id}
                        className="flex justify-between items-center p-3 bg-white border border-gray-200"
                      >
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {instructor.full_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            Aliansy: {instructor.abbreviations.join(' | ')}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveInstructorFromSubject(instructor.id)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Usuń
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
