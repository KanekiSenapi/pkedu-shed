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
    .flatMap((section) => section.groups)
    .filter((group, index, self) => self.indexOf(group) === index)
    .sort() || [];

  const showGroups = filters.stopien && filters.rok !== undefined;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Filtry
        </h2>
        <button
          onClick={resetFilters}
          className="text-sm text-[#083575] hover:text-[#001d46] dark:text-[#77a43f] font-medium"
        >
          Wyczyść wszystkie
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Stopień */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Stopień studiów
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
            className="w-full rounded-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#083575] focus:border-[#083575]"
          >
            <option value="">Wybierz stopień</option>
            {available.stopnie.map((s) => (
              <option key={s} value={s}>
                {s} stopień
              </option>
            ))}
          </select>
        </div>

        {/* Rok */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Rok studiów
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
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">Wybierz rok</option>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Grupy
            </label>
            <div className="flex flex-wrap gap-2">
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
                      className={`px-3 py-1 rounded-sm text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-[#083575] text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {group}
                    </button>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">Brak dostępnych grup</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
