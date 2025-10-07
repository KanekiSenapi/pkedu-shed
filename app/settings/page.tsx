"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useSchedule } from '@/lib/use-schedule';
import {
  syncLoadUserPreferences,
  syncSaveUserPreferences,
  type UserRole,
  type StudentPreferences,
  type InstructorPreferences,
} from '@/lib/user-preferences';

type Step = 'role' | 'student' | 'instructor';

export default function SettingsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { schedule } = useSchedule();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<UserRole | null>(null);
  const [stopien, setStopien] = useState<string>('');
  const [rok, setRok] = useState<number | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<string>('');
  const [isFirstSetup, setIsFirstSetup] = useState(false);

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
  const instructors = [
    ...new Set(
      schedule?.sections
        .flatMap(s => s.entries)
        .map(e => e.class_info.instructor)
        .filter((i): i is string => Boolean(i)) || []
    ),
  ].sort();

  useEffect(() => {
    if (status === 'loading') return;

    // If not logged in, redirect to login
    if (!session) {
      router.push('/login');
      return;
    }

    // Load existing preferences
    syncLoadUserPreferences().then(prefs => {
      if (prefs) {
        // User has existing preferences - editing mode
        setRole(prefs.role);
        setStep(prefs.role);
        setIsFirstSetup(false);

        if (prefs.role === 'student') {
          setStopien(prefs.stopien);
          setRok(prefs.rok);
          setSelectedGroups(prefs.groups);
        } else if (prefs.role === 'instructor') {
          setSelectedInstructor(prefs.fullName);
        }
      } else {
        // No preferences - first time setup
        setIsFirstSetup(true);
      }
      setLoading(false);
    });
  }, [session, status, router]);

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep(selectedRole);
    // Reset other fields
    setStopien('');
    setRok(null);
    setSelectedGroups([]);
    setSelectedInstructor('');
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
    router.push('/dashboard');
  };

  const handleInstructorSave = async () => {
    if (!selectedInstructor) return;

    const preferences: InstructorPreferences = {
      role: 'instructor',
      fullName: selectedInstructor,
    };

    await syncSaveUserPreferences(preferences);
    router.push('/dashboard');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Ładowanie...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border border-gray-200 p-6 mb-6">
            {!isFirstSetup && (
              <button
                onClick={() => router.push('/dashboard')}
                className="text-blue-600 hover:text-blue-700 text-sm mb-4"
              >
                ← Powrót do dashboardu
              </button>
            )}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isFirstSetup ? 'Skonfiguruj swoje ustawienia' : 'Ustawienia'}
            </h1>
            <p className="text-gray-600 text-sm">
              {isFirstSetup
                ? 'Skonfiguruj swój profil aby zobaczyć spersonalizowany plan zajęć'
                : 'Zmień swoje preferencje planu zajęć'}
            </p>
          </div>

          {/* Role selection */}
          {step === 'role' && (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 p-6">
                <h2 className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">
                  Wybierz swoją rolę
                </h2>
                <p className="text-gray-900 text-sm">
                  {isFirstSetup
                    ? 'Wybierz czy jesteś studentem czy prowadzącym'
                    : 'Zmień widok kalendarza dostosowany do Twojej roli'}
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
                onClick={handleInstructorSave}
                disabled={!selectedInstructor}
                className="w-full py-3 px-4 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Zapisz ustawienia
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
