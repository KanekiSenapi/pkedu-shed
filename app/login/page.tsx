"use client";

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

type Tab = 'login' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

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
        router.push('/dashboard');
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
        toast.success('Konto utworzone! Zaloguj się');
        setTab('login');
        setName('');
        setPassword('');
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Plan PK</h1>
            <p className="text-gray-600 text-sm">
              Zarządzaj swoim planem zajęć
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8">
            <button
              onClick={() => setTab('login')}
              className={`flex-1 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === 'login'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-gray-200 text-gray-600 hover:text-gray-900'
              }`}
            >
              Logowanie
            </button>
            <button
              onClick={() => setTab('register')}
              className={`flex-1 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === 'register'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-gray-200 text-gray-600 hover:text-gray-900'
              }`}
            >
              Rejestracja
            </button>
          </div>

          {/* Login Form */}
          {tab === 'login' && (
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

          {/* Register Form */}
          {tab === 'register' && (
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

          {/* Optional notice */}
          <p className="text-xs text-gray-500 mt-6 text-center">
            Logowanie jest opcjonalne. Możesz korzystać z podstawowych funkcji bez konta.
          </p>
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
