"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { BugReportModal } from '@/components/bug-report/BugReportModal';
import { UserPreferences } from '@/lib/user-preferences';

interface DashboardNavbarProps {
  preferences: UserPreferences | null;
}

export function DashboardNavbar({ preferences }: DashboardNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showBugReport, setShowBugReport] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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
    if (!preferences) return 'GU';
    if (preferences.role === 'student') {
      return preferences.groups[0]?.substring(0, 2).toUpperCase() || 'ST';
    }
    const names = preferences.fullName.split(' ');
    return names
      .filter(n => n.length > 0)
      .slice(-2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const getUserInfo = (): string => {
    if (!preferences) return 'Gość';
    if (preferences.role === 'student') {
      return `Stopień ${preferences.stopien}, Rok ${preferences.rok}, Grupa ${preferences.groups.join(', ')}`;
    }
    return preferences.fullName;
  };

  const getPageTitle = (): string => {
    if (pathname === '/browse') return 'Widok ogólny';
    return 'Moje zajęcia';
  };

  return (
    <>
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-bold text-gray-900">
              {getPageTitle()}
            </h1>
            <div className="hidden md:flex items-center space-x-3">
              <div className="h-3 w-px bg-gray-300"></div>
              <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 border border-gray-200">
                Politechnika Krakowska
              </span>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            <NotificationBell />

            {/* User Avatar Dropdown */}
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
                      {session ? session.user?.email : 'Niezalogowany'}
                    </div>
                    <div className="text-sm text-gray-900">{getUserInfo()}</div>
                  </div>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      router.push('/dashboard');
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-200"
                  >
                    Moje zajęcia
                  </button>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      router.push('/browse');
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-200"
                  >
                    Widok ogólny
                  </button>
                  {session && (session.user as any).isAdmin && (
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        router.push('/admin');
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-200"
                    >
                      Panel administratora
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      setShowBugReport(true);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-200"
                  >
                    Zgłoś błąd lub sugestię
                  </button>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      router.push('/begin');
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-200"
                  >
                    Ustawienia
                  </button>
                  {session ? (
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        signOut();
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Wyloguj się
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowDropdown(false);
                        router.push('/login');
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Zaloguj się
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>

    {/* Bug Report Modal */}
    <BugReportModal
      isOpen={showBugReport}
      onClose={() => setShowBugReport(false)}
      userInfo={preferences ? getUserInfo() : undefined}
    />
  </>
  );
}
