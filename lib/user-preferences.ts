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
