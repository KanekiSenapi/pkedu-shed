import { useEffect, useCallback, useRef } from 'react';
import { useScheduleStore } from './store';
import { loadFromCache, saveToCache } from './cache-manager';
import toast from 'react-hot-toast';

const CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds

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
   * Fetches schedule data from API
   */
  const fetchSchedule = useCallback(
    async (force = false) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/schedule/fetch?force=${force}`);
        const result = await response.json();

        if (result.success) {
          setSchedule(result.data);
          saveToCache(result.data);

          if (!result.cached || force) {
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
    try {
      const response = await fetch('/api/schedule/check');
      const result = await response.json();

      if (result.success && result.hasUpdate) {
        toast(
          'Dostępna jest nowa wersja planu zajęć!',
          {
            icon: '🔔',
            duration: 5000,
          }
        );

        // Automatically fetch new data
        await fetchSchedule(true);
      }

      setLastChecked(new Date());
    } catch (err) {
      console.error('Error checking for updates:', err);
    }
  }, [fetchSchedule, setLastChecked]);

  /**
   * Initial load - use cache first, then fetch if needed
   */
  useEffect(() => {
    const initializeSchedule = async () => {
      // Try to load from localStorage first (instant)
      const cached = loadFromCache();

      if (cached) {
        setSchedule(cached.schedule);
        console.log('[Schedule] Loaded from localStorage cache');

        // Check if cache is still valid (< 7 days)
        const cacheDate = new Date(cached.timestamp);
        const now = new Date();
        const hoursSinceCache = (now.getTime() - cacheDate.getTime()) / (1000 * 60 * 60);

        // If cache is fresh (< 1 hour), skip API call
        if (hoursSinceCache < 1) {
          console.log('[Schedule] Cache is fresh, skipping API call');
          return;
        }

        // Cache is old, check for updates in background
        console.log('[Schedule] Cache is stale, checking for updates...');
      }

      // No cache or cache is old - fetch from API
      await fetchSchedule();
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
    checkIntervalRef.current = setInterval(() => {
      checkForUpdates();
    }, CHECK_INTERVAL);

    // Cleanup on unmount
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [checkForUpdates]);

  return {
    schedule,
    loading,
    error,
    lastChecked,
    refresh: () => fetchSchedule(true),
    checkForUpdates,
  };
}
