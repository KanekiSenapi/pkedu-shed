"use client";

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function AuthErrorContent() {
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white border border-gray-200 p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 text-red-600 mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Błąd logowania
          </h1>

          <p className="text-gray-600 mb-6">
            {message}
          </p>

          {error && (
            <div className="mb-6 p-3 bg-gray-100 border border-gray-200">
              <p className="text-xs text-gray-500 font-mono">
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
              className="block w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Spróbuj ponownie
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
