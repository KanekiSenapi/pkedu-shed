"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

export function LandingNavbar() {
  const { data: session } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getUserInitials = (): string => {
    if (session?.user?.email) {
      const email = session.user.email;
      return email.substring(0, 2).toUpperCase();
    }
    return 'GU';
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center space-x-4">
            <Image
              src="/images/logo.png"
              alt="Logo Plan Zajęć Politechnika Krakowska"
              width={32}
              height={32}
              className="object-contain"
            />
            <h1 className="text-lg font-bold text-gray-900">Wirtualny Student</h1>
            <div className="hidden md:flex items-center space-x-3">
              <div className="h-3 w-px bg-gray-300"></div>
              <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 border border-gray-200">
                Politechnika Krakowska
              </span>
            </div>
          </div>

          {session ? (
            <div className="flex items-center gap-3">
              <NotificationBell />

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center justify-center w-9 h-9 bg-gray-200 text-gray-700 font-medium text-sm border border-gray-300 hover:bg-gray-300 transition-colors cursor-pointer"
                >
                  {getUserInitials()}
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 shadow-lg z-50">
                    <div className="p-4 border-b border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">
                        {session.user?.email}
                      </div>
                      <div className="text-sm text-gray-900">Zalogowany</div>
                    </div>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        router.push('/dashboard');
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-200"
                    >
                      Przejdź do Aplikacji
                    </button>
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        signOut();
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Wyloguj się
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Zaloguj się / Zarejestruj
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
