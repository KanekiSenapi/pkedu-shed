"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  saveUserPreferences,
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
        .flatMap(s => s.groups) || []
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

  const handleStudentComplete = () => {
    if (!stopien || !rok || selectedGroups.length === 0) return;

    const preferences: StudentPreferences = {
      role: 'student',
      stopien,
      rok,
      groups: selectedGroups,
    };

    saveUserPreferences(preferences);
    router.push('/dashboard');
  };

  const handleInstructorComplete = () => {
    if (!selectedInstructor) return;

    const preferences: InstructorPreferences = {
      role: 'instructor',
      fullName: selectedInstructor,
    };

    saveUserPreferences(preferences);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        {/* Role selection */}
        {step === 'role' && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Witaj w Plan Zajęć PK
              </h1>
              <p className="text-gray-600">
                Wybierz swoją rolę aby dostosować widok kalendarza
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              <button
                onClick={() => handleRoleSelect('student')}
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="text-4xl mb-3">🎓</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">Student</h3>
                <p className="text-sm text-gray-600">
                  Zobacz plan dla swojej grupy i roku
                </p>
              </button>

              <button
                onClick={() => handleRoleSelect('instructor')}
                className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <div className="text-4xl mb-3">👨‍🏫</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">Prowadzący</h3>
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
              <h2 className="text-2xl font-bold text-gray-900">Wybierz swoją grupę</h2>
            </div>

            {/* Stopień selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className={`p-3 rounded-lg border-2 transition-all ${
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      className={`p-3 rounded-lg border-2 transition-all ${
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grupa (możesz wybrać kilka)
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {availableGroups.map(group => (
                    <button
                      key={group}
                      onClick={() => handleGroupToggle(group)}
                      className={`p-3 rounded-lg border-2 transition-all ${
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
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Kontynuuj do dashboard
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
              <h2 className="text-2xl font-bold text-gray-900">Wybierz swoje dane</h2>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imię i nazwisko
              </label>
              <select
                value={selectedInstructor}
                onChange={(e) => setSelectedInstructor(e.target.value)}
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
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
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Kontynuuj do dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
