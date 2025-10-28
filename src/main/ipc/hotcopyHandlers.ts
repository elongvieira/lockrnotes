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
        console.log('HotCopy getValue called with:', {
          filePath,
          entryIndex,
          fieldName,
        });

        // Check if file exists
        try {
          await fs.access(filePath);
        } catch {
          console.error('File does not exist:', filePath);
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
            console.log('HotCopy: File decrypted successfully');
          } catch (decryptError) {
            console.error('HotCopy: Failed to decrypt file:', decryptError);
            return null;
          }
        }

        const jsonData = JSON.parse(content);

        // Navigate to entries array and get the specific entry
        const entries = jsonData.entries;
        if (!Array.isArray(entries)) {
          console.error('entries is not an array in file:', filePath);
          return null;
        }

        if (entryIndex < 0 || entryIndex >= entries.length) {
          console.error('entryIndex out of bounds:', entryIndex);
          return null;
        }

        const entry = entries[entryIndex];
        const value = entry[fieldName];

        if (value === undefined) {
          console.log(
            'Field not found at entry:',
            entryIndex,
            'field:',
            fieldName,
          );
          return null;
        }

        console.log('HotCopy getValue result:', value);
        return value;
      } catch (error) {
        console.error('Error getting hot copy value:', error);
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
