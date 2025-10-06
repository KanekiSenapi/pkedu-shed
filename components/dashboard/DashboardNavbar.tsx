"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { UserPreferences } from '@/lib/user-preferences';

interface DashboardNavbarProps {
  preferences: UserPreferences;
}

export function DashboardNavbar({ preferences }: DashboardNavbarProps) {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
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
    if (preferences.role === 'student') {
      return `Stopień ${preferences.stopien}, Rok ${preferences.rok}, Grupa ${preferences.groups.join(', ')}`;
    }
    return preferences.fullName;
  };

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-lg font-bold text-gray-900 hover:text-gray-700"
            >
              Moje zajęcia
            </button>
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
                className="flex items-center justify-center w-9 h-9 bg-gray-200 text-gray-700 font-medium text-sm border border-gray-300 hover:bg-gray-300 transition-colors"
              >
                {getUserInitials()}
              </button>

              {showDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 shadow-lg z-50">
                  <div className="p-4 border-b border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Niezalogowany</div>
                    <div className="text-sm text-gray-900">{getUserInfo()}</div>
                  </div>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      router.push('/browse');
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-200"
                  >
                    Widok ogólny
                  </button>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      router.push('/begin');
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Zmień ustawienia
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
