import md5 from 'md5';
import { ParsedSchedule, CacheData } from '@/types/schedule';

const CACHE_KEY = 'pk_schedule_cache';
const HASH_KEY = 'pk_schedule_hash';

/**
 * Client-side cache manager using localStorage
 */

/**
 * Calculates MD5 hash of a buffer
 */
export function calculateHash(buffer: Buffer): string {
  return md5(buffer);
}

/**
 * Creates a versioned hash by combining file hash with parser version
 * This ensures clients update when parser logic changes, even if file is the same
 */
export function createVersionedHash(fileHash: string, parserVersion: string): string {
  return `${fileHash}_v${parserVersion}`;
}

/**
 * Saves schedule data to localStorage
 */
export function saveToCache(schedule: ParsedSchedule): void {
  if (typeof window === 'undefined') {
    console.warn('Cannot save to cache on server side');
    return;
  }

  const cacheData: CacheData = {
    schedule,
    timestamp: new Date().toISOString(),
  };

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    localStorage.setItem(HASH_KEY, schedule.fileHash);
  } catch (error) {
    console.error('Failed to save to cache:', error);
  }
}

/**
 * Loads schedule data from localStorage
 */
export function loadFromCache(): CacheData | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) {
      return null;
    }

    return JSON.parse(cached);
  } catch (error) {
    console.error('Failed to load from cache:', error);
    return null;
  }
}

/**
 * Gets the stored file hash
 */
export function getStoredHash(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return localStorage.getItem(HASH_KEY);
}

/**
 * Checks if cache exists and is valid
 */
export function isCacheValid(): boolean {
  const cached = loadFromCache();
  if (!cached) {
    return false;
  }

  // Check if cache is not too old (e.g., max 7 days)
  const cacheDate = new Date(cached.timestamp);
  const now = new Date();
  const daysDiff = (now.getTime() - cacheDate.getTime()) / (1000 * 60 * 60 * 24);

  return daysDiff < 7;
}

/**
 * Clears the cache
 */
export function clearCache(): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(HASH_KEY);
}

/**
 * Checks if the file has changed by comparing hashes
 */
export function hasFileChanged(newHash: string): boolean {
  const storedHash = getStoredHash();
  if (!storedHash) {
    return true; // No stored hash means it's new
  }

  return newHash !== storedHash;
}
