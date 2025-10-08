"use client";

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

interface InstructorCandidate {
  abbreviation: string;
  occurrences: number;
  contexts: Array<{
    kierunek: string;
    stopien: string;
    rok: number;
    semestr: number;
    tryb: string;
  }>;
  sampleClasses: Array<{
    date: string;
    time: string;
    subject: string;
    group: string;
  }>;
  possibleMatch?: {
    id: string;
    full_name: string;
    abbreviations: string[];
  };
}

interface SubjectCandidate {
  abbreviation: string;
  context: {
    kierunek: string;
    stopien: string;
    rok: number;
    semestr: number;
    tryb: string;
  };
  occurrences: number;
  sampleClasses: Array<{
    date: string;
    time: string;
    instructor: string;
    group: string;
  }>;
}

interface RelationCandidate {
  subjectAbbr: string;
  instructorAbbr: string;
  subjectId: string | null;
  instructorId: string | null;
  subjectName: string | null;
  instructorName: string | null;
  occurrences: number;
  contexts: Array<{
    kierunek: string;
    stopien: string;
    rok: number;
    semestr: number;
    tryb: string;
  }>;
}

interface CandidatesData {
  instructors: InstructorCandidate[];
  subjects: SubjectCandidate[];
  relations: RelationCandidate[];
  stats: {
    totalInstructors: number;
    totalSubjects: number;
    totalRelations: number;
  };
}

