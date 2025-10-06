import { turso } from './turso';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export type UserRole = 'user' | 'starosta' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string | null;
  is_admin: boolean;
  role: UserRole;
  starosta_rok: number | null;
  starosta_groups: string[] | null;
  created_at: string;
}

/**
 * Create a new user with email and password
 */
export async function createUser(email: string, password: string, name?: string): Promise<User> {
  const id = randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);

  await turso.execute({
    sql: `INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)`,
    args: [id, email, passwordHash, name || null],
  });

  return {
    id,
    email,
    name: name || null,
    is_admin: false,
    role: 'user',
    starosta_rok: null,
    starosta_groups: null,
    created_at: new Date().toISOString(),
  };
}

/**
 * Verify user credentials
 */
export async function verifyCredentials(email: string, password: string): Promise<User | null> {
  const result = await turso.execute({
    sql: `SELECT id, email, password_hash, name, is_admin, role, starosta_rok, starosta_groups, created_at FROM users WHERE email = ?`,
    args: [email],
  });

  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];
  const passwordHash = user.password_hash as string;

  const isValid = await bcrypt.compare(password, passwordHash);

  if (!isValid) {
    return null;
  }

  return {
    id: user.id as string,
    email: user.email as string,
    name: (user.name as string) || null,
    is_admin: (user.is_admin as number) === 1,
    role: (user.role as UserRole) || 'user',
    starosta_rok: (user.starosta_rok as number) || null,
    starosta_groups: user.starosta_groups ? JSON.parse(user.starosta_groups as string) : null,
    created_at: user.created_at as string,
  };
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await turso.execute({
    sql: `SELECT id, email, name, is_admin, role, starosta_rok, starosta_groups, created_at FROM users WHERE email = ?`,
    args: [email],
  });

  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];
  return {
    id: user.id as string,
    email: user.email as string,
    name: (user.name as string) || null,
    is_admin: (user.is_admin as number) === 1,
    role: (user.role as UserRole) || 'user',
    starosta_rok: (user.starosta_rok as number) || null,
    starosta_groups: user.starosta_groups ? JSON.parse(user.starosta_groups as string) : null,
    created_at: user.created_at as string,
  };
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  const result = await turso.execute({
    sql: `SELECT id, email, name, is_admin, role, starosta_rok, starosta_groups, created_at FROM users WHERE id = ?`,
    args: [id],
  });

  if (result.rows.length === 0) {
    return null;
  }

  const user = result.rows[0];
  return {
    id: user.id as string,
    email: user.email as string,
    name: (user.name as string) || null,
    is_admin: (user.is_admin as number) === 1,
    role: (user.role as UserRole) || 'user',
    starosta_rok: (user.starosta_rok as number) || null,
    starosta_groups: user.starosta_groups ? JSON.parse(user.starosta_groups as string) : null,
    created_at: user.created_at as string,
  };
}

/**
 * Log user login
 */
export async function logLogin(userId: string, userAgent?: string): Promise<void> {
  await turso.execute({
    sql: `INSERT INTO login_logs (user_id, user_agent) VALUES (?, ?)`,
    args: [userId, userAgent || null],
  });
}

/**
 * Save user preferences to database
 */
export async function saveUserPreferencesToDB(userId: string, preferences: any): Promise<void> {
  const preferencesJson = JSON.stringify(preferences);

  // Check if preferences exist
  const existing = await turso.execute({
    sql: `SELECT id FROM user_preferences WHERE user_id = ?`,
    args: [userId],
  });

  if (existing.rows.length > 0) {
    // Update
    await turso.execute({
      sql: `UPDATE user_preferences SET preferences_json = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
      args: [preferencesJson, userId],
    });
  } else {
    // Insert
    await turso.execute({
      sql: `INSERT INTO user_preferences (user_id, preferences_json) VALUES (?, ?)`,
      args: [userId, preferencesJson],
    });
  }
}

/**
 * Load user preferences from database
 */
export async function loadUserPreferencesFromDB(userId: string): Promise<any | null> {
  const result = await turso.execute({
    sql: `SELECT preferences_json FROM user_preferences WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1`,
    args: [userId],
  });

  if (result.rows.length === 0) {
    return null;
  }

  const preferencesJson = result.rows[0].preferences_json as string;
  return JSON.parse(preferencesJson);
}
