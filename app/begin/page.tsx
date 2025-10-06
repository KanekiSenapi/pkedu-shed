"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  syncSaveUserPreferences,
  type UserRole,
  type StudentPreferences,
  type InstructorPreferences,
} from '@/lib/user-preferences';
import { useSchedule } from '@/lib/use-schedule';

export default function BeginPage() {
  const router = useRouter();
  const { schedule } = useSchedule();

  const [step, setStep] = useState<'role' | 'student' | 'instructor'>('role');
  const [role, setRole] = useState<UserRole | null>(null);

  // Student flow state
  const [stopien, setStopien] = useState<string>('');
  const [rok, setRok] = useState<number | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  // Instructor flow state
  const [selectedInstructor, setSelectedInstructor] = useState<string>('');

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
        .filter(g => !g.includes(',')) || [] // Only single groups, not merged ones
    ),
  ].sort();

  // Get unique instructors from schedule
  const instructors = [
    ...new Set(
      schedule?.sections
        .flatMap(s => s.entries)
        .map(e => e.class_info.instructor)
        .filter((i): i is string => Boolean(i)) || []
    ),
  ].sort();

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep(selectedRole);
  };

  const handleGroupToggle = (group: string) => {
    setSelectedGroups(prev =>
      prev.includes(group)
        ? prev.filter(g => g !== group)
        : [...prev, group]
    );
  };

  const handleStudentComplete = async () => {
    if (!stopien || !rok || selectedGroups.length === 0) return;

    const preferences: StudentPreferences = {
      role: 'student',
      stopien,
      rok,
      groups: selectedGroups,
    };

    await syncSaveUserPreferences(preferences);
    router.push('/dashboard');
  };

  const handleInstructorComplete = async () => {
    if (!selectedInstructor) return;

    const preferences: InstructorPreferences = {
      role: 'instructor',
      fullName: selectedInstructor,
    };

    await syncSaveUserPreferences(preferences);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Role selection */}
          {step === 'role' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 p-6">
                <h1 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">
                  Plan Zajęć PK
                </h1>
                <p className="text-gray-900">
                  Wybierz swoją rolę aby dostosować widok kalendarza
                </p>
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
            <div className="bg-white border border-gray-200 p-6">
              <button
                onClick={() => setStep('role')}
                className="text-blue-600 hover:text-blue-700 text-sm mb-4"
              >
                ← Zmień rolę
              </button>
              <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                Wybierz swoją grupę
              </h2>
            </div>

            {/* Stopień selection */}
            <div className="bg-white border border-gray-200 p-6">
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
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {s} stopień
                  </button>
                ))}
              </div>
            </div>

            {/* Rok selection */}
            {stopien && (
              <div className="bg-white border border-gray-200 p-6">
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
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      Rok {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Group selection */}
            {rok && (
              <div className="bg-white border border-gray-200 p-6">
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
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {group}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Complete button */}
            <button
              onClick={handleStudentComplete}
              disabled={!stopien || !rok || selectedGroups.length === 0}
              className="w-full py-3 px-4 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Kontynuuj
            </button>
          </div>
        )}

        {/* Instructor flow */}
        {step === 'instructor' && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 p-6">
              <button
                onClick={() => setStep('role')}
                className="text-blue-600 hover:text-blue-700 text-sm mb-4"
              >
                ← Zmień rolę
              </button>
              <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                Wybierz swoje dane
              </h2>
            </div>

            <div className="bg-white border border-gray-200 p-6">
              <label className="block text-sm font-medium text-gray-600 uppercase tracking-wide mb-3">
                Imię i nazwisko
              </label>
              <select
                value={selectedInstructor}
                onChange={(e) => setSelectedInstructor(e.target.value)}
                className="w-full p-3 border border-gray-200 focus:border-blue-500 focus:outline-none bg-white"
              >
                <option value="">Wybierz prowadzącego...</option>
                {instructors.map(instructor => (
                  <option key={instructor} value={instructor}>
                    {instructor}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleInstructorComplete}
              disabled={!selectedInstructor}
              className="w-full py-3 px-4 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Kontynuuj
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
