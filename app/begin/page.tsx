"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BeginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to /login with guest mode
    router.push('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <div className="text-lg text-gray-600">Przekierowywanie...</div>
      </div>
    </div>
  );
}
