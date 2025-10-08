"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { syncLoadUserPreferences } from '@/lib/user-preferences';

export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    const checkPreferences = async () => {
      const preferences = await syncLoadUserPreferences();

      if (!preferences) {
        router.push('/begin');
        return;
      }

      if (preferences.role === 'student') {
        router.push('/dashboard/student');
        return;
      }

      if (preferences.role === 'instructor') {
        router.push('/dashboard/instructor');
        return;
      }

      // Fallback
      router.push('/begin');
    };

    checkPreferences();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <div className="text-lg text-gray-600">Przekierowanie...</div>
      </div>
    </div>
  );
}
