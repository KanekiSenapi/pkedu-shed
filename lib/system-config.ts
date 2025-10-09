import { turso } from './turso';

/**
 * Get system configuration value by key
 */
export async function getSystemConfig(key: string): Promise<string | null> {
  try {
    const result = await turso.execute({
      sql: 'SELECT value FROM system_config WHERE key = ?',
      args: [key]
    });

    if (result.rows.length > 0) {
      return result.rows[0].value as string;
    }

    return null;
  } catch (error) {
    console.error(`Error getting system config ${key}:`, error);
    return null;
  }
}

/**
 * Set system configuration value
 */
export async function setSystemConfig(key: string, value: string): Promise<void> {
  try {
    await turso.execute({
      sql: `
        INSERT INTO system_config (key, value, updated_at)
        VALUES (?, ?, datetime('now'))
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          updated_at = datetime('now')
      `,
      args: [key, value]
    });
  } catch (error) {
    console.error(`Error setting system config ${key}:`, error);
    throw error;
  }
}

/**
 * Get default parser version for system-wide schedule updates
 */
export async function getDefaultParserVersion(): Promise<string> {
  const version = await getSystemConfig('default_parser_version');
  return version || '3.0'; // Fallback to V3
}

/**
 * Set default parser version for system-wide schedule updates
 */
export async function setDefaultParserVersion(version: string): Promise<void> {
  await setSystemConfig('default_parser_version', version);
}
