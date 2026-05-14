import fs from 'fs';
import path from 'path';
import { app, safeStorage } from 'electron';

const CONFIG_FILE_NAME = 'config.enc';
const CONFIG_WRAPPER_TYPE = 'lockrnotes-config';
const CONFIG_WRAPPER_VERSION = '1.0';

/** Absolute path to the encrypted config file in the user-data directory. */
function getConfigPath(): string {
  return path.join(app.getPath('userData'), CONFIG_FILE_NAME);
}

/**
 * One-time migration: if a legacy plaintext config.json exists in process.cwd(),
 * read it, encrypt it into the new location, then delete the old file.
 * Silently no-ops when no legacy file is found.
 */
export async function migrateConfigIfNeeded(): Promise<void> {
  const legacyPath = path.join(process.cwd(), 'config.json');
  try {
    await fs.promises.access(legacyPath, fs.constants.F_OK);
  } catch {
    return; // no legacy file — nothing to migrate
  }

  try {
    const raw = await fs.promises.readFile(legacyPath, 'utf8');
    const parsed = JSON.parse(raw);

    if (!safeStorage.isEncryptionAvailable()) {
      // eslint-disable-next-line no-console
      console.warn(
        'safeStorage unavailable during migration — keeping legacy config',
      );
      return;
    }

    await writeEncryptedConfig(parsed);
    await fs.promises.unlink(legacyPath);
    // eslint-disable-next-line no-console
    console.log('Migrated legacy config.json to encrypted config.enc');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to migrate legacy config:', error);
  }
}

/** Internal helper: encrypt and atomically write the config object to disk. */
async function writeEncryptedConfig(config: any): Promise<void> {
  const configPath = getConfigPath();
  await fs.promises.mkdir(path.dirname(configPath), { recursive: true });

  const encrypted = safeStorage.encryptString(JSON.stringify(config));
  const wrapper = {
    type: CONFIG_WRAPPER_TYPE,
    version: CONFIG_WRAPPER_VERSION,
    encrypted: encrypted.toString('base64'),
    created: new Date().toISOString(),
  };

  const tmpPath = `${configPath}.tmp`;
  await fs.promises.writeFile(
    tmpPath,
    JSON.stringify(wrapper, null, 2),
    'utf8',
  );
  await fs.promises.rename(tmpPath, configPath);
}

/**
 * Ensure an encrypted config file exists in the user-data directory.
 * Creates it with defaults if missing.
 */
export async function ensureConfigFile(): Promise<void> {
  try {
    const configPath = getConfigPath();

    try {
      await fs.promises.access(configPath, fs.constants.F_OK);
      // eslint-disable-next-line no-console
      console.log('Config file already exists at', configPath);
      return;
    } catch {
      // File does not exist — proceed to create
    }

    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('System encryption is not available');
    }

    const defaultPath = path.join(app.getPath('documents'), 'LockrNotes');

    const defaultConfig = {
      defaultPath,
      keyStorageType: 'system',
      language: 'pt-BR',
      autoSave: true,
      firstRun: true,
      openTabs: [],
      activeTabId: null,
      windowSize: { width: 1200, height: 800 },
    };

    await writeEncryptedConfig(defaultConfig);
    // eslint-disable-next-line no-console
    console.log('Created encrypted config at', configPath);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to ensure config file:', error);
  }
}

/**
 * Read and decrypt the config file.
 * Returns null if the file doesn't exist or can't be read.
 */
export async function readConfigFile(): Promise<any | null> {
  try {
    const configPath = getConfigPath();
    const raw = await fs.promises.readFile(configPath, 'utf8');
    const wrapper = JSON.parse(raw);

    if (
      wrapper.type !== CONFIG_WRAPPER_TYPE ||
      wrapper.version !== CONFIG_WRAPPER_VERSION
    ) {
      // eslint-disable-next-line no-console
      console.error('Config file has unexpected format');
      return null;
    }

    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('System encryption is not available');
    }

    const buffer = Buffer.from(wrapper.encrypted, 'base64');
    const decrypted = safeStorage.decryptString(buffer);
    return JSON.parse(decrypted);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to read config file:', error);
    return null;
  }
}

/**
 * Update the config file with new values (shallow merge).
 * Returns true if successful, false otherwise.
 */
export async function updateConfigFile(updates: any): Promise<boolean> {
  try {
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('System encryption is not available');
    }

    const existingConfig = (await readConfigFile()) || {};
    const newConfig = { ...existingConfig, ...updates };

    await writeEncryptedConfig(newConfig);
    // eslint-disable-next-line no-console
    console.log('Updated config file successfully');
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to update config file:', error);
    return false;
  }
}

/**
 * Read config and return a formatted JSON string.
 * Intended for debug/development use only.
 */
export async function readConfigRaw(): Promise<string | null> {
  const config = await readConfigFile();
  if (config === null) return null;
  return JSON.stringify(config, null, 2);
}
