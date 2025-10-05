"use client";

import { useEffect } from 'react';
import { useScheduleStore } from '@/lib/store';

export function Filters() {
  const { filters, setFilters, resetFilters, getAvailableFilters, schedule } = useScheduleStore();
  const available = getAvailableFilters();

  // Load filters from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('schedule-filters');
      if (stored) {
        const savedFilters = JSON.parse(stored);
        // setFilters will save to localStorage, but that's OK - it's idempotent
        setFilters(savedFilters);
      }
    } catch (error) {
      console.error('Failed to load filters from localStorage:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array = run once on mount

  // Filtruj dostępne grupy na podstawie wybranego stopnia i roku
  const filteredGroups = schedule?.sections
    .filter((section) => {
      if (filters.stopien && section.stopien !== filters.stopien) return false;
      if (filters.rok !== undefined && section.rok !== filters.rok) return false;
      return true;
    })
    .flatMap((section) =>
      section.groups.flatMap(g => g.split(',').map(item => item.trim()))
    )
    .filter((group, index, self) => self.indexOf(group) === index)
    .sort() || [];

  const showGroups = filters.stopien && filters.rok !== undefined;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          Filtry
        </h2>
        <button
          onClick={resetFilters}
          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300"
        >
          Wyczyść
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Przedmiot */}
        <div className="md:col-span-2">
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Przedmiot
          </label>
          <select
            value={filters.subject || ''}
            onChange={(e) => setFilters({ subject: e.target.value || undefined })}
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500"
          >
            <option value="">Wszystkie przedmioty</option>
            {available.subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>
        </div>

        {/* Stopień */}
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Stopień
          </label>
          <select
            value={filters.stopien || ''}
            onChange={(e) =>
              setFilters({
                stopien: e.target.value || undefined,
                rok: undefined,
                groups: undefined
              })
            }
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500"
          >
            <option value="">Wybierz</option>
            {available.stopnie.map((s) => (
              <option key={s} value={s}>
                {s} stopień
              </option>
            ))}
          </select>
        </div>

        {/* Rok */}
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Rok
          </label>
          <select
            value={filters.rok?.toString() || ''}
            onChange={(e) =>
              setFilters({
                rok: e.target.value ? parseInt(e.target.value) : undefined,
                groups: undefined
              })
            }
            disabled={!filters.stopien}
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <option value="">Wybierz</option>
            {available.lata.map((r) => (
              <option key={r} value={r}>
                Rok {r}
              </option>
            ))}
          </select>
        </div>

        {/* Grupy */}
        {showGroups && (
          <div className="md:col-span-2 lg:col-span-1">
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Grupy
            </label>
            <div className="flex flex-wrap gap-1.5">
              {filteredGroups.length > 0 ? (
                filteredGroups.map((group) => {
                  const isSelected = filters.groups?.includes(group);
                  return (
                    <button
                      key={group}
                      onClick={() => {
                        const currentGroups = filters.groups || [];
                        const newGroups = isSelected
                          ? currentGroups.filter((g) => g !== group)
                          : [...currentGroups, group];
                        setFilters({
                          groups: newGroups.length > 0 ? newGroups : undefined,
                        });
                      }}
                      className={`px-2.5 py-1 text-xs transition-colors ${
                        isSelected
                          ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {group}
                    </button>
                  );
                })
              ) : (
                <p className="text-xs text-gray-400">Brak grup</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
