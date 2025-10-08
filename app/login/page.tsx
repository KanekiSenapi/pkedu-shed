"use client";

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { useSchedule } from '@/lib/use-schedule';
import {
  syncLoadUserPreferences,
  syncSaveUserPreferences,
  type UserRole,
  type StudentPreferences,
  type InstructorPreferences,
} from '@/lib/user-preferences';

type Tab = 'login' | 'register';
type Mode = 'auth' | 'guest';
type GuestStep = 'role' | 'student' | 'instructor';

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { schedule } = useSchedule();
  const [mode, setMode] = useState<Mode>('auth');

  // Check for mode query parameter on mount
  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'guest') {
      setMode('guest');
    }
  }, [searchParams]);
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  // Guest mode state
  const [guestStep, setGuestStep] = useState<GuestStep>('role');
  const [role, setRole] = useState<UserRole | null>(null);
  const [stopien, setStopien] = useState<string>('');
  const [rok, setRok] = useState<number | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedInstructor, setSelectedInstructor] = useState<string>('');
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

  // Load instructors from database when guest mode is active
  useEffect(() => {
    if (mode === 'guest' && guestStep === 'instructor') {
      loadInstructors();
    }
  }, [mode, guestStep]);

  const loadInstructors = async () => {
    try {
      const res = await fetch('/api/admin/instructors');
      const data = await res.json();
      if (data.success) {
        setInstructorsFromDB(data.instructors);
      }
    } catch (error) {
      console.error('Error loading instructors:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Wypełnij wszystkie pola');
      return;
    }

    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Nieprawidłowy email lub hasło');
      } else if (result?.ok) {
        toast.success('Zalogowano pomyślnie');

        // Check if user has preferences
        const prefs = await syncLoadUserPreferences();

        // If no preferences, redirect to settings for first-time setup
        if (!prefs) {
          router.push('/settings');
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Błąd podczas logowania');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Wypełnij wszystkie pola');
      return;
    }

    if (password.length < 6) {
      toast.error('Hasło musi mieć minimum 6 znaków');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name: name || undefined }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Konto utworzone! Logowanie...');

        // Auto-login after successful registration
        const loginResult = await signIn('credentials', {
          email,
          password,
          redirect: false,
        });

        if (loginResult?.error) {
          toast.error('Błąd podczas automatycznego logowania');
          setTab('login');
        } else if (loginResult?.ok) {
          // Redirect to settings for first-time setup
          router.push('/settings');
        }
      } else {
        toast.error(data.error || 'Błąd podczas rejestracji');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Błąd podczas rejestracji');
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setLoading(true);
    try {
      await signIn('azure-ad', { callbackUrl: '/dashboard' });
    } catch (error) {
      console.error('Microsoft login error:', error);
      toast.error('Błąd podczas logowania przez Microsoft');
      setLoading(false);
    }
  };

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setGuestStep(selectedRole);
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
    <div className="min-h-screen bg-white flex">
      {/* Left side - Login/Register */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Back button */}
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-600 hover:text-gray-900 mb-8 flex items-center gap-2"
          >
            ← Powrót do strony głównej
          </button>

          {/* Logo/Title */}
          <div className="mb-8 flex items-center gap-4">
            <Image
              src="/images/logo.png"
              alt="Logo Plan Zajęć Politechnika Krakowska"
              width={64}
              height={64}
              className="object-contain"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Plan PK</h1>
              <p className="text-gray-600 text-sm">
                Zarządzaj swoim planem zajęć
              </p>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setMode('auth')}
              className={`flex-1 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                mode === 'auth'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-gray-200 text-gray-600 hover:text-gray-900'
              }`}
            >
              Zaloguj się
            </button>
            <button
              onClick={() => setMode('guest')}
              className={`flex-1 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                mode === 'guest'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-gray-200 text-gray-600 hover:text-gray-900'
              }`}
            >
              Jako gość
            </button>
          </div>

          {/* Auth Mode - Tabs */}
          {mode === 'auth' && (
            <div className="flex gap-2 mb-8">
              <button
                onClick={() => setTab('login')}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  tab === 'login'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Logowanie
              </button>
              <button
                onClick={() => setTab('register')}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  tab === 'register'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Rejestracja
              </button>
            </div>
          )}

          {/* Auth Mode Forms */}
          {mode === 'auth' && tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="twoj@email.com"
                  className="w-full px-4 py-2.5 border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hasło
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Logowanie...' : 'Zaloguj się'}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">lub</span>
                </div>
              </div>

              <button
                type="button"
                disabled={true}
                title="Wkrótce"
                className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 21 21">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                </svg>
                Zaloguj przez Microsoft
              </button>
            </form>
          )}

          {mode === 'auth' && tab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="twoj@email.com"
                  className="w-full px-4 py-2.5 border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imię (opcjonalnie)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jan Kowalski"
                  className="w-full px-4 py-2.5 border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hasło
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-2">
                  Minimum 6 znaków
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-3 bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Rejestracja...' : 'Zarejestruj się'}
              </button>
            </form>
          )}

          {/* Guest Mode - Role Selection */}
          {mode === 'guest' && guestStep === 'role' && (
            <div className="space-y-6">
              <div className="text-sm text-gray-600 mb-6">
                Wybierz swoją rolę aby dostosować widok kalendarza
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleRoleSelect('student')}
                  className="w-full bg-white border border-gray-200 p-6 hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="text-3xl mb-2">🎓</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Student</h3>
                  <p className="text-sm text-gray-600">
                    Zobacz plan dla swojej grupy i roku
                  </p>
                </button>

                <button
                  onClick={() => handleRoleSelect('instructor')}
                  className="w-full bg-white border border-gray-200 p-6 hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="text-3xl mb-2">👨‍🏫</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Prowadzący</h3>
                  <p className="text-sm text-gray-600">
                    Zobacz swoje zajęcia i harmonogram
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Guest Mode - Student Flow */}
          {mode === 'guest' && guestStep === 'student' && (
            <div className="space-y-6">
              <button
                onClick={() => setGuestStep('role')}
                className="text-blue-600 hover:text-blue-700 text-sm mb-4"
              >
                ← Zmień rolę
              </button>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Stopień studiów
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableStopnie.map(s => (
                    <button
                      key={s}
                      onClick={() => {
                        setStopien(s);
                        setRok(null);
                        setSelectedGroups([]);
                      }}
                      className={`p-3 border transition-colors text-sm ${
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Rok studiów
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {availableRoki.map(r => (
                      <button
                        key={r}
                        onClick={() => {
                          setRok(r);
                          setSelectedGroups([]);
                        }}
                        className={`p-3 border transition-colors text-sm ${
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Grupa (możesz wybrać kilka)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {availableGroups.map(group => (
                      <button
                        key={group}
                        onClick={() => handleGroupToggle(group)}
                        className={`p-3 border transition-colors text-sm ${
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
                onClick={handleStudentComplete}
                disabled={!stopien || !rok || selectedGroups.length === 0}
                className="w-full py-3 px-4 bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Kontynuuj
              </button>
            </div>
          )}

          {/* Guest Mode - Instructor Flow */}
          {mode === 'guest' && guestStep === 'instructor' && (
            <div className="space-y-6">
              <button
                onClick={() => setGuestStep('role')}
                className="text-blue-600 hover:text-blue-700 text-sm mb-4"
              >
                ← Zmień rolę
              </button>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Imię i nazwisko
                </label>
                <select
                  value={selectedInstructor}
                  onChange={(e) => setSelectedInstructor(e.target.value)}
                  className="w-full p-3 border border-gray-300 focus:border-blue-500 focus:outline-none bg-white"
                >
                  <option value="">Wybierz prowadzącego...</option>
                  {instructorsFromDB.map(instructor => (
                    <option key={instructor.id} value={instructor.full_name}>
                      {instructor.full_name}
                    </option>
                  ))}
                </select>
                {instructorsFromDB.length === 0 && (
                  <p className="text-xs text-gray-500 mt-2">Ładowanie listy prowadzących...</p>
                )}
              </div>

              <button
                onClick={handleInstructorComplete}
                disabled={!selectedInstructor}
                className="w-full py-3 px-4 bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Kontynuuj
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Product info */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-50 p-12 items-center justify-center">
        <div className="max-w-lg">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Twój plan zajęć, zawsze pod ręką
          </h2>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 flex items-center justify-center">
                📅
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Kalendarz i plan zajęć
                </h3>
                <p className="text-gray-600 text-sm">
                  Zobacz wszystkie swoje zajęcia w przejrzystym kalendarzu. Filtruj po przedmiotach, grupach i typach zajęć.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 text-green-600 flex items-center justify-center">
                📍
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Mapa kampusu
                </h3>
                <p className="text-gray-600 text-sm">
                  Znajdź sale wykładowe na interaktywnej mapie kampusu z nawigacją do wybranej sali.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 text-purple-600 flex items-center justify-center">
                ✓
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Śledzenie obecności
                </h3>
                <p className="text-gray-600 text-sm">
                  Zaloguj się, aby zapisywać swoją obecność na zajęciach i sprawdzać statystyki.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-100 text-orange-600 flex items-center justify-center">
                📝
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Notatki i zadania
                </h3>
                <p className="text-gray-600 text-sm">
                  Dodawaj notatki do zajęć i twórz listę zadań domowych z terminami i priorytetami.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 text-red-600 flex items-center justify-center">
                🔔
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Inteligentne powiadomienia
                </h3>
                <p className="text-gray-600 text-sm">
                  Wykrywanie przerw między zajęciami i powiadomienia o nadchodzących zajęciach.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Aplikacja stworzona dla studentów Politechniki Krakowskiej
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Ładowanie...</div>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
