import { ipcMain } from 'electron';
import * as fs from 'fs/promises';
import path from 'path';
import { readConfigFile, updateConfigFile } from '../config';
import { managedEncryptionService } from '../services/managedEncryptionService';

export function registerHotCopyHandlers() {
  // Get value from JSON file at specific entry and field
  ipcMain.handle(
    'hotcopy:getValue',
    async (_event, filePath: string, entryIndex: number, fieldName: string) => {
      try {
        try {
          await fs.access(filePath);
        } catch {
          return null;
        }

        let content = await fs.readFile(filePath, 'utf-8');

        // Check if file is encrypted (.ljson)
        const extension = path.extname(filePath).toLowerCase();
        if (extension === '.ljson') {
          try {
            const encryptedData = JSON.parse(content);
            // Decrypt content
            content = await managedEncryptionService.decryptContent(
              encryptedData,
              filePath,
            );
          } catch {
            return null;
          }
        }

        const jsonData = JSON.parse(content);

        // Navigate to entries array and get the specific entry
        const { entries } = jsonData;
        if (!Array.isArray(entries)) {
          return null;
        }

        if (entryIndex < 0 || entryIndex >= entries.length) {
          return null;
        }

        const entry = entries[entryIndex];
        const value = entry[fieldName];

        if (value === undefined) {
          return null;
        }

        return value;
      } catch {
        return null;
      }
    },
  );

  // Add item to hot copy
  ipcMain.handle(
    'hotcopy:addItem',
    async (
      _event,
      filePath: string,
      entryIndex: number,
      fieldName: string,
      position: number,
      label?: string,
    ) => {
      try {
        const config = await readConfigFile();
        const hotCopy = config?.hotCopy || { items: [] };

        // Remove any existing item at this position
        hotCopy.items = hotCopy.items.filter(
          (item: any) => item.position !== position,
        );

        // Add new item
        const newItem = {
          id: `${Date.now()}-${position}`,
          filePath,
          entryIndex,
          fieldName,
          position,
          label,
        };

        hotCopy.items.push(newItem);

        await updateConfigFile({ hotCopy });
        return { success: true };
      } catch (error) {
        console.error('Error adding hot copy item:', error);
        return { success: false, error: String(error) };
      }
    },
  );

  // Remove item from hot copy
  ipcMain.handle('hotcopy:removeItem', async (_event, itemId: string) => {
    try {
      const config = await readConfigFile();
      const hotCopy = config?.hotCopy || { items: [] };

      hotCopy.items = hotCopy.items.filter((item: any) => item.id !== itemId);

      await updateConfigFile({ hotCopy });
      return { success: true };
    } catch (error) {
      console.error('Error removing hot copy item:', error);
      return { success: false, error: String(error) };
    }
  });

  // Get all hot copy items
  ipcMain.handle('hotcopy:getItems', async () => {
    try {
      const config = await readConfigFile();
      return config?.hotCopy?.items || [];
    } catch (error) {
      console.error('Error getting hot copy items:', error);
      return [];
    }
  });
}
