"use client";

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState } from 'react';

export function Navbar() {
  const { data: session, status } = useSession();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-bold text-gray-900">
              Plan Zajęć
            </h1>
            <div className="hidden md:flex items-center space-x-3">
              <div className="h-3 w-px bg-gray-300"></div>
              <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 border border-gray-200">
                Politechnika Krakowska
              </span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
