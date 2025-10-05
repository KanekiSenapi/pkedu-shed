import fs from 'fs/promises';
import path from 'path';
import { ParsedSchedule, CacheData } from '@/types/schedule';

/**
 * Server-side cache manager for API routes
 */

/**
 * Saves schedule data to a file
 */
export async function saveToCache(
  schedule: ParsedSchedule,
  filePath: string
): Promise<void> {
  const cacheData: CacheData = {
    schedule,
    timestamp: new Date().toISOString(),
  };

  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(cacheData, null, 2), 'utf-8');
}

/**
 * Loads schedule data from a file
 */
export async function loadFromCache(filePath: string): Promise<CacheData | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Saves file hash
 */
export async function saveHash(hash: string, filePath: string): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, hash, 'utf-8');
}

/**
 * Loads file hash
 */
export async function loadHash(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    return null;
  }
}
