"use client";

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState } from 'react';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useRouter, usePathname } from 'next/navigation';

export function Navbar() {
  const { data: session, status } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const navLinks = [
    { href: '/dashboard', label: 'Plan zajęć', icon: '📅' },
    { href: '/calendar', label: 'Kalendarz', icon: '📆' },
    { href: '/map', label: 'Mapa', icon: '🗺️' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-bold text-gray-900">
              Wirtualny Student
            </h1>
            <div className="hidden md:flex items-center space-x-3">
              <div className="h-3 w-px bg-gray-300"></div>
              <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 border border-gray-200">
                Politechnika Krakowska
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => router.push(link.href)}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  pathname === link.href
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="mr-1">{link.icon}</span>
                {link.label}
              </button>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center">
            <NotificationBell />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-3 flex gap-1">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => router.push(link.href)}
              className={`flex-1 px-2 py-1.5 text-xs transition-colors ${
                pathname === link.href
                  ? 'bg-blue-50 text-blue-600 font-medium border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <span className="mr-1">{link.icon}</span>
              {link.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
