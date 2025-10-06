"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { loadUserPreferences } from '@/lib/user-preferences';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const prefs = loadUserPreferences();

    if (prefs) {
      // User has completed onboarding, redirect to dashboard
      router.replace('/dashboard');
    } else {
      // User hasn't completed onboarding, redirect to begin
      router.replace('/begin');
    }
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <div className="text-lg text-gray-600">Ładowanie...</div>
      </div>
    </div>
  );
}
