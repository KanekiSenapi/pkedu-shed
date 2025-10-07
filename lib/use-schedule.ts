import { useEffect, useCallback, useRef } from 'react';
import { useScheduleStore } from './store';
import { loadFromCache, saveToCache, getStoredHash } from './cache-manager';
import toast from 'react-hot-toast';

const CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds

// Global flags to prevent concurrent operations across all hook instances
let isCheckingForUpdates = false;
let hasGloballyInitialized = false;

/**
 * Custom hook for managing schedule data
 */
export function useSchedule() {
  const {
    schedule,
    loading,
    error,
    lastChecked,
    setSchedule,
    setLoading,
    setError,
    setLastChecked,
  } = useScheduleStore();

  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Fetches schedule data from API (read-only, cached)
   */
  const fetchSchedule = useCallback(
    async (force = false) => {
      setLoading(true);
      setError(null);

      try {
        // Use public read-only endpoint
        const response = await fetch('/api/schedule');
        const result = await response.json();

        if (result.success) {
          setSchedule(result.data);
          saveToCache(result.data);

          if (force) {
            toast.success('Plan zajęć zaktualizowany!');
          }
        } else {
          throw new Error(result.error || 'Failed to fetch schedule');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        toast.error(`Błąd pobierania planu: ${errorMessage}`);

        // Try to load from cache on error
        const cached = loadFromCache();
        if (cached) {
          setSchedule(cached.schedule);
          toast('Używam zapisanych danych', { icon: '💾' });
        }
      } finally {
        setLoading(false);
      }
    },
    [setSchedule, setLoading, setError]
  );

  /**
   * Checks for updates without forcing a full refresh
   */
  const checkForUpdates = useCallback(async () => {
    // Prevent concurrent checks across all hook instances
    if (isCheckingForUpdates) {
      console.log('[Schedule] Already checking for updates, skipping...');
      return;
    }

    isCheckingForUpdates = true;

    try {
      // Get client's current hash
      const clientHash = getStoredHash();

      // Build URL with client hash
      const url = clientHash
        ? `/api/schedule/check?clientHash=${encodeURIComponent(clientHash)}`
        : '/api/schedule/check';

      const response = await fetch(url);
      const result = await response.json();

      if (result.success && result.hasUpdate) {
        console.log('[Schedule] New version detected, updating...');
        toast(
          'Dostępna jest nowa wersja planu zajęć!',
          {
            icon: '🔔',
            duration: 5000,
          }
        );

        // Automatically fetch new data
        await fetchSchedule(true);
      } else {
        console.log('[Schedule] Client data is up to date');
      }

      setLastChecked(new Date());
    } catch (err) {
      console.error('Error checking for updates:', err);
    } finally {
      isCheckingForUpdates = false;
    }
  }, [fetchSchedule, setLastChecked]);

  /**
   * Initial load - use cache first, then check for updates
   */
  useEffect(() => {
    // Prevent multiple initializations from different hook instances
    if (hasGloballyInitialized) {
      console.log('[Schedule] Already initialized globally, skipping...');
      return;
    }
    hasGloballyInitialized = true;

    const initializeSchedule = async () => {
      // Try to load from localStorage first (instant)
      const cached = loadFromCache();

      if (cached) {
        setSchedule(cached.schedule);
        console.log('[Schedule] Loaded from localStorage cache');

        // ALWAYS check for updates on mount (even if cache is fresh)
        // This ensures users see latest data after cron updates
        console.log('[Schedule] Checking for updates...');
        await checkForUpdates();
      } else {
        // No cache - fetch from API
        console.log('[Schedule] No cache found, fetching from API...');
        await fetchSchedule();
      }
    };

    initializeSchedule();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  /**
   * Setup auto-refresh interval
   */
  useEffect(() => {
    // Clear existing interval
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }

    // Setup new interval to check for updates every hour
    // Use a stable reference to avoid recreating interval
    checkIntervalRef.current = setInterval(() => {
      // Call checkForUpdates directly to avoid dependency issues
      if (!isCheckingForUpdates) {
        checkForUpdates();
      }
    }, CHECK_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
    // Only recreate interval if CHECK_INTERVAL changes (never does)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    schedule,
    loading,
    error,
    lastChecked,
    refresh: () => fetchSchedule(true),
    checkForUpdates,
  };
}
