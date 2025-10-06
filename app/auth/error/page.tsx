"use client";

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: Record<string, string> = {
    Configuration: 'Problem z konfiguracją serwera. Skontaktuj się z administratorem.',
    AccessDenied: 'Odmowa dostępu. Nie masz uprawnień do logowania.',
    Verification: 'Token weryfikacyjny wygasł lub jest nieprawidłowy.',
    OAuthSignin: 'Błąd podczas inicjowania logowania.',
    OAuthCallback: 'Błąd podczas weryfikacji logowania.',
    OAuthCreateAccount: 'Nie można utworzyć konta.',
    EmailCreateAccount: 'Nie można utworzyć konta email.',
    Callback: 'Błąd w procesie logowania.',
    OAuthAccountNotLinked: 'Konto jest już połączone z inną metodą logowania.',
    EmailSignin: 'Nie można wysłać emaila weryfikacyjnego.',
    CredentialsSignin: 'Nieprawidłowe dane logowania.',
    SessionRequired: 'Wymagane logowanie.',
    Default: 'Wystąpił nieoczekiwany błąd podczas logowania.',
  };

  const message = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Błąd logowania
          </h1>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {message}
          </p>

          {error && (
            <div className="mb-6 p-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                Error code: {error}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Link
              href="/"
              className="block w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Wróć do strony głównej
            </Link>

            <button
              onClick={() => window.location.reload()}
              className="block w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Spróbuj ponownie
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
