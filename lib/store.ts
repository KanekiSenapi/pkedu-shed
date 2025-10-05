import { create } from 'zustand';
import {
  ParsedSchedule,
  ScheduleEntry,
  FilterOptions,
  ScheduleStats,
} from '@/types/schedule';
import { isWeekend } from './schedule-processor';

interface ScheduleStore {
  // Data
  schedule: ParsedSchedule | null;
  filteredEntries: ScheduleEntry[];

  // Filters
  filters: FilterOptions;

  // UI State
  loading: boolean;
  error: string | null;
  lastChecked: Date | null;

  // Actions
  setSchedule: (schedule: ParsedSchedule) => void;
  setFilters: (filters: Partial<FilterOptions>) => void;
  resetFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastChecked: (date: Date) => void;

  // Computed
  getStats: () => ScheduleStats;
  getWeekendEntries: () => ScheduleEntry[];
  getAvailableFilters: () => {
    kierunki: string[];
    stopnie: string[];
    lata: number[];
    semestry: number[];
    grupy: string[];
    subjects: string[];
  };

  // Internal
  applyFilters: () => void;
}

// Save filters to localStorage
const saveFiltersToStorage = (filters: FilterOptions) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('schedule-filters', JSON.stringify(filters));
  } catch (error) {
    console.error('Failed to save filters to localStorage:', error);
  }
};

export const useScheduleStore = create<ScheduleStore>((set, get) => ({
  // Initial state
  schedule: null,
  filteredEntries: [],
  filters: {},
  loading: false,
  error: null,
  lastChecked: null,

  // Actions
  setSchedule: (schedule) => {
    set({ schedule });
    // Reapply filters
    get().applyFilters();
  },

  setFilters: (newFilters) => {
    const updatedFilters = { ...get().filters, ...newFilters };
    set({ filters: updatedFilters });
    saveFiltersToStorage(updatedFilters);
    get().applyFilters();
  },

  resetFilters: () => {
    set({ filters: {} });
    saveFiltersToStorage({});
    get().applyFilters();
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setLastChecked: (date) => set({ lastChecked: date }),

  // Private method to apply filters
  applyFilters: () => {
    const { schedule, filters } = get();
    if (!schedule) {
      set({ filteredEntries: [] });
      return;
    }

    let entries: ScheduleEntry[] = [];

    // Collect all entries from all sections
    schedule.sections.forEach((section) => {
      entries.push(...section.entries);
    });

    // Apply filters
    if (filters.kierunek) {
      entries = entries.filter((e) => e.kierunek === filters.kierunek);
    }

    if (filters.stopien) {
      entries = entries.filter((e) => e.stopien === filters.stopien);
    }

    if (filters.rok !== undefined) {
      entries = entries.filter((e) => e.rok === filters.rok);
    }

    if (filters.semestr !== undefined) {
      entries = entries.filter((e) => e.semestr === filters.semestr);
    }

    if (filters.tryb) {
      entries = entries.filter((e) => e.tryb === filters.tryb);
    }

    if (filters.groups && filters.groups.length > 0) {
      entries = entries.filter((e) => {
        // e.group może być "DS1" lub "DS1, DS2" (merged cells)
        const entryGroups = e.group.split(', ');
        // Sprawdź czy którakolwiek z wybranych grup jest w entryGroups
        return filters.groups!.some(selectedGroup => entryGroups.includes(selectedGroup));
      });
    }

    if (filters.subject) {
      entries = entries.filter((e) => e.class_info.subject === filters.subject);
    }

    set({ filteredEntries: entries });
  },

  // Computed properties
  getStats: () => {
    const { filteredEntries } = get();

    const stats: ScheduleStats = {
      totalClasses: filteredEntries.length,
      remoteClasses: filteredEntries.filter((e) => e.class_info.is_remote).length,
      stationaryClasses: filteredEntries.filter((e) => !e.class_info.is_remote).length,
      totalWeekends: new Set(
        filteredEntries.filter((e) => isWeekend(e.day)).map((e) => e.date)
      ).size,
      byType: {
        wykład: filteredEntries.filter((e) => e.class_info.type === 'wykład').length,
        laboratorium: filteredEntries.filter((e) => e.class_info.type === 'laboratorium')
          .length,
        projekt: filteredEntries.filter((e) => e.class_info.type === 'projekt').length,
        ćwiczenia: filteredEntries.filter((e) => e.class_info.type === 'ćwiczenia').length,
        other: filteredEntries.filter((e) => e.class_info.type === null).length,
      },
    };

    return stats;
  },

  getWeekendEntries: () => {
    const { filteredEntries } = get();
    return filteredEntries.filter((e) => isWeekend(e.day));
  },

  getAvailableFilters: () => {
    const { schedule } = get();
    if (!schedule) {
      return {
        kierunki: [],
        stopnie: [],
        lata: [],
        semestry: [],
        grupy: [],
        subjects: [],
      };
    }

    const kierunki = new Set<string>();
    const stopnie = new Set<string>();
    const lata = new Set<number>();
    const semestry = new Set<number>();
    const grupy = new Set<string>();
    const subjects = new Set<string>();

    schedule.sections.forEach((section) => {
      kierunki.add(section.kierunek);
      stopnie.add(section.stopien);
      lata.add(section.rok);
      semestry.add(section.semestr);
      section.groups.forEach((group) => grupy.add(group));
      section.entries.forEach((entry) => subjects.add(entry.class_info.subject));
    });

    return {
      kierunki: Array.from(kierunki).sort(),
      stopnie: Array.from(stopnie).sort(),
      lata: Array.from(lata).sort((a, b) => a - b),
      semestry: Array.from(semestry).sort((a, b) => a - b),
      grupy: Array.from(grupy).sort(),
      subjects: Array.from(subjects).sort(),
    };
  },
}));
