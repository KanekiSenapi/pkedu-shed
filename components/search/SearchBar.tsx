"use client";

import { useState } from 'react';
import { useScheduleStore } from '@/lib/store';
import { ScheduleEntry } from '@/types/schedule';

export function SearchBar() {
  const { schedule } = useScheduleStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ScheduleEntry[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);

    if (!searchQuery.trim() || !schedule) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const filtered = schedule.sections
      .flatMap(section => section.entries)
      .filter(entry => {
        const subject = entry.class_info.subject.toLowerCase();
        const instructor = entry.class_info.instructor?.toLowerCase() || '';
        const room = entry.class_info.room?.toLowerCase() || '';
        const group = entry.group.toLowerCase();

        return (
          subject.includes(lowerQuery) ||
          instructor.includes(lowerQuery) ||
          room.includes(lowerQuery) ||
          group.includes(lowerQuery)
        );
      })
      .slice(0, 10); // Limit to 10 results

    setResults(filtered);
    setShowResults(filtered.length > 0);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => query && setShowResults(results.length > 0)}
          placeholder="Szukaj przedmiotu, wykładowcy, sali..."
          className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {showResults && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowResults(false)}
          />
          <div className="absolute z-20 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
            {results.map((entry) => (
              <div
                key={entry.id}
                className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 cursor-pointer transition-colors"
                onClick={() => setShowResults(false)}
              >
                <div className="font-medium text-gray-900 dark:text-white">
                  {entry.class_info.subject}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {entry.class_info.type && (
                    <span className="mr-2">
                      {entry.class_info.type}
                    </span>
                  )}
                  {entry.class_info.instructor && (
                    <span className="mr-2">• {entry.class_info.instructor}</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {entry.date} • {entry.time} • Grupa {entry.group}
                  {entry.class_info.room && ` • ${entry.class_info.room}`}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
