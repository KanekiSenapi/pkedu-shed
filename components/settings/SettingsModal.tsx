"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSchedule } from '@/lib/use-schedule';
import {
  syncLoadUserPreferences,
  syncSaveUserPreferences,
  type UserRole,
  type StudentPreferences,
  type InstructorPreferences,
} from '@/lib/user-preferences';

type Step = 'role' | 'student' | 'instructor';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const router = useRouter();
  const { schedule } = useSchedule();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<UserRole | null>(null);
  const [stopien, setStopien] = useState<string>('');
  const [rok, setRok] = useState<number | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<string>('');
  const [instructorId, setInstructorId] = useState<string>('');
  const [instructorsFromDB, setInstructorsFromDB] = useState<Array<{ id: string; full_name: string }>>([]);

  // Get available options from schedule
  const availableStopnie = [...new Set(schedule?.sections.map(s => s.stopien) || [])];
  const availableRoki = [...new Set(
    schedule?.sections
      .filter(s => s.stopien === stopien)
      .map(s => s.rok) || []
  )].sort();
  const availableGroups = [
    ...new Set(
      schedule?.sections
        .filter(s => s.stopien === stopien && s.rok === rok)
        .flatMap(s => s.groups)
        .filter(g => !g.includes(',')) || []
    ),
  ].sort();

  useEffect(() => {
    if (!isOpen) return;

    // Load instructors from database
    fetch('/api/admin/instructors')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setInstructorsFromDB(data.instructors || []);
        }
      })
      .catch(err => console.error('Failed to load instructors:', err));

    // Load existing preferences
    syncLoadUserPreferences().then(prefs => {
      if (prefs) {
        setRole(prefs.role);
        setStep(prefs.role);

        if (prefs.role === 'student') {
          setStopien(prefs.stopien);
          setRok(prefs.rok);
          setSelectedGroups(prefs.groups);
        } else if (prefs.role === 'instructor') {
          setSelectedInstructor(prefs.fullName);
          if (prefs.instructorId) {
            setInstructorId(prefs.instructorId);
          }
        }
      }
      setLoading(false);
    });
  }, [isOpen]);

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep(selectedRole);
    // Reset other fields
    setStopien('');
    setRok(null);
    setSelectedGroups([]);
    setSelectedInstructor('');
    setInstructorId('');
  };

  const handleGroupToggle = (group: string) => {
    setSelectedGroups(prev =>
      prev.includes(group)
        ? prev.filter(g => g !== group)
        : [...prev, group]
    );
  };

  const handleStudentSave = async () => {
    if (!stopien || !rok || selectedGroups.length === 0) return;

    const preferences: StudentPreferences = {
      role: 'student',
      stopien,
      rok,
      groups: selectedGroups,
    };

    await syncSaveUserPreferences(preferences);
    onClose();
    router.push('/dashboard/student');
  };

  const handleInstructorSave = async () => {
    if (!selectedInstructor) return;

    const preferences: InstructorPreferences = {
      role: 'instructor',
      fullName: selectedInstructor,
      instructorId: instructorId || undefined,
    };

    await syncSaveUserPreferences(preferences);
    onClose();
    router.push('/dashboard/instructor');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-lg">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Ustawienia</h2>
            <p className="text-sm text-gray-600">Zmień swoje preferencje planu zajęć</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <div className="text-sm text-gray-600">Ładowanie...</div>
            </div>
          ) : (
            <>
              {/* Role selection */}
              {step === 'role' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-4">
                      Wybierz swoją rolę
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => handleRoleSelect('student')}
                      className="bg-white border border-gray-200 p-6 hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                    >
                      <div className="text-4xl mb-3">🎓</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">Student</h3>
                      <p className="text-sm text-gray-600">
                        Zobacz plan dla swojej grupy i roku
                      </p>
                    </button>

                    <button
                      onClick={() => handleRoleSelect('instructor')}
                      className="bg-white border border-gray-200 p-6 hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                    >
                      <div className="text-4xl mb-3">👨‍🏫</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">Prowadzący</h3>
                      <p className="text-sm text-gray-600">
                        Zobacz swoje zajęcia i harmonogram
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* Student flow */}
              {step === 'student' && (
                <div className="space-y-6">
                  <div>
                    <button
                      onClick={() => setStep('role')}
                      className="text-blue-600 hover:text-blue-700 text-sm mb-4"
                    >
                      ← Zmień rolę
                    </button>
                    <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                      Wybierz swoją grupę
                    </h3>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 p-6">
                    <label className="block text-sm font-medium text-gray-600 uppercase tracking-wide mb-3">
                      Stopień studiów
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {availableStopnie.map(s => (
                        <button
                          key={s}
                          onClick={() => {
                            setStopien(s);
                            setRok(null);
                            setSelectedGroups([]);
                          }}
                          className={`p-3 border transition-colors ${
                            stopien === s
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          {s} stopień
                        </button>
                      ))}
                    </div>
                  </div>

                  {stopien && (
                    <div className="bg-gray-50 border border-gray-200 p-6">
                      <label className="block text-sm font-medium text-gray-600 uppercase tracking-wide mb-3">
                        Rok studiów
                      </label>
                      <div className="grid grid-cols-4 gap-3">
                        {availableRoki.map(r => (
                          <button
                            key={r}
                            onClick={() => {
                              setRok(r);
                              setSelectedGroups([]);
                            }}
                            className={`p-3 border transition-colors ${
                              rok === r
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            Rok {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {rok && (
                    <div className="bg-gray-50 border border-gray-200 p-6">
                      <label className="block text-sm font-medium text-gray-600 uppercase tracking-wide mb-3">
                        Grupa (możesz wybrać kilka)
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {availableGroups.map(group => (
                          <button
                            key={group}
                            onClick={() => handleGroupToggle(group)}
                            className={`p-3 border transition-colors ${
                              selectedGroups.includes(group)
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            {group}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleStudentSave}
                    disabled={!stopien || !rok || selectedGroups.length === 0}
                    className="w-full py-3 px-4 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Zapisz ustawienia
                  </button>
                </div>
              )}

              {/* Instructor flow */}
              {step === 'instructor' && (
                <div className="space-y-6">
                  <div>
                    <button
                      onClick={() => setStep('role')}
                      className="text-blue-600 hover:text-blue-700 text-sm mb-4"
                    >
                      ← Zmień rolę
                    </button>
                    <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                      Wybierz swoje dane
                    </h3>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 p-6">
                    <label className="block text-sm font-medium text-gray-600 uppercase tracking-wide mb-3">
                      Imię i nazwisko
                    </label>
                    <select
                      value={instructorId}
                      onChange={(e) => {
                        const instructor = instructorsFromDB.find(i => i.id === e.target.value);
                        if (instructor) {
                          setInstructorId(instructor.id);
                          setSelectedInstructor(instructor.full_name);
                        }
                      }}
                      className="w-full p-3 border border-gray-200 focus:border-blue-500 focus:outline-none bg-white"
                    >
                      <option value="">Wybierz prowadzącego...</option>
                      {instructorsFromDB.map(instructor => (
                        <option key={instructor.id} value={instructor.id}>
                          {instructor.full_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleInstructorSave}
                    disabled={!selectedInstructor}
                    className="w-full py-3 px-4 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Zapisz ustawienia
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
