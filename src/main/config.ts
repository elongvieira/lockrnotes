import fs from 'fs';
import path from 'path';
import { app } from 'electron';

/**
 * Ensure a config.json exists in the application's working directory.
 * If missing, create it with minimal default content { defaultPath: '' }.
 */
export async function ensureConfigFile(): Promise<void> {
  try {
    const cwd = process.cwd();
    const configPath = path.join(cwd, 'config.json');

    // If file already exists, do nothing
    try {
      await fs.promises.access(configPath, fs.constants.F_OK);
      // eslint-disable-next-line no-console
      console.log('Config file already exists at', configPath);
      return;
    } catch (err) {
      // File does not exist — proceed to create
    }

    // Use Electron's API to get user's Documents/LockrNotes folder
    const defaultPath = path.join(app.getPath('documents'), 'LockrNotes');

    const defaultConfig = {
      defaultPath,
      keyStorageType: 'system', // Default to system storage (can be changed to 'folder')
      language: 'pt-BR', // Default language
      autoSave: true, // Auto-save files on changes
      firstRun: true,
      openTabs: [],
      activeTabId: null,
      windowSize: { width: 1200, height: 800 }, // Window size
    };

    // Write atomically: write to a temp file then rename
    const tmpPath = `${configPath}.tmp`;
    await fs.promises.writeFile(
      tmpPath,
      JSON.stringify(defaultConfig, null, 2),
      'utf8',
    );
    await fs.promises.rename(tmpPath, configPath);
    // eslint-disable-next-line no-console
    console.log('Created default config.json at', configPath);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to ensure config.json:', error);
  }
}

/**
 * Read the config.json file and return its contents.
 * Returns null if the file doesn't exist or can't be read.
 */
export async function readConfigFile(): Promise<any | null> {
  try {
    const cwd = process.cwd();
    const configPath = path.join(cwd, 'config.json');

    const configContent = await fs.promises.readFile(configPath, 'utf8');
    return JSON.parse(configContent);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to read config.json:', error);
    return null;
  }
}

/**
 * Update the config.json file with new values.
 * Returns true if successful, false otherwise.
 */
export async function updateConfigFile(updates: any): Promise<boolean> {
  try {
    const cwd = process.cwd();
    const configPath = path.join(cwd, 'config.json');

    // Read existing config
    const existingConfig = (await readConfigFile()) || {};

    // Merge with updates
    const newConfig = { ...existingConfig, ...updates };

    // Write atomically
    const tmpPath = `${configPath}.tmp`;
    await fs.promises.writeFile(
      tmpPath,
      JSON.stringify(newConfig, null, 2),
      'utf8',
    );
    await fs.promises.rename(tmpPath, configPath);

    // eslint-disable-next-line no-console
    console.log('Updated config.json successfully');
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to update config.json:', error);
    return false;
  }
}
