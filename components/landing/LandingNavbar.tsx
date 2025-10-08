"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';

export function LandingNavbar() {
  const { data: session } = useSession();

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/logo.png"
              alt="Logo Plan Zajęć Politechnika Krakowska"
              width={32}
              height={32}
              className="object-contain"
            />
            <div>
              <h1 className="text-lg font-bold text-gray-900">Plan Zajęć</h1>
              <p className="text-xs text-gray-600 hidden sm:block">Politechnika Krakowska</p>
            </div>
          </Link>

          {session ? (
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Przejdź do Aplikacji
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Zaloguj się
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