export function CandidatesManagement() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'instructors' | 'subjects' | 'relations'>('instructors');
  const [data, setData] = useState<CandidatesData | null>(null);
  const [selectedInstructors, setSelectedInstructors] = useState<Set<string>>(new Set());
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const [selectedRelations, setSelectedRelations] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    abbreviation: '',
    fullName: '',
    context: null as any,
  });

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/candidates');
      const result = await res.json();

      if (result.success) {
        setData(result.data);
      } else {
        toast.error('Błąd ładowania kandydatów');
      }
    } catch (error) {
      toast.error('Błąd ładowania kandydatów');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleIgnore = async (type: string, value: string, context?: string) => {
    try {
      const res = await fetch('/api/admin/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, value, context }),
      });

      const result = await res.json();
      if (result.success) {
        toast.success('Kandydat zignorowany');
        loadCandidates();
      } else {
        toast.error(result.error || 'Błąd');
      }
    } catch (error) {
      toast.error('Błąd ignorowania');
    }
  };

  const handleAddInstructor = (abbreviation: string) => {
    setFormData({
      type: 'instructor',
      abbreviation,
      fullName: '',
      context: null,
    });
    setShowAddForm(true);
  };

  const handleAddToExistingInstructor = async (instructorId: string, abbreviation: string, fullName: string) => {
    if (!confirm(`Dodać skrót "${abbreviation}" do wykładowcy "${fullName}"?`)) {
      return;
    }

    try {
      // First, get current abbreviations
      const getRes = await fetch('/api/admin/instructors');
      const getData = await getRes.json();

      if (!getData.success) {
        toast.error('Błąd ładowania wykładowcy');
        return;
      }

      const instructor = getData.instructors.find((i: any) => i.id === instructorId);
      if (!instructor) {
        toast.error('Nie znaleziono wykładowcy');
        return;
      }

      // Add new abbreviation
      const updatedAbbrs = [...instructor.abbreviations, abbreviation];

      // Update instructor
      const res = await fetch('/api/admin/instructors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: instructorId,
          full_name: instructor.full_name,
          abbreviations: updatedAbbrs,
        }),
      });

      const result = await res.json();
      if (result.success) {
        toast.success('Dodano skrót do istniejącego wykładowcy');
        loadCandidates();
      } else {
        toast.error(result.error || 'Błąd');
      }
    } catch (error) {
      toast.error('Błąd aktualizacji');
    }
  };

  const handleAddSubject = (abbreviation: string, context: any) => {
    setFormData({
      type: 'subject',
      abbreviation,
      fullName: '',
      context,
    });
    setShowAddForm(true);
  };

  const handleSubmitAdd = async () => {
    try {
      if (formData.type === 'instructor') {
        // Add instructor
        const res = await fetch('/api/admin/instructors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            full_name: formData.fullName,
            abbreviations: [formData.abbreviation],
          }),
        });

        const result = await res.json();
        if (result.success) {
          toast.success('Dodano wykładowcę');
          setShowAddForm(false);
          loadCandidates();
        } else {
          toast.error(result.error || 'Błąd');
        }
      } else if (formData.type === 'subject') {
        // Add subject
        const res = await fetch('/api/admin/subjects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.fullName,
            abbreviations: [formData.abbreviation],
            ...formData.context,
          }),
        });

        const result = await res.json();
        if (result.success) {
          toast.success('Dodano przedmiot');
          setShowAddForm(false);
          loadCandidates();
        } else {
          toast.error(result.error || 'Błąd');
        }
      }
    } catch (error) {
      toast.error('Błąd dodawania');
    }
  };

  const handleConnectRelation = async (subjectId: string, instructorId: string) => {
    try {
      const res = await fetch(`/api/admin/subjects/${subjectId}/instructors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instructor_id: instructorId }),
      });

      const result = await res.json();
      if (result.success) {
        toast.success('Połączono przedmiot z wykładowcą');
        loadCandidates();
      } else {
        toast.error(result.error || 'Błąd');
      }
    } catch (error) {
      toast.error('Błąd łączenia');
    }
  };

  const handleBulkConnect = async () => {
    if (selectedRelations.size === 0) return;

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const key of selectedRelations) {
        const [subjectId, instructorId] = key.split(':::');

        try {
          const res = await fetch(`/api/admin/subjects/${subjectId}/instructors`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ instructor_id: instructorId }),
          });

          const result = await res.json();
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch {
          errorCount++;
        }
      }

      toast.success(`Połączono ${successCount} relacji`);
      if (errorCount > 0) {
        toast.error(`Błędów: ${errorCount}`);
      }

      setSelectedRelations(new Set());
      loadCandidates();
    } catch (error) {
      toast.error('Błąd masowego łączenia');
    }
  };

  const toggleRelationSelection = (subjectId: string, instructorId: string) => {
    const key = `${subjectId}:::${instructorId}`;
    const newSelected = new Set(selectedRelations);

    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }

    setSelectedRelations(newSelected);
  };

  if (loading) {
    return <div className="text-center py-8">Ładowanie kandydatów...</div>;
  }

  if (!data) {
    return <div className="text-center py-8 text-gray-500">Brak danych</div>;
  }

  const filteredInstructors = data.instructors.filter(i =>
    !searchQuery || i.abbreviation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSubjects = data.subjects.filter(s =>
    !searchQuery || s.abbreviation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRelations = data.relations.filter(r =>
    !searchQuery ||
    r.subjectAbbr.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.instructorAbbr.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.subjectName && r.subjectName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (r.instructorName && r.instructorName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="bg-white border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Statystyki kandydatów</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 p-4">
            <div className="text-3xl font-bold text-gray-900">{data.stats.totalInstructors}</div>
            <div className="text-sm text-gray-600">Nowych wykładowców</div>
          </div>
          <div className="border border-gray-200 p-4">
            <div className="text-3xl font-bold text-gray-900">{data.stats.totalSubjects}</div>
            <div className="text-sm text-gray-600">Nowych przedmiotów</div>
          </div>
          <div className="border border-gray-200 p-4">
            <div className="text-3xl font-bold text-gray-900">{data.stats.totalRelations}</div>
            <div className="text-sm text-gray-600">Brakujących relacji</div>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={loadCandidates}
            className="px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 transition-colors text-sm"
          >
            Odśwież kandydatów
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('instructors')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'instructors'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Wykładowcy ({data.stats.totalInstructors})
            </button>
            <button
              onClick={() => setActiveTab('subjects')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'subjects'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Przedmioty ({data.stats.totalSubjects})
            </button>
            <button
              onClick={() => setActiveTab('relations')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'relations'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Relacje ({data.stats.totalRelations})
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Szukaj..."
            className="w-full px-3 py-2 border border-gray-300 text-gray-900 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Instructors Tab */}
        {activeTab === 'instructors' && (
          <div className="p-6">
            {filteredInstructors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? 'Brak wyników wyszukiwania' : 'Nie znaleziono nowych wykładowców ✓'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Skrót
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Możliwe dopasowanie
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Wystąpienia
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Konteksty
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Przykład zajęcia
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                        Akcje
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredInstructors.map((instructor) => (
                      <tr key={instructor.abbreviation} className={instructor.possibleMatch ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}>
                        <td className="px-4 py-3 text-sm font-mono text-gray-900">
                          {instructor.abbreviation}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {instructor.possibleMatch ? (
                            <div>
                              <div className="font-medium text-blue-900">{instructor.possibleMatch.full_name}</div>
                              <div className="text-xs text-blue-700 font-mono">
                                {instructor.possibleMatch.abbreviations.join(', ')}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {instructor.occurrences}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {instructor.contexts.length} kontekst(ów)
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {instructor.sampleClasses[0] && (
                            <>
                              {instructor.sampleClasses[0].date} {instructor.sampleClasses[0].time}
                              <br />
                              {instructor.sampleClasses[0].subject} ({instructor.sampleClasses[0].group})
                            </>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-right space-x-2">
                          {instructor.possibleMatch ? (
                            <>
                              <button
                                onClick={() => handleAddToExistingInstructor(
                                  instructor.possibleMatch!.id,
                                  instructor.abbreviation,
                                  instructor.possibleMatch!.full_name
                                )}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                              >
                                Dodaj skrót
                              </button>
                              <button
                                onClick={() => handleAddInstructor(instructor.abbreviation)}
                                className="text-green-600 hover:text-green-700"
                              >
                                Dodaj nowy
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleAddInstructor(instructor.abbreviation)}
                              className="text-green-600 hover:text-green-700"
                            >
                              Dodaj
                            </button>
                          )}
                          <button
                            onClick={() => handleIgnore('instructor', instructor.abbreviation)}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            Ignoruj
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Subjects Tab */}
        {activeTab === 'subjects' && (
          <div className="p-6">
            {filteredSubjects.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? 'Brak wyników wyszukiwania' : 'Nie znaleziono nowych przedmiotów ✓'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Skrót
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Kontekst
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Wystąpienia
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Przykład zajęcia
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                        Akcje
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredSubjects.map((subject, idx) => (
                      <tr key={`${subject.abbreviation}-${idx}`} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-mono text-gray-900">
                          {subject.abbreviation}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {subject.context.kierunek} {subject.context.stopien}st. R{subject.context.rok} S{subject.context.semestr}
                          {subject.context.tryb === 'niestacjonarne' && ' (Niestacj.)'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {subject.occurrences}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {subject.sampleClasses[0] && (
                            <>
                              {subject.sampleClasses[0].date} {subject.sampleClasses[0].time}
                              <br />
                              {subject.sampleClasses[0].instructor} ({subject.sampleClasses[0].group})
                            </>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-right space-x-2">
                          <button
                            onClick={() => handleAddSubject(subject.abbreviation, subject.context)}
                            className="text-green-600 hover:text-green-700"
                          >
                            Dodaj
                          </button>
                          <button
                            onClick={() => {
                              const contextStr = `${subject.context.kierunek}-${subject.context.stopien}-${subject.context.rok}-${subject.context.semestr}-${subject.context.tryb}`;
                              handleIgnore('subject', subject.abbreviation, contextStr);
                            }}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            Ignoruj
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Relations Tab */}
        {activeTab === 'relations' && (
          <div className="p-6">
            {selectedRelations.size > 0 && (
              <div className="mb-4 flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Zaznaczono: {selectedRelations.size}
                </span>
                <button
                  onClick={handleBulkConnect}
                  className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors text-sm"
                >
                  Połącz zaznaczone
                </button>
                <button
                  onClick={() => setSelectedRelations(new Set())}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Anuluj
                </button>
              </div>
            )}

            {filteredRelations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? 'Brak wyników wyszukiwania' : 'Nie znaleziono brakujących relacji ✓'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={filteredRelations.length > 0 && filteredRelations.every(r =>
                            selectedRelations.has(`${r.subjectId}:::${r.instructorId}`)
                          )}
                          onChange={() => {
                            const allSelected = filteredRelations.every(r =>
                              selectedRelations.has(`${r.subjectId}:::${r.instructorId}`)
                            );
                            const newSelected = new Set(selectedRelations);

                            filteredRelations.forEach(r => {
                              const key = `${r.subjectId}:::${r.instructorId}`;
                              if (allSelected) {
                                newSelected.delete(key);
                              } else {
                                newSelected.add(key);
                              }
                            });

                            setSelectedRelations(newSelected);
                          }}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Przedmiot
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Wykładowca
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Wspólne zajęcia
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                        Konteksty
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                        Akcje
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredRelations.map((relation, idx) => (
                      <tr key={`${relation.subjectId}-${relation.instructorId}-${idx}`} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedRelations.has(`${relation.subjectId}:::${relation.instructorId}`)}
                            onChange={() => toggleRelationSelection(relation.subjectId!, relation.instructorId!)}
                            className="w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="font-medium">{relation.subjectName}</div>
                          <div className="text-xs text-gray-500 font-mono">{relation.subjectAbbr}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="font-medium">{relation.instructorName}</div>
                          <div className="text-xs text-gray-500 font-mono">{relation.instructorAbbr}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {relation.occurrences}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {relation.contexts.length} kontekst(ów)
                        </td>
                        <td className="px-4 py-3 text-sm text-right space-x-2">
                          <button
                            onClick={() => handleConnectRelation(relation.subjectId!, relation.instructorId!)}
                            className="text-green-600 hover:text-green-700"
                          >
                            Połącz
                          </button>
                          <button
                            onClick={() => handleIgnore('relation', `${relation.subjectAbbr}:::${relation.instructorAbbr}`)}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            Ignoruj
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Dodaj {formData.type === 'instructor' ? 'wykładowcę' : 'przedmiot'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skrót
                </label>
                <input
                  type="text"
                  value={formData.abbreviation}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 text-gray-900 bg-gray-50 font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.type === 'instructor' ? 'Imię i nazwisko' : 'Pełna nazwa przedmiotu'}
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-500"
                  placeholder={formData.type === 'instructor' ? 'Dr Jan Kowalski' : 'Programowanie obiektowe'}
                  required
                />
              </div>

              {formData.type === 'subject' && formData.context && (
                <div className="p-3 bg-gray-50 border border-gray-200 text-sm">
                  <div className="font-medium text-gray-900 mb-1">Kontekst:</div>
                  <div className="text-gray-600">
                    {formData.context.kierunek} {formData.context.stopien}st. Rok {formData.context.rok} Sem. {formData.context.semestr}
                    {formData.context.tryb === 'niestacjonarne' && ' (Niestacjonarne)'}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSubmitAdd}
                  disabled={!formData.fullName}
                  className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 transition-colors disabled:bg-gray-400"
                >
                  Dodaj
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 hover:bg-gray-400 transition-colors"
                >
                  Anuluj
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
