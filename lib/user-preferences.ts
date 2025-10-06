export type UserRole = 'student' | 'instructor';

export interface StudentPreferences {
  role: 'student';
  stopien: string;  // 'I' | 'II'
  rok: number;      // 1-4
  groups: string[]; // ['DS1', 'DS2']
}

export interface InstructorPreferences {
  role: 'instructor';
  fullName: string; // 'dr Tomasz Ligocki'
}

export type UserPreferences = StudentPreferences | InstructorPreferences;

const PREFERENCES_KEY = 'user_preferences';

/**
 * Save user preferences to localStorage
 */
export function saveUserPreferences(preferences: UserPreferences): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  }
}

/**
 * Load user preferences from localStorage
 */
export function loadUserPreferences(): UserPreferences | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(PREFERENCES_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as UserPreferences;
  } catch {
    return null;
  }
}

/**
 * Clear user preferences
 */
export function clearUserPreferences(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(PREFERENCES_KEY);
  }
}

/**
 * Check if user has completed onboarding
 */
export function hasCompletedOnboarding(): boolean {
  return loadUserPreferences() !== null;
}

/**
 * Save user preferences to both localStorage and database (if logged in)
 */
export async function syncSaveUserPreferences(preferences: UserPreferences): Promise<void> {
  // Always save to localStorage first (sync)
  saveUserPreferences(preferences);

  // Try to sync to database if user is logged in
  try {
    await fetch('/api/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences }),
    });
  } catch (error) {
    // Silently fail - localStorage save already succeeded
    console.log('Could not sync preferences to database (user may not be logged in)');
  }
}

/**
 * Load user preferences from database (if logged in) or localStorage
 * If user is logged in, DB preferences take precedence
 */
export async function syncLoadUserPreferences(): Promise<UserPreferences | null> {
  try {
    // Try to load from database first
    const response = await fetch('/api/preferences');

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.preferences) {
        // Also update localStorage with DB preferences
        saveUserPreferences(data.preferences);
        return data.preferences;
      }
    }
  } catch (error) {
    // If DB load fails, fall back to localStorage
    console.log('Could not load preferences from database, using localStorage');
  }

  // Fall back to localStorage
  return loadUserPreferences();
}
