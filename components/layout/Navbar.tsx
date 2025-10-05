"use client";

export function Navbar() {
  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Plan Zajęć PK
            </h1>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Politechnika Krakowska
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Future: Add user menu, notifications, etc. */}
          </div>
        </div>
      </div>
    </nav>
  );
}
